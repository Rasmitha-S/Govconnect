import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import routes from './routes/index.js';
import { errorHandler } from './middleware/error.middleware.js';

import { config } from './config/env.js';

export const createApp = () => {
  const app = express();

  // Security Headers
  app.use(
    helmet({
      contentSecurityPolicy: false, // Disabled for flexible demo iframe/API embedding
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );

  // Origins allowed to access backend APIs
  const configuredOrigins = [
    config.frontendUrl,
    ...(config.allowedOrigins || []),
  ].filter(Boolean);

  // CORS Configuration
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (e.g. same-origin serverless proxy, curl, mobile apps)
        if (!origin) return callback(null, true);

        // Allow localhost and local IP origins for development
        if (
          origin.startsWith('http://localhost:') ||
          origin.startsWith('http://127.0.0.1:') ||
          origin.endsWith('.vercel.app') ||
          configuredOrigins.includes(origin)
        ) {
          return callback(null, true);
        }

        // In development mode, allow any origin if not explicitly blocked
        if (config.nodeEnv === 'development') {
          return callback(null, true);
        }

        return callback(null, true); // Permissive fallback for seamless Vercel preview environments
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    })
  );

  // Rate Limiting (Relaxed for SIH evaluation and high-volume local testing)
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests from this client.' },
    },
  });
  app.use('/api', limiter);

  // Body Parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Health Endpoint
  app.get('/api/health', (req, res) => {
    res.status(200).json({
      success: true,
      data: {
        status: 'ONLINE',
        system: 'GovConnect Interoperability Platform',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
      },
    });
  });

  // API Routes
  app.use('/api', routes);

  // Central Error Handler
  app.use(errorHandler);

  return app;
};
