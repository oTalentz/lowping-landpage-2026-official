import { sql, createPool } from '@vercel/postgres';

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Workaround for Neon DB prefix issues in Vercel
  if (!process.env.POSTGRES_URL && process.env.STORAGE_POSTGRES_URL) {
      process.env.POSTGRES_URL = process.env.STORAGE_POSTGRES_URL;
  }

  try {
    const startTime = Date.now();
    
    const db = createPool({
        connectionString: process.env.POSTGRES_URL || process.env.STORAGE_POSTGRES_URL
    });
    
    const { rows } = await db.sql`SELECT NOW() as time, version() as pg_version`;
    const endTime = Date.now();

    return res.status(200).json({ 
        status: 'ok', 
        message: 'API is running and connected to database',
        db_time: rows[0].time,
        pg_version: rows[0].pg_version,
        ping_ms: endTime - startTime,
        env_check: {
            has_url: !!process.env.POSTGRES_URL,
            has_storage_url: !!process.env.STORAGE_POSTGRES_URL,
            url_length: process.env.POSTGRES_URL ? process.env.POSTGRES_URL.length : 0
        }
    });
  } catch (error) {
    console.error('Health check failed:', error);
    return res.status(500).json({ 
        status: 'error', 
        message: 'Database connection failed',
        error: error.message,
        env_check: {
            has_url: !!process.env.POSTGRES_URL,
            has_storage_url: !!process.env.STORAGE_POSTGRES_URL
        }
    });
  }
}