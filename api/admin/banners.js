import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  const connectionString = process.env.POSTGRES_URL || process.env.STORAGE_POSTGRES_URL || process.env.DATABASE_URL || process.env.STORAGE_DATABASE_URL;
  const sql = neon(connectionString);

  if (req.method === 'GET') {
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS banners (
          id VARCHAR(255) PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          image_url TEXT,
          link_url TEXT,
          active BOOLEAN DEFAULT true,
          order_index INTEGER DEFAULT 0
        );
      `;
      const rows = await sql`SELECT * FROM banners ORDER BY order_index ASC`;
      return res.status(200).json(rows);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === 'POST') {
    const { id, title, image_url, link_url, active, order_index } = req.body;
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS banners (
          id VARCHAR(255) PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          image_url TEXT,
          link_url TEXT,
          active BOOLEAN DEFAULT true,
          order_index INTEGER DEFAULT 0
        );
      `;
      
      await sql`
        INSERT INTO banners (id, title, image_url, link_url, active, order_index)
        VALUES (${id}, ${title}, ${image_url || ''}, ${link_url || ''}, ${active !== undefined ? active : true}, ${order_index || 0})
        ON CONFLICT (id) DO UPDATE SET 
          title = EXCLUDED.title,
          image_url = EXCLUDED.image_url,
          link_url = EXCLUDED.link_url,
          active = EXCLUDED.active,
          order_index = EXCLUDED.order_index;
      `;
      return res.status(200).json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === 'DELETE') {
    const { id } = req.query;
    try {
      await sql`DELETE FROM banners WHERE id = ${id}`;
      return res.status(200).json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
