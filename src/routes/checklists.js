const express = require('express');
const { z } = require('zod');
const { randomUUID } = require('crypto');

const { asyncHandler } = require('../utils');
const { HttpError } = require('../errors');
const { canEditTransaction } = require('../services/permissions');
const { writeAuditLog } = require('../services/audit');

function toTemplate(row) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}

function toTemplateItem(row) {
  return {
    id: row.id,
    templateId: row.template_id,
    title: row.title,
    description: row.description,
    sortOrder: row.sort_order,
    required: row.required,
    createdAt: row.created_at,
  };
}

function toAssignedChecklist(row) {
  return {
    id: row.id,
    templateId: row.template_id,
    transactionId: row.transaction_id,
    assignedBy: row.assigned_by,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toAssignedItem(row) {
  return {
    id: row.id,
    assignedChecklistId: row.assigned_checklist_id,
    templateItemId: row.template_item_id,
    status: row.status,
    notes: row.notes,
    completedBy: row.completed_by,
    completedAt: row.completed_at,
    updatedAt: row.updated_at,
  };
}

/**
 * @param {{ pool: import('pg').Pool }} deps
 */
function createChecklistsRouter(deps) {
  const router = express.Router();

  router.post(
    '/checklist-templates',
    asyncHandler(async (req, res) => {
      const body = z
        .object({
          name: z.string().min(1),
          description: z.string().optional(),
          items: z
            .array(
              z.object({
                title: z.string().min(1),
                description: z.string().optional(),
                sortOrder: z.number().int().optional(),
                required: z.boolean().optional(),
              }),
            )
            .min(1),
        })
        .parse(req.body);

      const templateId = randomUUID();

      await deps.pool.query('BEGIN');
      try {
        const tplRes = await deps.pool.query(
          `INSERT INTO checklist_templates (id, name, description, created_by)
           VALUES ($1, $2, $3, $4)
           RETURNING *`,
          [templateId, body.name, body.description || null, req.user.id],
        );

        const items = [];
        for (const item of body.items) {
          const itemId = randomUUID();
          const rowRes = await deps.pool.query(
            `INSERT INTO checklist_template_items (id, template_id, title, description, sort_order, required)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [
              itemId,
              templateId,
              item.title,
              item.description || null,
              item.sortOrder ?? 0,
              item.required ?? true,
            ],
          );
          items.push(rowRes.rows[0]);
        }

        await writeAuditLog(deps.pool, {
          actorUserId: req.user.id,
          action: 'checklist.template.created',
          targetType: 'checklist_template',
          targetId: templateId,
          metadata: { itemCount: body.items.length },
        });

        await deps.pool.query('COMMIT');

        return res.status(201).json({ template: toTemplate(tplRes.rows[0]), items: items.map(toTemplateItem) });
      } catch (e) {
        await deps.pool.query('ROLLBACK');
        throw e;
      }
    }),
  );

  router.get(
    '/checklist-templates',
    asyncHandler(async (_req, res) => {
      const tplRes = await deps.pool.query(`SELECT * FROM checklist_templates ORDER BY created_at DESC`);
      return res.json({ templates: tplRes.rows.map(toTemplate) });
    }),
  );

  router.get(
    '/checklist-templates/:templateId',
    asyncHandler(async (req, res) => {
      const { templateId } = z.object({ templateId: z.string().uuid() }).parse(req.params);
      const tplRes = await deps.pool.query(`SELECT * FROM checklist_templates WHERE id = $1`, [templateId]);
      const template = tplRes.rows[0];
      if (!template) throw new HttpError(404, 'Template not found');

      const itemsRes = await deps.pool.query(
        `SELECT * FROM checklist_template_items WHERE template_id = $1 ORDER BY sort_order ASC, created_at ASC`,
        [templateId],
      );

      return res.json({ template: toTemplate(template), items: itemsRes.rows.map(toTemplateItem) });
    }),
  );

  router.post(
    '/transactions/:transactionId/checklists',
    asyncHandler(async (req, res) => {
      const { transactionId } = z.object({ transactionId: z.string().uuid() }).parse(req.params);
      const body = z.object({ templateId: z.string().uuid() }).parse(req.body);

      const ok = await canEditTransaction(deps.pool, transactionId, req.user.id);
      if (!ok) throw new HttpError(403, 'Forbidden');

      const tplRes = await deps.pool.query(`SELECT * FROM checklist_templates WHERE id = $1`, [body.templateId]);
      if (!tplRes.rows[0]) throw new HttpError(404, 'Template not found');

      const tplItemsRes = await deps.pool.query(
        `SELECT * FROM checklist_template_items WHERE template_id = $1 ORDER BY sort_order ASC, created_at ASC`,
        [body.templateId],
      );

      const assignedChecklistId = randomUUID();

      await deps.pool.query('BEGIN');
      try {
        const assignedRes = await deps.pool.query(
          `INSERT INTO assigned_checklists (id, template_id, transaction_id, assigned_by)
           VALUES ($1, $2, $3, $4)
           RETURNING *`,
          [assignedChecklistId, body.templateId, transactionId, req.user.id],
        );

        const assignedItems = [];
        for (const item of tplItemsRes.rows) {
          const assignedItemId = randomUUID();
          const itemRes = await deps.pool.query(
            `INSERT INTO assigned_checklist_items (id, assigned_checklist_id, template_item_id)
             VALUES ($1, $2, $3)
             RETURNING *`,
            [assignedItemId, assignedChecklistId, item.id],
          );
          assignedItems.push(itemRes.rows[0]);
        }

        await writeAuditLog(deps.pool, {
          actorUserId: req.user.id,
          action: 'checklist.assigned',
          targetType: 'assigned_checklist',
          targetId: assignedChecklistId,
          metadata: { transactionId, templateId: body.templateId },
        });

        await deps.pool.query('COMMIT');

        return res
          .status(201)
          .json({ assignedChecklist: toAssignedChecklist(assignedRes.rows[0]), items: assignedItems.map(toAssignedItem) });
      } catch (e) {
        await deps.pool.query('ROLLBACK');
        throw e;
      }
    }),
  );

  router.get(
    '/transactions/:transactionId/checklists',
    asyncHandler(async (req, res) => {
      const { transactionId } = z.object({ transactionId: z.string().uuid() }).parse(req.params);
      const ok = await canEditTransaction(deps.pool, transactionId, req.user.id);
      if (!ok) throw new HttpError(403, 'Forbidden');

      const assignedRes = await deps.pool.query(
        `SELECT * FROM assigned_checklists WHERE transaction_id = $1 ORDER BY created_at DESC`,
        [transactionId],
      );

      const checklists = [];
      for (const checklist of assignedRes.rows) {
        const itemsRes = await deps.pool.query(
          `SELECT * FROM assigned_checklist_items WHERE assigned_checklist_id = $1 ORDER BY updated_at DESC`,
          [checklist.id],
        );
        checklists.push({ assignedChecklist: toAssignedChecklist(checklist), items: itemsRes.rows.map(toAssignedItem) });
      }

      return res.json({ checklists });
    }),
  );

  router.patch(
    '/assigned-checklists/:assignedChecklistId/items/:assignedItemId',
    asyncHandler(async (req, res) => {
      const { assignedChecklistId, assignedItemId } = z
        .object({ assignedChecklistId: z.string().uuid(), assignedItemId: z.string().uuid() })
        .parse(req.params);

      const body = z
        .object({
          status: z.enum(['pending', 'completed', 'skipped']).optional(),
          notes: z.string().nullable().optional(),
        })
        .parse(req.body);

      const checklistRes = await deps.pool.query(`SELECT * FROM assigned_checklists WHERE id = $1`, [assignedChecklistId]);
      const checklist = checklistRes.rows[0];
      if (!checklist) throw new HttpError(404, 'Assigned checklist not found');

      const ok = await canEditTransaction(deps.pool, checklist.transaction_id, req.user.id);
      if (!ok) throw new HttpError(403, 'Forbidden');

      const itemRes = await deps.pool.query(
        `SELECT * FROM assigned_checklist_items WHERE id = $1 AND assigned_checklist_id = $2`,
        [assignedItemId, assignedChecklistId],
      );
      const item = itemRes.rows[0];
      if (!item) throw new HttpError(404, 'Assigned checklist item not found');

      const status = body.status || item.status;
      const completedBy = status === 'completed' ? req.user.id : null;
      const completedAt = status === 'completed' ? new Date() : null;

      const updatedRes = await deps.pool.query(
        `UPDATE assigned_checklist_items
            SET status = $3,
                notes = COALESCE($4, notes),
                completed_by = $5,
                completed_at = $6,
                updated_at = now()
          WHERE id = $1 AND assigned_checklist_id = $2
          RETURNING *`,
        [assignedItemId, assignedChecklistId, status, body.notes ?? null, completedBy, completedAt],
      );

      await writeAuditLog(deps.pool, {
        actorUserId: req.user.id,
        action: 'checklist.item.updated',
        targetType: 'assigned_checklist_item',
        targetId: assignedItemId,
        metadata: { assignedChecklistId, status },
      });

      return res.json({ item: toAssignedItem(updatedRes.rows[0]) });
    }),
  );

  return router;
}

module.exports = {
  createChecklistsRouter,
};
