const { PutObjectCommand, GetObjectCommand, S3Client } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

function sanitizeFilename(filename) {
  return String(filename)
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, '_')
    .slice(0, 200);
}

/**
 * @param {{ bucket: string, region: string, maxSizeBytes: number, allowedContentTypes: string[], expiresInSeconds?: number, client?: any, presign?: any }} cfg
 */
function createS3Service(cfg) {
  const bucket = cfg.bucket;
  const maxSizeBytes = cfg.maxSizeBytes;
  const allowedContentTypes = cfg.allowedContentTypes;
  const expiresInSeconds = cfg.expiresInSeconds || 60 * 10;

  const client = cfg.client || new S3Client({ region: cfg.region });
  const presign = cfg.presign || getSignedUrl;

  function validateUpload({ contentType, sizeBytes }) {
    if (!allowedContentTypes.includes(contentType)) {
      return { ok: false, error: 'Unsupported content type' };
    }
    if (!Number.isFinite(sizeBytes) || sizeBytes <= 0) {
      return { ok: false, error: 'Invalid sizeBytes' };
    }
    if (sizeBytes > maxSizeBytes) {
      return { ok: false, error: 'File too large' };
    }

    return { ok: true };
  }

  async function getSignedUploadUrl({ key, contentType }) {
    const cmd = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
      ServerSideEncryption: 'AES256',
    });

    const url = await presign(client, cmd, { expiresIn: expiresInSeconds });
    return {
      bucket,
      key,
      url,
      requiredHeaders: {
        'content-type': contentType,
        'x-amz-server-side-encryption': 'AES256',
      },
    };
  }

  async function getSignedDownloadUrl({ key }) {
    const cmd = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    const url = await presign(client, cmd, { expiresIn: expiresInSeconds });
    return {
      bucket,
      key,
      url,
    };
  }

  return {
    validateUpload,
    sanitizeFilename,
    getSignedUploadUrl,
    getSignedDownloadUrl,
  };
}

module.exports = {
  createS3Service,
  sanitizeFilename,
};
