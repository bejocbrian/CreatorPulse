const { config } = require('../config');
const { createPool } = require('./pool');
const { runMigrations } = require('./migrate');

async function main() {
  if (!config.databaseUrl) {
    // eslint-disable-next-line no-console
    console.error('DATABASE_URL is required');
    process.exit(1);
  }

  const pool = createPool({ connectionString: config.databaseUrl });
  try {
    await runMigrations(pool);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
