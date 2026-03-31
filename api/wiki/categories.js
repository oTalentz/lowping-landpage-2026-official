import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { rows } = await sql`SELECT * FROM wiki_categories ORDER BY name ASC`;
      return res.status(200).json(rows);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === 'POST') {
    const { id, name, description, icon } = req.body;
    try {
      await sql`
        INSERT INTO wiki_categories (id, name, description, icon)
        VALUES (${id}, ${name}, ${description}, ${icon})
        ON CONFLICT (id) DO UPDATE SET 
          name = EXCLUDED.name, 
          description = EXCLUDED.description, 
          icon = EXCLUDED.icon;
      `;
      return res.status(200).json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === 'DELETE') {
    const { id } = req.query;
    try {
      await sql`DELETE FROM wiki_categories WHERE id = ${id}`;
      return res.status(200).json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
