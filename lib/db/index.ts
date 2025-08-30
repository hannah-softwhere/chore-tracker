import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

// Get the database URL from environment variables
const sql = neon(process.env.DATABASE_URL!);

// Create the database instance with Drizzle
export const db = drizzle(sql, { schema });

// Export the schema for use in other files
export * from './schema';
