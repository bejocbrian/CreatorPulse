const { config } = require('./config');
const { createPool } = require('./db/pool');
const { runMigrations } = require('./db/migrate');
const { createS3Service } = require('./services/s3');
const { createApp } = require('./app');

async function main() {
  if (!config.databaseUrl) {
    // eslint-disable-next-line no-console
    console.error('DATABASE_URL is required');
    process.exit(1);
  }

  const pool = createPool({ connectionString: config.databaseUrl });

  if (config.migrateOnStart) {
    await runMigrations(pool);
  }

  const s3 = createS3Service(config.s3);

  const app = createApp({ pool, services: { s3 }, config });

  const server = app.listen(config.port, () => {
    // eslint-disable-next-line no-console
    console.log(`Listening on :${config.port}`);
  });

  const shutdown = async () => {
    server.close(() => undefined);
    await pool.end();
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
