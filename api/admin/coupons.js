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
  let isAdmin = false;
  if (req.headers.authorization) {
    const auth = authenticateRequest(req, res, ['admin']);
    if (!auth) return;
    isAdmin = true;
  }

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS coupons (
        id VARCHAR(255) PRIMARY KEY,
        code VARCHAR(255) NOT NULL,
        discount INTEGER NOT NULL,
        uses INTEGER DEFAULT 0,
        max_uses INTEGER NOT NULL,
        valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
        status VARCHAR(50) DEFAULT 'active'
      );
    `;
  } catch {
    return res.status(500).json({ error: 'Falha ao preparar recurso de cupons' });
  }

  if (req.method === 'GET') {
    try {
      const rows = isAdmin
        ? await sql`SELECT * FROM coupons ORDER BY id DESC`
        : await sql`
            SELECT id, code, discount, valid_until, status
            FROM coupons
            WHERE status = 'active'
              AND valid_until >= NOW()
            ORDER BY valid_until ASC
          `;
      return res.status(200).json(rows);
    } catch {
      return res.status(500).json({ error: 'Falha ao listar cupons' });
    }
  }

  if (req.method === 'POST') {
    const auth = authenticateRequest(req, res, ['admin']);
    if (!auth) return;

    const body = parseJsonBody(req);
    if (!body) return res.status(400).json({ error: 'Corpo JSON inválido' });

    const id = typeof body.id === 'string' ? body.id.trim() : '';
    const code = typeof body.code === 'string' ? body.code.trim().toUpperCase() : '';
    const discount = Number.isFinite(Number(body.discount)) ? Number(body.discount) : NaN;
    const uses = Number.isFinite(Number(body.uses)) ? Math.max(0, Number(body.uses)) : 0;
    const maxUses = Number.isFinite(Number(body.max_uses)) ? Math.max(1, Number(body.max_uses)) : NaN;
    const validUntil = typeof body.valid_until === 'string' ? body.valid_until : '';
    const status = body.status === 'inactive' ? 'inactive' : 'active';

    if (!isSafeId(id) || code.length < 3 || code.length > 64) {
      return res.status(400).json({ error: 'Dados inválidos do cupom' });
    }
    if (!Number.isFinite(discount) || discount < 1 || discount > 100) {
      return res.status(400).json({ error: 'Desconto inválido' });
    }
    if (!Number.isFinite(maxUses) || maxUses < 1 || maxUses > 1000000) {
      return res.status(400).json({ error: 'Limite de uso inválido' });
    }
    const parsedDate = new Date(validUntil);
    if (!validUntil || Number.isNaN(parsedDate.getTime())) {
      return res.status(400).json({ error: 'Data de validade inválida' });
    }

    try {
      await sql`
        INSERT INTO coupons (id, code, discount, uses, max_uses, valid_until, status)
        VALUES (${id}, ${code}, ${discount}, ${uses}, ${maxUses}, ${parsedDate.toISOString()}, ${status})
        ON CONFLICT (id) DO UPDATE SET
          code = EXCLUDED.code,
          discount = EXCLUDED.discount,
          uses = EXCLUDED.uses,
          max_uses = EXCLUDED.max_uses,
          valid_until = EXCLUDED.valid_until,
          status = EXCLUDED.status;
      `;
      return res.status(200).json({ success: true });
    } catch {
      return res.status(500).json({ error: 'Falha ao salvar cupom' });
    }
  }

  if (req.method === 'DELETE') {
    const auth = authenticateRequest(req, res, ['admin']);
    if (!auth) return;

    const { id } = req.query;
    if (!isSafeId(id)) return res.status(400).json({ error: 'ID inválido' });
    try {
      await sql`DELETE FROM coupons WHERE id = ${id}`;
      return res.status(200).json({ success: true });
    } catch {
      return res.status(500).json({ error: 'Falha ao excluir cupom' });
    }
  }

  return res.status(405).json({ error: 'Método não permitido' });
}

module.exports = handler;
