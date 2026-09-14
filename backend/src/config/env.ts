import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  allowedOrigins: process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
    : [],
  databaseUrl: process.env.DATABASE_URL || 'file:./dev.db',
  jwt: {
    secret: process.env.JWT_SECRET || 'govconnect_secure_platform_jwt_secret_key_2026_prod',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'govconnect_secure_platform_refresh_secret_key_2026_prod',
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
    port: parseInt(process.env.SMTP_PORT || '2525', 10),
    user: process.env.SMTP_USER || '',
    password: process.env.SMTP_PASSWORD || '',
    from: process.env.EMAIL_FROM || '"GovConnect Support" <no-reply@govconnect.gov.in>',
  },
  upload: {
    dir: process.env.UPLOAD_DIR || (process.env.VERCEL ? '/tmp/uploads' : './uploads'),
    maxSizeMb: parseInt(process.env.MAX_FILE_SIZE_MB || '5', 10),
  },
  digilocker: {
    mode: (process.env.DIGILOCKER_MODE || 'REPRESENTATIVE') as 'REAL_AUTHORIZED' | 'REPRESENTATIVE' | 'NOT_CONFIGURED',
    clientId: process.env.DIGILOCKER_CLIENT_ID || '',
    clientSecret: process.env.DIGILOCKER_CLIENT_SECRET || '',
    redirectUri: process.env.DIGILOCKER_REDIRECT_URI || 'http://localhost:5000/api/integrations/digilocker/callback',
    authUrl: process.env.DIGILOCKER_AUTH_URL || '',
    tokenUrl: process.env.DIGILOCKER_TOKEN_URL || '',
    apiBaseUrl: process.env.DIGILOCKER_API_BASE_URL || 'https://api.digitallocker.gov.in',
  },
  initialAdmin: {
    email: process.env.INITIAL_ADMIN_EMAIL || '',
    password: process.env.INITIAL_ADMIN_PASSWORD || '',
  },
};
