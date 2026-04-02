const { neon } = require('@neondatabase/serverless');
const { applySecurityHeaders, setCors, hashPassword } = require('./_lib/security');

async function handler(request, response) {
  applySecurityHeaders(response);
  if (!setCors(request, response, ['POST', 'OPTIONS'])) return;

  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Método não permitido' });
  }

  const initKey = request.headers['x-init-key'];
  if (!process.env.DB_INIT_KEY || initKey !== process.env.DB_INIT_KEY) {
    return response.status(403).json({ error: 'Acesso negado' });
  }

  try {
    const connectionString =
      process.env.POSTGRES_URL ||
      process.env.STORAGE_POSTGRES_URL ||
      process.env.DATABASE_URL ||
      process.env.STORAGE_DATABASE_URL;
    if (!connectionString) {
      return response.status(500).json({ error: 'Serviço indisponível' });
    }

    const sql = neon(connectionString);

    await sql`
      CREATE TABLE IF NOT EXISTS admin_users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'admin',
        active BOOLEAN DEFAULT TRUE
      );
    `;
    try {
      await sql`ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'admin';`;
      await sql`ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT TRUE;`;
    } catch {
    }

    const fallbackAdminPassword = 'admin1234';
    const configuredBootstrapPassword = process.env.ADMIN_BOOTSTRAP_PASSWORD;
    const bootstrapPassword =
      typeof configuredBootstrapPassword === 'string' && configuredBootstrapPassword.length >= 8
        ? configuredBootstrapPassword
        : fallbackAdminPassword;
    await sql`
      INSERT INTO admin_users (username, password_hash, role, active)
      VALUES ('admin', ${hashPassword(bootstrapPassword)}, 'admin', TRUE)
      ON CONFLICT (username) DO NOTHING;
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS wiki_categories (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE,
        description TEXT,
        icon VARCHAR(50)
      );
    `;

    await sql`
      INSERT INTO wiki_categories (id, name, slug, description, icon)
      VALUES
        ('geral', 'Visão Geral', 'geral', 'Termos de serviço e guias introdutórios.', 'dashboard'),
        ('minecraft', 'Minecraft', 'minecraft', 'Tudo sobre instalação de plugins, mods, otimização de performance.', 'sports_esports'),
        ('vps', 'VPS Hosting', 'vps', 'Guias para Linux, Windows, configuração de firewall e administração.', 'dns'),
        ('financeiro', 'Financeiro', 'financeiro', 'Informações sobre métodos de pagamento, renovações e faturas.', 'payments'),
        ('seguranca', 'Segurança', 'seguranca', 'Melhores práticas para manter seu servidor seguro.', 'security'),
        ('painel', 'Painel', 'painel', 'Guias de uso do painel de controle, criação de servidor, backup e ações rápidas.', 'tune')
      ON CONFLICT (id) DO NOTHING;
    `;

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

    await sql`
      CREATE TABLE IF NOT EXISTS coupons (
        id VARCHAR(255) PRIMARY KEY,
        code VARCHAR(50) UNIQUE NOT NULL,
        discount INTEGER NOT NULL,
        uses INTEGER DEFAULT 0,
        max_uses INTEGER NOT NULL,
        valid_until TIMESTAMP WITH TIME ZONE,
        status VARCHAR(50) DEFAULT 'active'
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS banners (
        id VARCHAR(255) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        image_url TEXT NOT NULL,
        link_url TEXT,
        active BOOLEAN DEFAULT true,
        order_index INTEGER DEFAULT 0
      );
    `;

    return response.status(200).json({ success: true });
  } catch {
    return response.status(500).json({ error: 'Falha na inicialização' });
  }
}

module.exports = handler;
