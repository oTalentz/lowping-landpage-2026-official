import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  // CORS Headers for API
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    let body;
    if (typeof req.body === 'string') {
        try {
            body = JSON.parse(req.body);
        } catch (e) {
            console.error('Invalid JSON body:', e);
            return res.status(400).json({ error: 'Invalid JSON body' });
        }
    } else {
        body = req.body;
    }

    const { username, password } = body;

    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Usuário e senha são obrigatórios' });
    }

    try {
        console.log(`Tentando conectar ao banco para usuário: ${username}`);
        
        // Verifica se a tabela existe antes de fazer a query
        try {
            await sql`SELECT 1 FROM admin_users LIMIT 1`;
        } catch (tableCheckError) {
            console.log('Tabela admin_users não encontrada, criando e inicializando...', tableCheckError.message);
            try {
                await sql`
                CREATE TABLE IF NOT EXISTS admin_users (
                    id SERIAL PRIMARY KEY,
                    username VARCHAR(255) UNIQUE NOT NULL,
                    password_hash VARCHAR(255) NOT NULL
                );
                `;
                await sql`
                INSERT INTO admin_users (username, password_hash)
                VALUES ('admin', 'admin123')
                ON CONFLICT (username) DO NOTHING;
                `;
                console.log('Tabela admin_users criada e inicializada com sucesso.');
            } catch (initError) {
                console.error('Erro crítico ao criar/inicializar tabela admin_users:', initError);
                return res.status(500).json({ 
                    error: 'Erro de inicialização do banco de dados.',
                    details: initError.message 
                });
            }
        }

        const { rows } = await sql`SELECT * FROM admin_users WHERE username = ${username}`;
        
        if (rows.length === 0) {
            console.log(`Usuário ${username} não encontrado no banco de dados.`);
            return res.status(401).json({ success: false, message: 'Usuário não encontrado' });
        }

        const user = rows[0];
        
        if (user.password_hash === password) {
            console.log(`Login bem-sucedido para usuário: ${username}`);
            const token = `admin_token_${Date.now()}`;
            return res.status(200).json({ success: true, token, user: { id: user.id, username: user.username } });
        } else {
            console.log(`Senha incorreta para usuário: ${username}`);
            return res.status(401).json({ success: false, message: 'Senha incorreta' });
        }
    } catch (dbError) {
        console.error('Database connection or query error:', dbError);
        return res.status(500).json({ 
            error: 'Erro de conexão com o banco de dados. Verifique as variáveis de ambiente.',
            details: dbError.message 
        });
    }
  } catch (error) {
    console.error('General login handler error:', error);
    return res.status(500).json({ 
        error: 'Erro interno no servidor',
        details: error.message 
    });
  }
}
