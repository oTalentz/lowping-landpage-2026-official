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
      CREATE TABLE IF NOT EXISTS wiki_categories (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE,
        description TEXT,
        icon VARCHAR(50)
      );
    `;
    try {
      await sql`ALTER TABLE wiki_categories ADD COLUMN IF NOT EXISTS slug VARCHAR(255) UNIQUE;`;
    } catch {
    }
  } catch {
    return res.status(500).json({ error: 'Falha ao preparar recurso de categorias' });
  }

  if (req.method === 'GET') {
    try {
      const count = await sql`SELECT COUNT(*)::int AS count FROM wiki_categories`;
      if (parseInt(count[0].count) === 0) {
        await sql`
          INSERT INTO wiki_categories (id, name, slug, description, icon)
          VALUES
            ('geral', 'Visão Geral', 'geral', 'Dúvidas frequentes, termos de serviço e guias introdutórios para novos usuários.', 'dashboard'),
            ('minecraft', 'Minecraft', 'minecraft', 'Tudo sobre instalação de plugins, mods, otimização de performance e gestão de mundos.', 'sports_esports'),
            ('vps', 'VPS Hosting', 'vps', 'Guias para Linux, Windows, configuração de firewall e administração avançada de servidores.', 'dns'),
            ('financeiro', 'Financeiro', 'financeiro', 'Informações sobre métodos de pagamento, renovações, faturas e políticas de reembolso.', 'payments'),
            ('seguranca', 'Segurança', 'seguranca', 'Melhores práticas para manter seu servidor seguro.', 'security')
          ON CONFLICT (id) DO NOTHING;
        `;
      }

      const rows = await sql`SELECT * FROM wiki_categories ORDER BY name ASC`;
      return res.status(200).json(rows);
    } catch {
      return res.status(500).json({ error: 'Falha ao listar categorias' });
    }
  }

  if (req.method === 'POST') {
    const auth = authenticateRequest(req, res, ['admin']);
    if (!auth) return;

    const body = parseJsonBody(req);
    if (!body) return res.status(400).json({ error: 'Corpo JSON inválido' });

    const id = typeof body.id === 'string' ? body.id.trim() : '';
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const slugRaw = typeof body.slug === 'string' ? body.slug.trim() : id;
    const slug = slugRaw.toLowerCase().replace(/\s+/g, '-');
    const description = typeof body.description === 'string' ? body.description : '';
    const icon = typeof body.icon === 'string' ? body.icon : '';

    if (!isSafeId(id) || !isSafeId(slug) || name.length < 2 || name.length > 120) {
      return res.status(400).json({ error: 'Dados inválidos da categoria' });
    }
    if (description.length > 1000 || icon.length > 80) return res.status(400).json({ error: 'Dados inválidos da categoria' });

    try {
      await sql`
        INSERT INTO wiki_categories (id, name, slug, description, icon)
        VALUES (${id}, ${name}, ${slug || id}, ${description}, ${icon})
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          slug = EXCLUDED.slug,
          description = EXCLUDED.description,
          icon = EXCLUDED.icon;
      `;
      return res.status(200).json({ success: true });
    } catch {
      return res.status(500).json({ error: 'Falha ao salvar categoria' });
    }
  }

  if (req.method === 'DELETE') {
    const auth = authenticateRequest(req, res, ['admin']);
    if (!auth) return;

    const { id } = req.query;
    if (!isSafeId(id)) return res.status(400).json({ error: 'ID inválido' });
    try {
      await sql`DELETE FROM wiki_categories WHERE id = ${id}`;
      return res.status(200).json({ success: true });
    } catch {
      return res.status(500).json({ error: 'Falha ao excluir categoria' });
    }
  }

  return res.status(405).json({ error: 'Método não permitido' });
}

module.exports = handler;
