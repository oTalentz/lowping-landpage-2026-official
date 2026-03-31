import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { username, password } = req.body;

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
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
