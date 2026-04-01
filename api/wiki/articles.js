const { neon } = require('@neondatabase/serverless');
const {
  applySecurityHeaders,
  setCors,
  parseJsonBody,
  authenticateRequest,
  isSafeId
} = require('../_lib/security');

async function handler(req, res) {
  applySecurityHeaders(res);
  if (!setCors(req, res, ['GET', 'POST', 'DELETE', 'OPTIONS'])) return;

  if (!['GET', 'POST', 'DELETE'].includes(req.method)) {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const connectionString =
    process.env.POSTGRES_URL ||
    process.env.STORAGE_POSTGRES_URL ||
    process.env.DATABASE_URL ||
    process.env.STORAGE_DATABASE_URL;
  if (!connectionString) return res.status(500).json({ error: 'Serviço indisponível' });

  const sql = neon(connectionString);

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
        status VARCHAR(50) DEFAULT 'published',
        featured BOOLEAN DEFAULT FALSE
      );
    `;
    try {
      await sql`ALTER TABLE wiki_articles ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT FALSE;`;
    } catch {
    }
  } catch {
    return res.status(500).json({ error: 'Falha ao preparar recurso de artigos' });
  }

  if (req.method === 'GET') {
    const { category } = req.query;
    try {
      let rows;
      if (category && isSafeId(category)) {
        rows = await sql`SELECT * FROM wiki_articles WHERE category_id = ${category} ORDER BY created_at DESC`;
      } else {
        rows = await sql`SELECT * FROM wiki_articles ORDER BY created_at DESC`;
      }
      return res.status(200).json(rows);
    } catch {
      return res.status(500).json({ error: 'Falha ao listar artigos' });
    }
  }

  if (req.method === 'POST') {
    const auth = authenticateRequest(req, res, ['admin']);
    if (!auth) return;

    const body = parseJsonBody(req);
    if (!body) return res.status(400).json({ error: 'Corpo JSON inválido' });

    const id = typeof body.id === 'string' ? body.id.trim() : '';
    const categoryId = typeof body.category_id === 'string' ? body.category_id.trim() : null;
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const slug = typeof body.slug === 'string' ? body.slug.trim() : '';
    const content = typeof body.content === 'string' ? body.content : '';
    const author = typeof body.author === 'string' && body.author.length <= 120 ? body.author : 'Admin';
    const status = body.status === 'draft' ? 'draft' : 'published';
    const featured = Boolean(body.featured);

    if (!isSafeId(id) || !isSafeId(slug) || title.length < 3 || title.length > 180 || content.length < 10 || content.length > 200000) {
      return res.status(400).json({ error: 'Campos obrigatórios inválidos' });
    }
    if (categoryId && !isSafeId(categoryId)) {
      return res.status(400).json({ error: 'Categoria inválida' });
    }

    try {
      await sql`
        INSERT INTO wiki_articles (id, category_id, title, slug, content, author, status, featured, updated_at)
        VALUES (${id}, ${categoryId || null}, ${title}, ${slug}, ${content}, ${author}, ${status}, ${featured}, CURRENT_TIMESTAMP)
        ON CONFLICT (id) DO UPDATE SET
          category_id = EXCLUDED.category_id,
          title = EXCLUDED.title,
          slug = EXCLUDED.slug,
          content = EXCLUDED.content,
          status = EXCLUDED.status,
          featured = EXCLUDED.featured,
          updated_at = CURRENT_TIMESTAMP;
      `;
      return res.status(200).json({ success: true });
    } catch {
      return res.status(500).json({ error: 'Falha ao salvar artigo' });
    }
  }

  if (req.method === 'DELETE') {
    const auth = authenticateRequest(req, res, ['admin']);
    if (!auth) return;

    const { id } = req.query;
    if (!isSafeId(id)) return res.status(400).json({ error: 'ID inválido' });
    try {
      await sql`DELETE FROM wiki_articles WHERE id = ${id}`;
      return res.status(200).json({ success: true });
    } catch {
      return res.status(500).json({ error: 'Falha ao excluir artigo' });
    }
  }

  return res.status(405).json({ error: 'Método não permitido' });
}

module.exports = handler;
