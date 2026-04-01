import { neon } from '@neondatabase/serverless';

export default async function handler(request, response) {
  try {
    const connectionString = process.env.POSTGRES_URL || process.env.STORAGE_POSTGRES_URL || process.env.DATABASE_URL || process.env.STORAGE_DATABASE_URL;
    if (!connectionString) {
        throw new Error("String de conexão não encontrada");
    }
    const sql = neon(connectionString);
    // Tabela de Usuários Admin
    await sql`
      CREATE TABLE IF NOT EXISTS admin_users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL
      );
    `;

    // Inserir usuário padrão se não existir (a senha deve ser trocada depois)
    // admin / admin123 (hash mockado ou apenas texto para teste temporário)
    await sql`
      INSERT INTO admin_users (username, password_hash)
      VALUES ('admin', 'admin123')
      ON CONFLICT (username) DO NOTHING;
    `;

    // Tabelas Wiki
    await sql`
      CREATE TABLE IF NOT EXISTS wiki_categories (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        icon VARCHAR(50)
      );
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

    // Tabelas Cupons e Banners
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

    return response.status(200).json({ message: 'Banco de dados inicializado com sucesso!' });
  } catch (error) {
    return response.status(500).json({ error: error.message });
  }
}
