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

// Security Middlewares
app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      // Echo requesting origin to support credentials: true
      callback(null, origin || true);
    },
    credentials: true,
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

// Mount Versioned API Routes (/api/v1)
app.use('/api/v1', authLimiter, apiV1Routes);

// 404 Route Handler
app.use((req: Request, res: Response) => {
  return ApiResponse.error(res, `Cannot ${req.method} ${req.originalUrl}`, 404);
});

// Global Error Middleware
app.use(errorHandler);

export default app;
