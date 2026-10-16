import dotenv from 'dotenv';
dotenv.config();

const required = ['MONGODB_URI', 'JWT_SECRET', 'CLIENT_URL'];
const missing = required.filter((key) => !process.env[key]);
if (missing.length) {
  console.error(`Missing required environment variables: ${missing.join(', ')}`);
  console.error('Copy .env.example to .env and fill in the values.');
  process.exit(1);
}
if (process.env.JWT_SECRET.length < 32) {
  console.error('JWT_SECRET must be at least 32 characters long.');
  process.exit(1);
}

const num = (key, fallback) => Number(process.env[key] || fallback);

export const env = {
  port: num('PORT', 5000),
  nodeEnv: process.env.NODE_ENV || 'development',
  isProd: process.env.NODE_ENV === 'production',
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientUrls: process.env.CLIENT_URL.split(',').map((s) => s.trim().replace(/\/$/, '')),
  r2: {
    accountId: process.env.R2_ACCOUNT_ID,
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    videoBucket: process.env.R2_VIDEO_BUCKET,
    imageBucket: process.env.R2_IMAGE_BUCKET,
    imagePublicUrl: (process.env.R2_IMAGE_PUBLIC_URL || '').replace(/\/$/, ''),
  },
  limits: {
    maxVideoBytes: num('MAX_VIDEO_SIZE_MB', 500) * 1024 * 1024,
    maxImageBytes: num('MAX_IMAGE_SIZE_MB', 5) * 1024 * 1024,
    uploadUrlTtl: num('UPLOAD_URL_TTL_SECONDS', 900),
    playbackUrlTtl: num('PLAYBACK_URL_TTL_SECONDS', 3600),
  },
};
