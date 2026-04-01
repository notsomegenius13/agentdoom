import { neon, type NeonQueryFunction } from '@neondatabase/serverless';

/**
 * Database client for AgentDoom
 * Uses Neon serverless PostgreSQL with connection pooling
 */

let sql: NeonQueryFunction<false, false> | null = null;

export function getDb() {
  if (!sql) {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    sql = neon(databaseUrl, { fullResults: false, arrayMode: false });
  }
  return sql;
}

export { SCHEMA_SQL } from './schema';
