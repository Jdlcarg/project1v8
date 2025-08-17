import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Use DATABASE_URL from environment with SSL required for Neon
const DATABASE_URL = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_ygZPzEhSBe80@ep-wispy-mode-acik8cvu-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require";

export const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});
export const db = drizzle({ client: pool, schema });