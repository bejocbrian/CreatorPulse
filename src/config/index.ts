import dotenv from 'dotenv';

dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  apiVersion: process.env.API_VERSION || 'v1',

  database: {
    url: process.env.DATABASE_URL || '',
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret-change-me',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    prices: {
      starter: process.env.STRIPE_PRICE_ID_STARTER || '',
      professional: process.env.STRIPE_PRICE_ID_PROFESSIONAL || '',
      enterprise: process.env.STRIPE_PRICE_ID_ENTERPRISE || '',
    },
  },

  aws: {
    region: process.env.AWS_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },

  s3: {
    bucketName: process.env.S3_BUCKET_NAME || '',
    region: process.env.S3_BUCKET_REGION || 'us-east-1',
  },

  ses: {
    fromEmail: process.env.SES_FROM_EMAIL || '',
    fromName: process.env.SES_FROM_NAME || 'Checklist App',
    region: process.env.SES_REGION || 'us-east-1',
  },

  frontend: {
    url: process.env.FRONTEND_URL || 'http://localhost:3001',
  },

  logging: {
    level: process.env.LOG_LEVEL || 'info',
    filePath: process.env.LOG_FILE_PATH || './logs',
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },

  subscriptionLimits: {
    FREE: {
      documents: parseInt(process.env.FREE_TIER_DOCUMENTS || '10', 10),
      storageMB: parseInt(process.env.FREE_TIER_STORAGE_MB || '100', 10),
      checklists: parseInt(process.env.FREE_TIER_CHECKLISTS || '5', 10),
    },
    STARTER: {
      documents: parseInt(process.env.STARTER_TIER_DOCUMENTS || '100', 10),
      storageMB: parseInt(process.env.STARTER_TIER_STORAGE_MB || '1000', 10),
      checklists: parseInt(process.env.STARTER_TIER_CHECKLISTS || '50', 10),
    },
    PROFESSIONAL: {
      documents: parseInt(process.env.PROFESSIONAL_TIER_DOCUMENTS || '1000', 10),
      storageMB: parseInt(process.env.PROFESSIONAL_TIER_STORAGE_MB || '10000', 10),
      checklists: parseInt(process.env.PROFESSIONAL_TIER_CHECKLISTS || '500', 10),
    },
    ENTERPRISE: {
      documents: parseInt(process.env.ENTERPRISE_TIER_DOCUMENTS || '-1', 10),
      storageMB: parseInt(process.env.ENTERPRISE_TIER_STORAGE_MB || '-1', 10),
      checklists: parseInt(process.env.ENTERPRISE_TIER_CHECKLISTS || '-1', 10),
    },
  },
};
