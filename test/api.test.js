const fs = require('fs');
const path = require('path');

const request = require('supertest');
const { newDb } = require('pg-mem');

const { createApp } = require('../src/app');
const { config: defaultConfig } = require('../src/config');

function createMockS3({ maxSizeBytes = 25 * 1024 * 1024, allowedContentTypes = ['application/pdf'] } = {}) {
  return {
    validateUpload({ contentType, sizeBytes }) {
      if (!allowedContentTypes.includes(contentType)) return { ok: false, error: 'Unsupported content type' };
      if (sizeBytes > maxSizeBytes) return { ok: false, error: 'File too large' };
      return { ok: true };
    },
    sanitizeFilename(filename) {
      return String(filename).replace(/\s+/g, '_');
    },
    async getSignedUploadUrl({ key, contentType }) {
      return {
        bucket: 'test-bucket',
        key,
        url: `https://example.com/upload?key=${encodeURIComponent(key)}`,
        requiredHeaders: {
          'content-type': contentType,
          'x-amz-server-side-encryption': 'AES256',
        },
      };
    },
    async getSignedDownloadUrl({ key }) {
      return {
        bucket: 'test-bucket',
        key,
        url: `https://example.com/download?key=${encodeURIComponent(key)}`,
      };
    },
  };
}

async function createTestApp() {
  const db = newDb({ autoCreateForeignKeyIndices: true });
  db.public.registerFunction({ name: 'now', returns: 'timestamptz', implementation: () => new Date() });

  const pg = db.adapters.createPg();
  const pool = new pg.Pool();

  const migration = fs.readFileSync(path.join(__dirname, '../migrations/001_init.sql'), 'utf8');
  await pool.query(migration);

  const cfg = JSON.parse(JSON.stringify(defaultConfig));
  cfg.s3.bucket = 'test-bucket';

  const app = createApp({ pool, services: { s3: createMockS3() }, config: cfg });

  return { app, pool };
}

describe('Documents service API', () => {
  test('folder permissions: view cannot edit', async () => {
    const { app, pool } = await createTestApp();

    const owner = 'user-owner';
    const viewer = 'user-viewer';

    const folderRes = await request(app)
      .post('/folders')
      .set('X-User-Id', owner)
      .send({ name: 'Root' })
      .expect(201);

    const folderId = folderRes.body.id;

    await request(app)
      .get(`/folders/${folderId}`)
      .set('X-User-Id', viewer)
      .expect(403);

    await request(app)
      .post(`/folders/${folderId}/permissions`)
      .set('X-User-Id', owner)
      .send({ userId: viewer, role: 'view' })
      .expect(201);

    await request(app)
      .get(`/folders/${folderId}`)
      .set('X-User-Id', viewer)
      .expect(200);

    await request(app)
      .patch(`/folders/${folderId}`)
      .set('X-User-Id', viewer)
      .send({ name: 'Hacked' })
      .expect(403);

    await pool.end();
  });

  test('document upload: validates size/type and enforces encryption header', async () => {
    const { app, pool } = await createTestApp();

    const owner = 'user-owner';

    const folderRes = await request(app)
      .post('/folders')
      .set('X-User-Id', owner)
      .send({ name: 'Root' })
      .expect(201);

    const folderId = folderRes.body.id;

    const uploadRes = await request(app)
      .post('/documents/upload-url')
      .set('X-User-Id', owner)
      .send({
        folderId,
        title: 'Contract',
        filename: 'contract.pdf',
        contentType: 'application/pdf',
        sizeBytes: 1234,
      })
      .expect(201);

    expect(uploadRes.body.upload.url).toContain('https://example.com/upload');
    expect(uploadRes.body.upload.requiredHeaders['x-amz-server-side-encryption']).toBe('AES256');

    await request(app)
      .post('/documents/upload-url')
      .set('X-User-Id', owner)
      .send({
        folderId,
        title: 'BadType',
        filename: 'x.exe',
        contentType: 'application/x-msdownload',
        sizeBytes: 100,
      })
      .expect(400);

    const app2 = createApp({
      pool,
      services: { s3: createMockS3({ maxSizeBytes: 10, allowedContentTypes: ['application/pdf'] }) },
      config: { ...defaultConfig, s3: { ...defaultConfig.s3, bucket: 'test-bucket' } },
    });

    await request(app2)
      .post('/documents/upload-url')
      .set('X-User-Id', owner)
      .send({
        folderId,
        title: 'TooBig',
        filename: 'contract.pdf',
        contentType: 'application/pdf',
        sizeBytes: 11,
      })
      .expect(400);

    await pool.end();
  });

  test('sign role can initiate e-sign but cannot upload versions', async () => {
    const { app, pool } = await createTestApp();

    const owner = 'user-owner';
    const signer = 'user-signer';

    const folderRes = await request(app)
      .post('/folders')
      .set('X-User-Id', owner)
      .send({ name: 'Root' })
      .expect(201);

    const folderId = folderRes.body.id;

    await request(app)
      .post(`/folders/${folderId}/permissions`)
      .set('X-User-Id', owner)
      .send({ userId: signer, role: 'sign' })
      .expect(201);

    const uploadRes = await request(app)
      .post('/documents/upload-url')
      .set('X-User-Id', owner)
      .send({
        folderId,
        title: 'Contract',
        filename: 'contract.pdf',
        contentType: 'application/pdf',
        sizeBytes: 1234,
      })
      .expect(201);

    const documentId = uploadRes.body.document.id;

    await request(app)
      .post(`/documents/${documentId}/esign/docusign/envelopes`)
      .set('X-User-Id', signer)
      .send({ recipientUserId: signer })
      .expect(200);

    await request(app)
      .post(`/documents/${documentId}/versions/upload-url`)
      .set('X-User-Id', signer)
      .send({ filename: 'v2.pdf', contentType: 'application/pdf', sizeBytes: 10 })
      .expect(403);

    await pool.end();
  });
});
