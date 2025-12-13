const { randomUUID } = require('crypto');

/**
 * @param {import('pg').Pool} pool
 * @param {{ actorUserId: string, action: string, targetType: string, targetId: string, metadata?: any }} entry
 */
async function writeAuditLog(pool, entry) {
  await pool.query(
    `INSERT INTO audit_logs (id, actor_user_id, action, target_type, target_id, metadata)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [randomUUID(), entry.actorUserId, entry.action, entry.targetType, entry.targetId, entry.metadata || null],
  );
}

module.exports = {
  writeAuditLog,
};
