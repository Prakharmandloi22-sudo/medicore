import { memoryDb } from './memoryAdapter';
import { pgAdapter } from './pgAdapter';
import { config } from '../config';

export const db = memoryDb;
export { memoryDb, pgAdapter };
export * from './types';
