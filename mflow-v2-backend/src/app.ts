import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import { swaggerDocument } from './config/swagger';
import apiV1Routes from './routes/index';
import { errorHandler } from './middlewares/error.middleware';
import { ApiResponse } from './utils/response.util';

const app: Application = express();

// Trust Nginx reverse proxy — required for rate limiting and IP detection
app.set('trust proxy', 1);

// Security & CORS Configuration
const allowedOrigins = [
  'https://mflowpos.com',
  'https://www.mflowpos.com',
  'https://admin.mflowpos.com',
  'https://mflowpos-v2.pages.dev',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'http://localhost:8080',
];

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin) || origin.endsWith('.pages.dev')) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// Rate Limiting for Auth
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again after 15 minutes',
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Interactive Swagger API Documentation Endpoint
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Health Check
app.get('/health', (req: Request, res: Response) => {
  return ApiResponse.success(res, { status: 'UP', timestamp: new Date().toISOString() }, 'API Service Health Normal');
});

// Root API Engine Live Endpoint
app.get('/', (req: Request, res: Response) => {
  return ApiResponse.success(
    res,
    {
      version: '2.0.0',
      status: 'ONLINE',
      docs: 'https://api.mflowpos.com/api-docs',
      health: 'https://api.mflowpos.com/health',
    },
    'mFlow POS v2 API Engine Live'
  );
});

// Mount Versioned API Routes (/api/v1)
app.use('/api/v1', authLimiter, apiV1Routes);

import path from 'path';
import fs from 'fs';

// Serve compiled frontend SPA static assets if present
const frontendDist = path.resolve(__dirname, '../../mflow-v2-frontend/dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (req: Request, res: Response, next: any) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/health') || req.path.startsWith('/api-docs')) {
      return next();
    }
    const indexPath = path.join(frontendDist, 'index.html');
    if (fs.existsSync(indexPath)) {
      return res.sendFile(indexPath);
    }
    return next();
  });
}

// 404 Route Handler for unmatched API endpoints
app.use((req: Request, res: Response) => {
  return ApiResponse.error(res, `Cannot ${req.method} ${req.originalUrl}`, 404);
});

// Global Error Middleware
app.use(errorHandler);

export default app;
