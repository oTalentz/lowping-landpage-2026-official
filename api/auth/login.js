const { neon } = require('@neondatabase/serverless');
const {
  applySecurityHeaders,
  setCors,
  parseJsonBody,
  issueAuthToken,
  hashPassword,
  verifyPassword,
  getClientIp,
  consumeLoginRateLimit,
  clearLoginRateLimit
} = require('../_lib/security');

async function handler(req, res) {
  applySecurityHeaders(res);
  if (!setCors(req, res, ['POST', 'OPTIONS'])) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const body = parseJsonBody(req);
  if (!body) {
    return res.status(400).json({ error: 'Corpo JSON inválido' });
  }

  const username = typeof body.username === 'string' ? body.username.trim() : '';
  const password = typeof body.password === 'string' ? body.password : '';

  if (username.length < 3 || username.length > 80 || password.length < 8 || password.length > 200) {
    return res.status(400).json({ error: 'Credenciais inválidas' });
  }

  const ip = getClientIp(req);
  const rateKey = `${ip}:${username}`;
  const rateLimit = consumeLoginRateLimit(rateKey);
  if (!rateLimit.allowed) {
    res.setHeader('Retry-After', String(Math.ceil(rateLimit.retryAfterMs / 1000)));
    return res.status(429).json({ error: 'Muitas tentativas. Tente novamente depois.' });
  }

  const connectionString =
    process.env.POSTGRES_URL ||
    process.env.STORAGE_POSTGRES_URL ||
    process.env.DATABASE_URL ||
    process.env.STORAGE_DATABASE_URL;

  if (!connectionString) {
    return res.status(500).json({ error: 'Serviço indisponível' });
  }

  const bootstrapUsername = 'lowadmin001';
  const fallbackBootstrapPassword = 'y@5rrx).v';
  const configuredBootstrapPassword = process.env.ADMIN_BOOTSTRAP_PASSWORD;
  const bootstrapPassword =
    typeof configuredBootstrapPassword === 'string' && configuredBootstrapPassword.length >= 8
      ? configuredBootstrapPassword
      : fallbackBootstrapPassword;

  try {
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

    await sql`
      INSERT INTO admin_users (username, password_hash, role, active)
      VALUES (${bootstrapUsername}, ${hashPassword(bootstrapPassword)}, 'admin', TRUE)
      ON CONFLICT (username) DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        role = EXCLUDED.role,
        active = EXCLUDED.active;
    `;
    await sql`
      UPDATE admin_users
      SET active = FALSE
      WHERE username = 'admin' AND username <> ${bootstrapUsername};
    `;

    const rows = await sql`
      SELECT id, username, password_hash, role, active
      FROM admin_users
      WHERE username = ${username}
      LIMIT 1
    `;

    if (!rows || rows.length === 0) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const user = rows[0];
    if (user.active === false) {
      return res.status(403).json({ error: 'Conta desativada' });
    }

    let authenticated = verifyPassword(password, user.password_hash || '');

    if (!authenticated) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    clearLoginRateLimit(rateKey);
    const token = issueAuthToken(user.id, user.role || 'admin', 3600, connectionString);
    if (!token) {
      return res.status(500).json({ error: 'Configuração de segurança inválida' });
    }

    return res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role || 'admin'
      },
      expiresIn: 3600
    });
  } catch {
    return res.status(500).json({ error: 'Falha interna no login' });
  }
}

module.exports = handler;
