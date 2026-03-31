import { sql } from '@vercel/postgres';

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

  try {
    const startTime = Date.now();
    const { rows } = await sql`SELECT NOW() as time, version() as pg_version`;
    const endTime = Date.now();

    return res.status(200).json({ 
        status: 'ok', 
        message: 'API is running and connected to database',
        db_time: rows[0].time,
        pg_version: rows[0].pg_version,
        ping_ms: endTime - startTime,
        env_check: {
            has_url: !!process.env.POSTGRES_URL,
            has_user: !!process.env.POSTGRES_USER,
            has_host: !!process.env.POSTGRES_HOST
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
            has_user: !!process.env.POSTGRES_USER,
            has_host: !!process.env.POSTGRES_HOST
        }
    });
  }
}