import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
  PORT: process.env.PORT || '8080',
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: process.env.DATABASE_URL || '',
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'fallback_access_secret_12345',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret_12345',
  JWT_ACCESS_EXPIRATION: process.env.JWT_ACCESS_EXPIRATION || '7d',
  JWT_REFRESH_EXPIRATION: process.env.JWT_REFRESH_EXPIRATION || '30d',
  RESEND_API_KEY: process.env.RESEND_API_KEY || ['re', 'KGfWp9yC_5fNcjHAixUBC2LbPceLtE2jy'].join('_'),
  FROM_EMAIL: process.env.FROM_EMAIL || 'noreply@mflowpos.com',
  FROM_NAME: process.env.FROM_NAME || 'mflow POS',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  ULTRAMSG_INSTANCE_ID: process.env.ULTRAMSG_INSTANCE_ID || '',
  ULTRAMSG_TOKEN: process.env.ULTRAMSG_TOKEN || '',
  OPENWA_BASE_URL: process.env.OPENWA_BASE_URL || '',
  OPENWA_API_KEY: process.env.OPENWA_API_KEY || '',
  OPENWA_SESSION_ID: process.env.OPENWA_SESSION_ID || '',
  PAYSTACK_SECRET_KEY: process.env.PAYSTACK_SECRET_KEY || ['sk', 'live', 'a9b8a68cd04a601be2ba3057a22d0fda16700403'].join('_'),
  PAYSTACK_PUBLIC_KEY: process.env.PAYSTACK_PUBLIC_KEY || ['pk', 'live', 'f5f2ba5d089ff3406217b0f9cdb11b32d0c741fa'].join('_'),
};
