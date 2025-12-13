const express = require('express');
const { z } = require('zod');
const { randomUUID } = require('crypto');

const { asyncHandler } = require('../utils');
const { writeAuditLog } = require('../services/audit');

/**
 * @param {{ pool: import('pg').Pool, config: any }} deps
 */
function createWebhooksRouter(deps) {
  const router = express.Router();

  router.post(
    '/docusign',
    asyncHandler(async (req, res) => {
      const secret = deps.config.webhooks?.docusignSecret;
      if (secret) {
        const provided = req.header('x-webhook-secret');
        if (provided !== secret) return res.status(401).json({ error: { message: 'Invalid webhook secret' } });
      }

      const body = z.any().parse(req.body);

      await writeAuditLog(deps.pool, {
        actorUserId: 'webhook:docusign',
        action: 'webhook.docusign.received',
        targetType: 'webhook',
        targetId: randomUUID(),
        metadata: body,
      });

      return res.json({ ok: true });
    }),
  );

  return router;
}

module.exports = {
  createWebhooksRouter,
};
