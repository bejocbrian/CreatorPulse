const { HttpError } = require('../errors');

function toCapabilities(isOwner, roles) {
  if (isOwner) return { canRead: true, canEdit: true, canSign: true };

  const set = new Set(roles.filter(Boolean));
  return {
    canRead: set.size > 0,
    canEdit: set.has('edit'),
    canSign: set.has('sign'),
  };
}

/**
 * @param {import('pg').Pool} pool
 * @param {string} folderId
 * @param {string} userId
 */
async function getFolderAndAccess(pool, folderId, userId) {
  const folderRes = await pool.query('SELECT * FROM folders WHERE id = $1', [folderId]);
  const folder = folderRes.rows[0];
  if (!folder) return null;

  if (folder.owner_user_id === userId) {
    return {
      folder,
      access: toCapabilities(true, []),
      roles: ['owner'],
    };
  }

  const permRes = await pool.query(
    `SELECT role
       FROM sharing_permissions
      WHERE scope_type = 'folder' AND scope_id = $1 AND user_id = $2`,
    [folderId, userId],
  );

  const roles = permRes.rows.map((r) => r.role);
  return {
    folder,
    access: toCapabilities(false, roles),
    roles,
  };
}

/**
 * @param {import('pg').Pool} pool
 * @param {string} documentId
 * @param {string} userId
 */
async function getDocumentAndAccess(pool, documentId, userId) {
  const docRes = await pool.query('SELECT * FROM documents WHERE id = $1', [documentId]);
  const document = docRes.rows[0];
  if (!document) return null;

  const folderAccess = await getFolderAndAccess(pool, document.folder_id, userId);
  const isOwner = folderAccess?.folder?.owner_user_id === userId;
  if (isOwner) {
    return {
      document,
      folder: folderAccess.folder,
      access: toCapabilities(true, []),
      roles: ['owner'],
    };
  }

  const docPermRes = await pool.query(
    `SELECT role
       FROM sharing_permissions
      WHERE scope_type = 'document' AND scope_id = $1 AND user_id = $2`,
    [documentId, userId],
  );

  const roles = [...(folderAccess?.roles || []), ...docPermRes.rows.map((r) => r.role)];
  return {
    document,
    folder: folderAccess?.folder || null,
    access: toCapabilities(false, roles),
    roles,
  };
}

/**
 * Transaction access is derived from any folder linked to the transaction.
 * @param {import('pg').Pool} pool
 * @param {string} transactionId
 * @param {string} userId
 */
async function canEditTransaction(pool, transactionId, userId) {
  const owned = await pool.query(
    `SELECT 1 FROM folders WHERE transaction_id = $1 AND owner_user_id = $2 LIMIT 1`,
    [transactionId, userId],
  );
  if (owned.rowCount > 0) return true;

  const shared = await pool.query(
    `SELECT 1
       FROM folders f
       JOIN sharing_permissions sp
         ON sp.scope_type = 'folder' AND sp.scope_id = f.id
      WHERE f.transaction_id = $1 AND sp.user_id = $2 AND sp.role = 'edit'
      LIMIT 1`,
    [transactionId, userId],
  );

  return shared.rowCount > 0;
}

function requireAccess(access, capability) {
  if (!access) throw new HttpError(404, 'Not found');
  if (!access[capability]) throw new HttpError(403, 'Forbidden');
}

module.exports = {
  getFolderAndAccess,
  getDocumentAndAccess,
  canEditTransaction,
  requireAccess,
};
