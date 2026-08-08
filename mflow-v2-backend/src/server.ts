import app from './app';
import { ENV } from './config/env';
import { prisma } from './config/db';

const PORT = parseInt(ENV.PORT, 10) || 8080;

async function bootstrap() {
  try {
    // Verify database connectivity
    await prisma.$connect();
    console.log('Connected to PostgreSQL database via Prisma ORM.');

    app.listen(PORT, () => {
      console.log(`mflow v2 API server running at: http://localhost:${PORT}`);
      console.log(`Interactive Swagger UI available at: http://localhost:${PORT}/api-docs`);
      console.log(`Health Check available at: http://localhost:${PORT}/health`);
      console.log(`API v1 Base URL: http://localhost:${PORT}/api/v1`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap();
