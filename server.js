import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';
import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import { isR2Configured } from './config/r2.js';
import { ApiError } from './utils/ApiError.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/authRoutes.js';
import movieRoutes from './routes/movieRoutes.js';
import myListRoutes from './routes/myListRoutes.js';
import watchHistoryRoutes from './routes/watchHistoryRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

const app = express();

// Needed on Render/Railway etc. so rate limiting sees the real client IP
if (env.isProd) app.set('trust proxy', 1);

app.use(helmet());
app.use(
  cors({
    origin: (origin, cb) =>
      !origin || env.clientUrls.includes(origin)
        ? cb(null, true)
        : cb(new ApiError(403, 'This origin is not allowed by CORS')),
  })
);
app.use(express.json({ limit: '50kb' }));
app.use(morgan(env.isProd ? 'combined' : 'dev'));

app.get('/api/health', (req, res) => {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  res.json({
    status: 'ok',
    uptimeSeconds: Math.round(process.uptime()),
    database: states[mongoose.connection.readyState],
    storageConfigured: isR2Configured(),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/my-list', myListRoutes);
app.use('/api/watch-history', watchHistoryRoutes);
app.use('/api/admin', adminRoutes);

app.use(notFound);
app.use(errorHandler);

process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err);
});

await connectDB();
app.listen(env.port, () => {
  console.log(`API running on http://localhost:${env.port} (${env.nodeEnv})`);
});
