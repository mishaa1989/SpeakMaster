import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";

const connectionString = process.env.DATABASE_URL;

const pool = new Pool({
  connectionString,
  ssl: connectionString?.includes('neon.tech') || connectionString?.includes('sslmode=require')
    ? { rejectUnauthorized: false }
    : false,
});

export const db = drizzle(pool, { schema });
export { pool };
