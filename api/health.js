const { neon } = require('@neondatabase/serverless');
const { applySecurityHeaders, setCors, authenticateRequest } = require('./_lib/security');

async function handler(req, res) {
  applySecurityHeaders(res);
  if (!setCors(req, res, ['GET', 'OPTIONS'])) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const auth = authenticateRequest(req, res, ['admin']);
  if (!auth) return;

  try {
    const startTime = Date.now();
    const connectionString =
      process.env.POSTGRES_URL ||
      process.env.STORAGE_POSTGRES_URL ||
      process.env.DATABASE_URL ||
      process.env.STORAGE_DATABASE_URL;
    if (!connectionString) {
      return res.status(503).json({ status: 'error' });
    }

    const sql = neon(connectionString);
    await sql`SELECT NOW() as time`;

    return res.status(200).json({
      status: 'ok',
      ping_ms: Date.now() - startTime
    });
  } catch {
    return res.status(500).json({ status: 'error' });
  }
}

module.exports = handler;
