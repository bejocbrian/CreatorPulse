const express = require('express');
const { z } = require('zod');
const { randomUUID } = require('crypto');

const { asyncHandler } = require('../utils');
const { HttpError } = require('../errors');
const { getFolderAndAccess, getDocumentAndAccess, requireAccess } = require('../services/permissions');
const { writeAuditLog } = require('../services/audit');

function toDocument(row) {
  return {
    id: row.id,
    folderId: row.folder_id,
    title: row.title,
    description: row.description,
    propertyId: row.property_id,
    transactionId: row.transaction_id,
    transactionStage: row.transaction_stage,
    currentVersionId: row.current_version_id,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toVersion(row) {
  return {
    id: row.id,
    documentId: row.document_id,
    versionNumber: row.version_number,
    filename: row.filename,
    contentType: row.content_type,
    sizeBytes: row.size_bytes == null ? null : Number(row.size_bytes),
    sha256: row.sha256,
    s3Bucket: row.s3_bucket,
    s3Key: row.s3_key,
    uploadedBy: row.uploaded_by,
    createdAt: row.created_at,
  };
}

function toNote(row) {
  return {
    id: row.id,
    documentId: row.document_id,
    documentVersionId: row.document_version_id,
    body: row.body,
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}

function toPermission(row) {
  return {
    id: row.id,
    scopeType: row.scope_type,
    scopeId: row.scope_id,
    userId: row.user_id,
    role: row.role,
    invitedBy: row.invited_by,
    createdAt: row.created_at,
  };
}

/**
 * @param {{ pool: import('pg').Pool, s3: any, config: any }} deps
 */
function createDocumentsRouter(deps) {
  const router = express.Router();

  router.post(
    '/upload-url',
    asyncHandler(async (req, res) => {
      const body = z
        .object({
          folderId: z.string().uuid(),
          title: z.string().min(1),
          description: z.string().optional(),
          filename: z.string().min(1),
          contentType: z.string().min(1),
          sizeBytes: z.number().int().positive(),
          propertyId: z.string().uuid().nullable().optional(),
          transactionId: z.string().uuid().nullable().optional(),
          transactionStage: z.string().nullable().optional(),
        })
        .parse(req.body);

      const folderAccess = await getFolderAndAccess(deps.pool, body.folderId, req.user.id);
      if (!folderAccess) throw new HttpError(404, 'Folder not found');
      requireAccess(folderAccess.access, 'canEdit');

      const validation = deps.s3.validateUpload({ contentType: body.contentType, sizeBytes: body.sizeBytes });
      if (!validation.ok) throw new HttpError(400, validation.error);

      const documentId = randomUUID();
      const versionId = randomUUID();
      const versionNumber = 1;

      const filename = deps.s3.sanitizeFilename(body.filename);
      const s3Key = `documents/${documentId}/v${versionNumber}/${filename}`;

      const propertyId = body.propertyId ?? folderAccess.folder.property_id ?? null;
      const transactionId = body.transactionId ?? folderAccess.folder.transaction_id ?? null;
      const transactionStage = body.transactionStage ?? folderAccess.folder.transaction_stage ?? null;

      await deps.pool.query('BEGIN');
      try {
        const docRes = await deps.pool.query(
          `INSERT INTO documents (id, folder_id, title, description, property_id, transaction_id, transaction_stage, created_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           RETURNING *`,
          [
            documentId,
            body.folderId,
            body.title,
            body.description || null,
            propertyId,
            transactionId,
            transactionStage,
            req.user.id,
          ],
        );

        await deps.pool.query(
          `INSERT INTO document_versions (id, document_id, version_number, s3_bucket, s3_key, filename, content_type, size_bytes, uploaded_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            versionId,
            documentId,
            versionNumber,
            deps.config.s3.bucket,
            s3Key,
            filename,
            body.contentType,
            body.sizeBytes,
            req.user.id,
          ],
        );

        await writeAuditLog(deps.pool, {
          actorUserId: req.user.id,
          action: 'document.created',
          targetType: 'document',
          targetId: documentId,
          metadata: { folderId: body.folderId },
        });

        await writeAuditLog(deps.pool, {
          actorUserId: req.user.id,
          action: 'document.version.created',
          targetType: 'document_version',
          targetId: versionId,
          metadata: { documentId, versionNumber },
        });

        await deps.pool.query('COMMIT');

        const signed = await deps.s3.getSignedUploadUrl({ key: s3Key, contentType: body.contentType });

        return res.status(201).json({
          document: toDocument(docRes.rows[0]),
          version: { id: versionId, versionNumber },
          upload: {
            url: signed.url,
            requiredHeaders: signed.requiredHeaders,
            bucket: signed.bucket,
            key: signed.key,
          },
        });
      } catch (e) {
        await deps.pool.query('ROLLBACK');
        throw e;
      }
    }),
  );

  router.post(
    '/:documentId/versions/upload-url',
    asyncHandler(async (req, res) => {
      const { documentId } = z.object({ documentId: z.string().uuid() }).parse(req.params);
      const body = z
        .object({
          filename: z.string().min(1),
          contentType: z.string().min(1),
          sizeBytes: z.number().int().positive(),
        })
        .parse(req.body);

      const docAccess = await getDocumentAndAccess(deps.pool, documentId, req.user.id);
      if (!docAccess) throw new HttpError(404, 'Document not found');
      requireAccess(docAccess.access, 'canEdit');

      const validation = deps.s3.validateUpload({ contentType: body.contentType, sizeBytes: body.sizeBytes });
      if (!validation.ok) throw new HttpError(400, validation.error);

      const maxRes = await deps.pool.query(
        `SELECT COALESCE(MAX(version_number), 0) AS max
           FROM document_versions
          WHERE document_id = $1`,
        [documentId],
      );
      const versionNumber = Number(maxRes.rows[0].max) + 1;

      const versionId = randomUUID();
      const filename = deps.s3.sanitizeFilename(body.filename);
      const s3Key = `documents/${documentId}/v${versionNumber}/${filename}`;

      await deps.pool.query(
        `INSERT INTO document_versions (id, document_id, version_number, s3_bucket, s3_key, filename, content_type, size_bytes, uploaded_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          versionId,
          documentId,
          versionNumber,
          deps.config.s3.bucket,
          s3Key,
          filename,
          body.contentType,
          body.sizeBytes,
          req.user.id,
        ],
      );

      await writeAuditLog(deps.pool, {
        actorUserId: req.user.id,
        action: 'document.version.created',
        targetType: 'document_version',
        targetId: versionId,
        metadata: { documentId, versionNumber },
      });

      const signed = await deps.s3.getSignedUploadUrl({ key: s3Key, contentType: body.contentType });

      return res.status(201).json({
        version: { id: versionId, versionNumber },
        upload: { url: signed.url, requiredHeaders: signed.requiredHeaders, bucket: signed.bucket, key: signed.key },
      });
    }),
  );

  router.post(
    '/:documentId/versions/:versionId/complete',
    asyncHandler(async (req, res) => {
      const { documentId, versionId } = z
        .object({ documentId: z.string().uuid(), versionId: z.string().uuid() })
        .parse(req.params);
      const body = z
        .object({
          sha256: z.string().min(1).optional(),
          sizeBytes: z.number().int().positive().optional(),
        })
        .parse(req.body);

      const docAccess = await getDocumentAndAccess(deps.pool, documentId, req.user.id);
      if (!docAccess) throw new HttpError(404, 'Document not found');
      requireAccess(docAccess.access, 'canEdit');

      const versionRes = await deps.pool.query(
        `SELECT * FROM document_versions WHERE id = $1 AND document_id = $2`,
        [versionId, documentId],
      );
      const version = versionRes.rows[0];
      if (!version) throw new HttpError(404, 'Version not found');

      await deps.pool.query('BEGIN');
      try {
        await deps.pool.query(
          `UPDATE document_versions
              SET sha256 = COALESCE($3, sha256),
                  size_bytes = COALESCE($4, size_bytes)
            WHERE id = $1 AND document_id = $2`,
          [versionId, documentId, body.sha256 || null, body.sizeBytes || null],
        );

        await deps.pool.query(
          `UPDATE documents
              SET current_version_id = $2,
                  updated_at = now()
            WHERE id = $1`,
          [documentId, versionId],
        );

        await writeAuditLog(deps.pool, {
          actorUserId: req.user.id,
          action: 'document.version.completed',
          targetType: 'document_version',
          targetId: versionId,
          metadata: { documentId },
        });

        await deps.pool.query('COMMIT');
      } catch (e) {
        await deps.pool.query('ROLLBACK');
        throw e;
      }

      return res.json({ ok: true });
    }),
  );

  router.get(
    '/:documentId',
    asyncHandler(async (req, res) => {
      const { documentId } = z.object({ documentId: z.string().uuid() }).parse(req.params);
      const docAccess = await getDocumentAndAccess(deps.pool, documentId, req.user.id);
      if (!docAccess) throw new HttpError(404, 'Document not found');
      requireAccess(docAccess.access, 'canRead');

      return res.json(toDocument(docAccess.document));
    }),
  );

  router.get(
    '/:documentId/versions',
    asyncHandler(async (req, res) => {
      const { documentId } = z.object({ documentId: z.string().uuid() }).parse(req.params);
      const docAccess = await getDocumentAndAccess(deps.pool, documentId, req.user.id);
      if (!docAccess) throw new HttpError(404, 'Document not found');
      requireAccess(docAccess.access, 'canRead');

      const versionsRes = await deps.pool.query(
        `SELECT * FROM document_versions WHERE document_id = $1 ORDER BY version_number DESC`,
        [documentId],
      );

      return res.json({ versions: versionsRes.rows.map(toVersion) });
    }),
  );

  router.get(
    '/:documentId/versions/:versionId/download-url',
    asyncHandler(async (req, res) => {
      const { documentId, versionId } = z
        .object({ documentId: z.string().uuid(), versionId: z.string().uuid() })
        .parse(req.params);

      const docAccess = await getDocumentAndAccess(deps.pool, documentId, req.user.id);
      if (!docAccess) throw new HttpError(404, 'Document not found');
      requireAccess(docAccess.access, 'canRead');

      const versionRes = await deps.pool.query(
        `SELECT * FROM document_versions WHERE id = $1 AND document_id = $2`,
        [versionId, documentId],
      );
      const version = versionRes.rows[0];
      if (!version) throw new HttpError(404, 'Version not found');

      const signed = await deps.s3.getSignedDownloadUrl({ key: version.s3_key });

      return res.json({ download: { url: signed.url, bucket: signed.bucket, key: signed.key } });
    }),
  );

  router.get(
    '/:documentId/notes',
    asyncHandler(async (req, res) => {
      const { documentId } = z.object({ documentId: z.string().uuid() }).parse(req.params);

      const docAccess = await getDocumentAndAccess(deps.pool, documentId, req.user.id);
      if (!docAccess) throw new HttpError(404, 'Document not found');
      requireAccess(docAccess.access, 'canRead');

      const notesRes = await deps.pool.query(
        `SELECT * FROM document_notes WHERE document_id = $1 ORDER BY created_at DESC`,
        [documentId],
      );

      return res.json({ notes: notesRes.rows.map(toNote) });
    }),
  );

  router.post(
    '/:documentId/notes',
    asyncHandler(async (req, res) => {
      const { documentId } = z.object({ documentId: z.string().uuid() }).parse(req.params);
      const body = z
        .object({
          body: z.string().min(1),
          documentVersionId: z.string().uuid().nullable().optional(),
        })
        .parse(req.body);

      const docAccess = await getDocumentAndAccess(deps.pool, documentId, req.user.id);
      if (!docAccess) throw new HttpError(404, 'Document not found');
      if (!docAccess.access.canEdit && !docAccess.access.canSign) throw new HttpError(403, 'Forbidden');

      if (body.documentVersionId) {
        const versionRes = await deps.pool.query(
          `SELECT 1 FROM document_versions WHERE id = $1 AND document_id = $2`,
          [body.documentVersionId, documentId],
        );
        if (versionRes.rowCount === 0) throw new HttpError(400, 'documentVersionId does not belong to document');
      }

      const id = randomUUID();
      const result = await deps.pool.query(
        `INSERT INTO document_notes (id, document_id, document_version_id, body, created_by)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [id, documentId, body.documentVersionId || null, body.body, req.user.id],
      );

      await writeAuditLog(deps.pool, {
        actorUserId: req.user.id,
        action: 'document.note.created',
        targetType: 'document_note',
        targetId: id,
        metadata: { documentId },
      });

      return res.status(201).json(toNote(result.rows[0]));
    }),
  );

  router.get(
    '/:documentId/permissions',
    asyncHandler(async (req, res) => {
      const { documentId } = z.object({ documentId: z.string().uuid() }).parse(req.params);
      const docAccess = await getDocumentAndAccess(deps.pool, documentId, req.user.id);
      if (!docAccess) throw new HttpError(404, 'Document not found');
      requireAccess(docAccess.access, 'canEdit');

      const result = await deps.pool.query(
        `SELECT * FROM sharing_permissions
          WHERE scope_type = 'document' AND scope_id = $1
          ORDER BY created_at DESC`,
        [documentId],
      );

      return res.json({ permissions: result.rows.map(toPermission) });
    }),
  );

  router.post(
    '/:documentId/permissions',
    asyncHandler(async (req, res) => {
      const { documentId } = z.object({ documentId: z.string().uuid() }).parse(req.params);
      const body = z
        .object({
          userId: z.string().min(1),
          role: z.enum(['view', 'edit', 'sign']),
        })
        .parse(req.body);

      const docAccess = await getDocumentAndAccess(deps.pool, documentId, req.user.id);
      if (!docAccess) throw new HttpError(404, 'Document not found');
      requireAccess(docAccess.access, 'canEdit');

      const id = randomUUID();

      const result = await deps.pool.query(
        `INSERT INTO sharing_permissions (id, scope_type, scope_id, user_id, role, invited_by)
         VALUES ($1, 'document', $2, $3, $4, $5)
         ON CONFLICT (scope_type, scope_id, user_id)
         DO UPDATE SET role = EXCLUDED.role, invited_by = EXCLUDED.invited_by
         RETURNING *`,
        [id, documentId, body.userId, body.role, req.user.id],
      );

      await writeAuditLog(deps.pool, {
        actorUserId: req.user.id,
        action: 'document.permission.upserted',
        targetType: 'document',
        targetId: documentId,
        metadata: { userId: body.userId, role: body.role },
      });

      return res.status(201).json(toPermission(result.rows[0]));
    }),
  );

  router.post(
    '/:documentId/esign/docusign/envelopes',
    asyncHandler(async (req, res) => {
      const { documentId } = z.object({ documentId: z.string().uuid() }).parse(req.params);
      const body = z
        .object({
          recipientUserId: z.string().min(1).optional(),
          message: z.string().optional(),
        })
        .parse(req.body);

      const docAccess = await getDocumentAndAccess(deps.pool, documentId, req.user.id);
      if (!docAccess) throw new HttpError(404, 'Document not found');
      if (!docAccess.access.canSign && !docAccess.access.canEdit) throw new HttpError(403, 'Forbidden');

      const envelopeId = randomUUID();

      await writeAuditLog(deps.pool, {
        actorUserId: req.user.id,
        action: 'esign.docusign.envelope.created',
        targetType: 'document',
        targetId: documentId,
        metadata: { envelopeId, ...body },
      });

      return res.json({ envelopeId, provider: 'docusign' });
    }),
  );

  return router;
}

module.exports = {
  createDocumentsRouter,
};
