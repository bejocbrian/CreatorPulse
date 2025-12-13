import dotenv from 'dotenv';

dotenv.config();

export type AppEnv = {
  nodeEnv: string;
  port: number;
  appBaseUrl: string;

  jwtAccessSecret: string;
  jwtRefreshSecret: string;
  accessTokenTtlSeconds: number;
  refreshTokenTtlDays: number;

  cookieSecure: boolean;
  cookieNameRefreshToken: string;

  exposeEmailTokensInResponse: boolean;
};

function readBool(value: string | undefined, defaultValue: boolean): boolean {
  if (value == null) return defaultValue;
  return value === 'true' || value === '1';
}

function readInt(value: string | undefined, defaultValue: number): number {
  if (value == null) return defaultValue;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : defaultValue;
}

export function getEnv(): AppEnv {
  const nodeEnv = process.env.NODE_ENV ?? 'development';

  return {
    nodeEnv,
    port: readInt(process.env.PORT, 3000),
    appBaseUrl: process.env.APP_BASE_URL ?? 'http://localhost:3000',

    jwtAccessSecret: process.env.JWT_ACCESS_SECRET ?? 'dev_access_secret',
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET ?? 'dev_refresh_secret',
    accessTokenTtlSeconds: readInt(process.env.ACCESS_TOKEN_TTL_SECONDS, 15 * 60),
    refreshTokenTtlDays: readInt(process.env.REFRESH_TOKEN_TTL_DAYS, 30),

    cookieSecure: readBool(process.env.COOKIE_SECURE, nodeEnv === 'production'),
    cookieNameRefreshToken: process.env.COOKIE_NAME_REFRESH_TOKEN ?? 'refresh_token',

    exposeEmailTokensInResponse: readBool(process.env.EXPOSE_EMAIL_TOKENS_IN_RESPONSE, nodeEnv === 'test')
  };
}
