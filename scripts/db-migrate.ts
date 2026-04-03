/**
 * DB schema migration script — applies SCHEMA_SQL to Neon.
 * Safe to re-run: all statements use CREATE IF NOT EXISTS.
 *
 * Usage: npx tsx scripts/db-migrate.ts
 * Requires: DATABASE_URL environment variable
 */

import { neon } from '@neondatabase/serverless';
import { SCHEMA_SQL } from '../lib/db/schema';

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('ERROR: DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  const sql = neon(databaseUrl);

  console.log('Applying DB schema...');
  await sql.query(SCHEMA_SQL);
  console.log('Schema applied successfully.');
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
