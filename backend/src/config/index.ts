import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'medicore-super-secure-production-ready-jwt-secret-key-2026',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/medicore',
  useMemoryDb: process.env.USE_MEMORY_DB === 'true' || process.env.NODE_ENV === 'test',
  analyticsServiceUrl: process.env.ANALYTICS_SERVICE_URL || 'http://localhost:8000',
  fhirMockUrl: process.env.FHIR_MOCK_URL || 'http://localhost:5000/api/v1/fhir',
  corsOrigin: process.env.CORS_ORIGIN || '*',
};
