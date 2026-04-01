import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  const connectionString = process.env.POSTGRES_URL || process.env.STORAGE_POSTGRES_URL || process.env.DATABASE_URL || process.env.STORAGE_DATABASE_URL;
  const sql = neon(connectionString);

  if (req.method === 'GET') {
    const { category } = req.query;
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS wiki_articles (
          id VARCHAR(255) PRIMARY KEY,
          category_id VARCHAR(255) REFERENCES wiki_categories(id),
          title VARCHAR(255) NOT NULL,
          slug VARCHAR(255) UNIQUE NOT NULL,
          content TEXT NOT NULL,
          author VARCHAR(255) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          status VARCHAR(50) DEFAULT 'published'
        );
      `;

      let rows;
      if (category) {
        rows = await sql`SELECT * FROM wiki_articles WHERE category_id = ${category} ORDER BY created_at DESC`;
      } else {
        rows = await sql`SELECT * FROM wiki_articles ORDER BY created_at DESC`;
      }
      return res.status(200).json(rows);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === 'POST') {
    const { id, category_id, title, slug, content, author, status } = req.body;
    try {
      await sql`
        INSERT INTO wiki_articles (id, category_id, title, slug, content, author, status, updated_at)
        VALUES (${id}, ${category_id}, ${title}, ${slug}, ${content}, ${author}, ${status || 'published'}, CURRENT_TIMESTAMP)
        ON CONFLICT (id) DO UPDATE SET 
          category_id = EXCLUDED.category_id,
          title = EXCLUDED.title,
          slug = EXCLUDED.slug,
          content = EXCLUDED.content,
          status = EXCLUDED.status,
          updated_at = CURRENT_TIMESTAMP;
      `;
      return res.status(200).json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === 'DELETE') {
    const { id } = req.query;
    try {
      await sql`DELETE FROM wiki_articles WHERE id = ${id}`;
      return res.status(200).json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
