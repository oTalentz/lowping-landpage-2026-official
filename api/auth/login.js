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
        const { rows } = await sql`SELECT * FROM admin_users WHERE username = ${username}`;
        
        if (rows.length === 0) {
        return res.status(401).json({ success: false, message: 'Usuário não encontrado' });
        }

        const user = rows[0];
        
        // Simplificação para demonstração. Num sistema real, usaríamos bcrypt para validar o hash
        if (user.password_hash === password) {
        // Simulação de Token (num sistema real seria um JWT)
        const token = `admin_token_${Date.now()}`;
        return res.status(200).json({ success: true, token, user: { id: user.id, username: user.username } });
        } else {
        return res.status(401).json({ success: false, message: 'Senha incorreta' });
        }
    } catch (dbError) {
        console.error('Database error:', dbError);
        // Em caso de erro no banco, tenta inicializar a tabela temporariamente (Fallback para ambiente de desenvolvimento)
        if (dbError.message && dbError.message.includes('relation "admin_users" does not exist')) {
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
                // Tenta novamente após criar
                const { rows } = await sql`SELECT * FROM admin_users WHERE username = ${username}`;
                if (rows.length > 0 && rows[0].password_hash === password) {
                    const token = `admin_token_${Date.now()}`;
                    return res.status(200).json({ success: true, token, user: { id: rows[0].id, username: rows[0].username } });
                } else {
                    return res.status(401).json({ success: false, message: 'Senha incorreta' });
                }
            } catch (initError) {
                console.error('Failed to init DB during login:', initError);
            }
        }
        return res.status(500).json({ error: 'Erro de conexão com o banco de dados. Verifique as variáveis de ambiente.' });
    }
  } catch (error) {
    console.error('General login error:', error);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
}
