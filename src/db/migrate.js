const fs = require('fs');
const path = require('path');

/**
 * @param {import('pg').Pool} pool
 * @param {{ migrationsDir?: string }} [opts]
 */
async function runMigrations(pool, opts = {}) {
  const migrationsDir = opts.migrationsDir || path.join(__dirname, '../../migrations');
  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    await pool.query(sql);
  }
}

module.exports = {
  runMigrations,
};
