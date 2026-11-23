import { createApp } from './app';
import { config } from './config';

const app = createApp();

const server = app.listen(config.port, () => {
  console.log(`[MediCore] Backend API running at http://localhost:${config.port}`);
  console.log(`[MediCore] Environment: ${config.nodeEnv}`);
  console.log(`[MediCore] Health check available at http://localhost:${config.port}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[MediCore] SIGTERM signal received: closing HTTP server...');
  server.close(() => {
    console.log('[MediCore] HTTP server closed gracefully.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('[MediCore] SIGINT received: shutting down...');
  server.close(() => {
    console.log('[MediCore] HTTP server closed gracefully.');
    process.exit(0);
  });
});
