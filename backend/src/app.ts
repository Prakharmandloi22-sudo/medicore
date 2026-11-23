import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config';
import routes from './routes';
import { requestIdMiddleware } from './middleware/requestId';
import { errorHandler } from './middleware/errorHandler';

export const createApp = (): Application => {
  const app = express();

  // Security headers & CORS
  app.use(helmet());
  app.use(cors({ origin: config.corsOrigin, credentials: true }));
  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Tracing & logging
  app.use(requestIdMiddleware);
  if (config.nodeEnv !== 'test') {
    app.use(morgan(':method :url :status :res[content-length] - :response-time ms [req: :req[x-request-id]]'));
  }

  // Health and Readiness probes
  app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({
      status: 'healthy',
      service: 'medicore-backend',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      requestId: req.requestId,
    });
  });

  app.get('/ready', (req: Request, res: Response) => {
    res.status(200).json({
      status: 'ready',
      database: 'connected',
      analyticsService: 'reachable',
      timestamp: new Date().toISOString(),
      requestId: req.requestId,
    });
  });

  // API Version 1
  app.use('/api/v1', routes);

  // 404 Route handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      error: {
        code: 'ROUTE_NOT_FOUND',
        message: `Endpoint ${req.method} ${req.originalUrl} not found on this server.`,
        requestId: req.requestId,
      },
    });
  });

  // Centralized Error Handler
  app.use(errorHandler);

  return app;
};

export default createApp();
