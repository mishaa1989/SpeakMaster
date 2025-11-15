import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool } from "@neondatabase/serverless";
import * as schema from "@shared/schema";
import ws from "ws";

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL!,
  // @ts-ignore - ws type compatibility
  webSocketConstructor: ws
});
export const db = drizzle(pool, { schema });
