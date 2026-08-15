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
  RESEND_API_KEY: process.env.RESEND_API_KEY || '',
  FROM_EMAIL: process.env.FROM_EMAIL || 'noreply@mflowpos.com',
  FROM_NAME: process.env.FROM_NAME || 'mflow pos',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  ULTRAMSG_INSTANCE_ID: process.env.ULTRAMSG_INSTANCE_ID || '',
  ULTRAMSG_TOKEN: process.env.ULTRAMSG_TOKEN || '',
};
