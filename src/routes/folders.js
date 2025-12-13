const express = require('express');
const { z } = require('zod');
const { randomUUID } = require('crypto');

const { asyncHandler } = require('../utils');
const { HttpError } = require('../errors');
const { getFolderAndAccess, requireAccess } = require('../services/permissions');
const { writeAuditLog } = require('../services/audit');

function toFolder(row) {
  return {
    id: row.id,
    name: row.name,
    parentFolderId: row.parent_folder_id,
    propertyId: row.property_id,
    transactionId: row.transaction_id,
    transactionStage: row.transaction_stage,
    ownerUserId: row.owner_user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
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
 * @param {{ pool: import('pg').Pool }} deps
 */
function createFoldersRouter(deps) {
  const router = express.Router();

  router.post(
    '/',
    asyncHandler(async (req, res) => {
      const body = z
        .object({
          name: z.string().min(1),
          parentFolderId: z.string().uuid().nullable().optional(),
          propertyId: z.string().uuid().nullable().optional(),
          transactionId: z.string().uuid().nullable().optional(),
          transactionStage: z.string().nullable().optional(),
        })
        .parse(req.body);

      const id = randomUUID();
      const ownerUserId = req.user.id;

      if (body.parentFolderId) {
        const parentAccess = await getFolderAndAccess(deps.pool, body.parentFolderId, ownerUserId);
        if (!parentAccess) throw new HttpError(404, 'Parent folder not found');
        requireAccess(parentAccess.access, 'canEdit');
      }

      const result = await deps.pool.query(
        `INSERT INTO folders (id, name, parent_folder_id, property_id, transaction_id, transaction_stage, owner_user_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          id,
          body.name,
          body.parentFolderId || null,
          body.propertyId || null,
          body.transactionId || null,
          body.transactionStage || null,
          ownerUserId,
        ],
      );

      await writeAuditLog(deps.pool, {
        actorUserId: ownerUserId,
        action: 'folder.created',
        targetType: 'folder',
        targetId: id,
        metadata: { name: body.name },
      });

      return res.status(201).json(toFolder(result.rows[0]));
    }),
  );

  router.get(
    '/',
    asyncHandler(async (req, res) => {
      const query = z
        .object({
          parentFolderId: z.string().uuid().optional(),
          transactionId: z.string().uuid().optional(),
          propertyId: z.string().uuid().optional(),
        })
        .parse(req.query);

      const userId = req.user.id;

      const filters = [];
      const values = [userId];
      let idx = values.length;

      if (query.parentFolderId) {
        idx += 1;
        values.push(query.parentFolderId);
        filters.push(`f.parent_folder_id = $${idx}`);
      }
      if (query.transactionId) {
        idx += 1;
        values.push(query.transactionId);
        filters.push(`f.transaction_id = $${idx}`);
      }
      if (query.propertyId) {
        idx += 1;
        values.push(query.propertyId);
        filters.push(`f.property_id = $${idx}`);
      }

      const whereExtra = filters.length ? ` AND ${filters.join(' AND ')}` : '';

      const result = await deps.pool.query(
        `SELECT DISTINCT f.*
           FROM folders f
           LEFT JOIN sharing_permissions sp
             ON sp.scope_type = 'folder' AND sp.scope_id = f.id AND sp.user_id = $1
          WHERE (f.owner_user_id = $1 OR sp.user_id = $1)
          ${whereExtra}
          ORDER BY f.created_at DESC`,
        values,
      );

      return res.json({ folders: result.rows.map(toFolder) });
    }),
  );

  router.get(
    '/:folderId',
    asyncHandler(async (req, res) => {
      const { folderId } = z.object({ folderId: z.string().uuid() }).parse(req.params);

      const access = await getFolderAndAccess(deps.pool, folderId, req.user.id);
      if (!access) throw new HttpError(404, 'Folder not found');
      requireAccess(access.access, 'canRead');

      return res.json(toFolder(access.folder));
    }),
  );

  router.patch(
    '/:folderId',
    asyncHandler(async (req, res) => {
      const { folderId } = z.object({ folderId: z.string().uuid() }).parse(req.params);
      const body = z
        .object({
          name: z.string().min(1).optional(),
          propertyId: z.string().uuid().nullable().optional(),
          transactionId: z.string().uuid().nullable().optional(),
          transactionStage: z.string().nullable().optional(),
        })
        .parse(req.body);

      const access = await getFolderAndAccess(deps.pool, folderId, req.user.id);
      if (!access) throw new HttpError(404, 'Folder not found');
      requireAccess(access.access, 'canEdit');

      const updates = [];
      const values = [folderId];
      let idx = values.length;

      if (body.name !== undefined) {
        idx += 1;
        values.push(body.name);
        updates.push(`name = $${idx}`);
      }
      if (body.propertyId !== undefined) {
        idx += 1;
        values.push(body.propertyId);
        updates.push(`property_id = $${idx}`);
      }
      if (body.transactionId !== undefined) {
        idx += 1;
        values.push(body.transactionId);
        updates.push(`transaction_id = $${idx}`);
      }
      if (body.transactionStage !== undefined) {
        idx += 1;
        values.push(body.transactionStage);
        updates.push(`transaction_stage = $${idx}`);
      }

      if (updates.length === 0) {
        return res.json(toFolder(access.folder));
      }

      updates.push('updated_at = now()');

      const result = await deps.pool.query(
        `UPDATE folders SET ${updates.join(', ')} WHERE id = $1 RETURNING *`,
        values,
      );

      await writeAuditLog(deps.pool, {
        actorUserId: req.user.id,
        action: 'folder.updated',
        targetType: 'folder',
        targetId: folderId,
        metadata: body,
      });

      return res.json(toFolder(result.rows[0]));
    }),
  );

  router.delete(
    '/:folderId',
    asyncHandler(async (req, res) => {
      const { folderId } = z.object({ folderId: z.string().uuid() }).parse(req.params);
      const access = await getFolderAndAccess(deps.pool, folderId, req.user.id);
      if (!access) throw new HttpError(404, 'Folder not found');
      requireAccess(access.access, 'canEdit');

      await deps.pool.query('DELETE FROM folders WHERE id = $1', [folderId]);

      await writeAuditLog(deps.pool, {
        actorUserId: req.user.id,
        action: 'folder.deleted',
        targetType: 'folder',
        targetId: folderId,
      });

      return res.status(204).send();
    }),
  );

  router.get(
    '/:folderId/permissions',
    asyncHandler(async (req, res) => {
      const { folderId } = z.object({ folderId: z.string().uuid() }).parse(req.params);
      const access = await getFolderAndAccess(deps.pool, folderId, req.user.id);
      if (!access) throw new HttpError(404, 'Folder not found');
      requireAccess(access.access, 'canEdit');

      const result = await deps.pool.query(
        `SELECT * FROM sharing_permissions
          WHERE scope_type = 'folder' AND scope_id = $1
          ORDER BY created_at DESC`,
        [folderId],
      );

      return res.json({ permissions: result.rows.map(toPermission) });
    }),
  );

  router.post(
    '/:folderId/permissions',
    asyncHandler(async (req, res) => {
      const { folderId } = z.object({ folderId: z.string().uuid() }).parse(req.params);
      const body = z
        .object({
          userId: z.string().min(1),
          role: z.enum(['view', 'edit', 'sign']),
        })
        .parse(req.body);

      const access = await getFolderAndAccess(deps.pool, folderId, req.user.id);
      if (!access) throw new HttpError(404, 'Folder not found');
      requireAccess(access.access, 'canEdit');

      const id = randomUUID();

      const result = await deps.pool.query(
        `INSERT INTO sharing_permissions (id, scope_type, scope_id, user_id, role, invited_by)
         VALUES ($1, 'folder', $2, $3, $4, $5)
         ON CONFLICT (scope_type, scope_id, user_id)
         DO UPDATE SET role = EXCLUDED.role, invited_by = EXCLUDED.invited_by
         RETURNING *`,
        [id, folderId, body.userId, body.role, req.user.id],
      );

      await writeAuditLog(deps.pool, {
        actorUserId: req.user.id,
        action: 'folder.permission.upserted',
        targetType: 'folder',
        targetId: folderId,
        metadata: { userId: body.userId, role: body.role },
      });

      return res.status(201).json(toPermission(result.rows[0]));
    }),
  );

  return router;
}

module.exports = {
  createFoldersRouter,
};
