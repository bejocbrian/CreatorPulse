function parseIntEnv(value, defaultValue) {
  if (value == null || value === '') return defaultValue;
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : defaultValue;
}

function parseListEnv(value, defaultValue) {
  if (value == null || value === '') return defaultValue;
  return value
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
}

const config = {
  port: parseIntEnv(process.env.PORT, 3000),
  databaseUrl: process.env.DATABASE_URL,
  migrateOnStart: String(process.env.DB_MIGRATE_ON_START || '').toLowerCase() === 'true',

  s3: {
    region: process.env.S3_REGION || 'us-east-1',
    bucket: process.env.S3_BUCKET || 'documents-bucket',
    maxSizeBytes: parseIntEnv(process.env.S3_MAX_SIZE_BYTES, 25 * 1024 * 1024),
    allowedContentTypes: parseListEnv(
      process.env.S3_ALLOWED_CONTENT_TYPES,
      ['application/pdf', 'image/jpeg', 'image/png'],
    ),
  },

  webhooks: {
    docusignSecret: process.env.DOCUSIGN_WEBHOOK_SECRET || null,
  },
};

module.exports = {
  config,
};
