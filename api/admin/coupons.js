import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'OPTIONS') {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('admin_token_')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  const connectionString = process.env.POSTGRES_URL || process.env.STORAGE_POSTGRES_URL || process.env.DATABASE_URL || process.env.STORAGE_DATABASE_URL;
  const sql = neon(connectionString);

  if (req.method === 'GET') {
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS coupons (
          id VARCHAR(255) PRIMARY KEY,
          code VARCHAR(255) NOT NULL,
          discount INTEGER NOT NULL,
          uses INTEGER DEFAULT 0,
          max_uses INTEGER NOT NULL,
          valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
          status VARCHAR(50) DEFAULT 'active'
        );
      `;
      const rows = await sql`SELECT * FROM coupons ORDER BY id DESC`;
      return res.status(200).json(rows);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === 'POST') {
    const { id, code, discount, uses, max_uses, valid_until, status } = req.body;
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS coupons (
          id VARCHAR(255) PRIMARY KEY,
          code VARCHAR(255) NOT NULL,
          discount INTEGER NOT NULL,
          uses INTEGER DEFAULT 0,
          max_uses INTEGER NOT NULL,
          valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
          status VARCHAR(50) DEFAULT 'active'
        );
      `;
      
      await sql`
        INSERT INTO coupons (id, code, discount, uses, max_uses, valid_until, status)
        VALUES (${id}, ${code}, ${discount}, ${uses || 0}, ${max_uses}, ${valid_until}, ${status || 'active'})
        ON CONFLICT (id) DO UPDATE SET 
          code = EXCLUDED.code,
          discount = EXCLUDED.discount,
          uses = EXCLUDED.uses,
          max_uses = EXCLUDED.max_uses,
          valid_until = EXCLUDED.valid_until,
          status = EXCLUDED.status;
      `;
      return res.status(200).json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === 'DELETE') {
    const { id } = req.query;
    try {
      await sql`DELETE FROM coupons WHERE id = ${id}`;
      return res.status(200).json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
