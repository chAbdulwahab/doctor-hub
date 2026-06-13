import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import dns from 'dns';

// Force Node to use IPv4 DNS resolution first (bypasses IPv6 timeouts)
dns.setDefaultResultOrder('ipv4first');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ override: true });
dotenv.config({ path: path.resolve(__dirname, '../../.env'), override: true });

const { Pool } = pg;

let connectionString = process.env.DATABASE_URL;

if (connectionString) {
  connectionString = connectionString.split('?')[0];
}

console.log('Database URL resolved in pool config:', connectionString);

if (!connectionString) {
  console.error('CRITICAL: DATABASE_URL environment variable is missing.');
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }, // ✅ always on — Supabase requires it
  family: 4                           // ✅ force IPv4 — fixes ETIMEDOUT
});

pool.on('error', (err) => {
  console.error('Unexpected database client pool error:', err);
});

export const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV === 'development') {
      console.log('Executed query:', { text, duration, rowsCount: res.rowCount });
    }
    return res;
  } catch (error) {
    console.error('Database query execution error:', { text, error: error.message });
    throw error;
  }
};

export default pool;