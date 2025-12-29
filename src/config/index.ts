import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Server
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isDev: process.env.NODE_ENV !== 'production',

  // Database
  database: {
    url: process.env.DATABASE_URL,
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    name: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: process.env.DB_SSL === 'true',
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  // CORS
  cors: {
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
    allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(','),
  },

  // AWS
  aws: {
    region: process.env.AWS_REGION || 'eu-north-1',
    s3Bucket: process.env.AWS_S3_BUCKET || 'alashed-media',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },

  // AI
  gemini: {
    apiKey: process.env.GEMINI_API_KEY,
  },

  // Webkassa (Фискализация РК)
  webkassa: {
    apiUrl: process.env.WEBKASSA_API_URL || 'https://devkkm.webkassa.kz/api',
    token: process.env.WEBKASSA_TOKEN,
    cashboxId: process.env.WEBKASSA_CASHBOX_ID,
    testMode: process.env.WEBKASSA_TEST_MODE !== 'false',
  },
} as const;

// Validate required config
export function validateConfig(): void {
  const required = ['JWT_SECRET'];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0 && !config.isDev) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}
