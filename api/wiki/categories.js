import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  const connectionString = process.env.POSTGRES_URL || process.env.STORAGE_POSTGRES_URL || process.env.DATABASE_URL || process.env.STORAGE_DATABASE_URL;
  const sql = neon(connectionString);
  if (req.method === 'GET') {
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
      } catch(e) {
        console.error("Erro ao adicionar coluna slug", e);
      }

      // Inserir categorias padrão se a tabela estiver vazia
      const count = await sql`SELECT COUNT(*) FROM wiki_categories`;
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
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === 'POST') {
    const { id, name, slug, description, icon } = req.body;
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
