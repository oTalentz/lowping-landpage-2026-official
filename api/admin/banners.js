const { neon } = require('@neondatabase/serverless');
const {
  applySecurityHeaders,
  setCors,
  parseJsonBody,
  authenticateRequest,
  isSafeId,
  isSafeUrl
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
      CREATE TABLE IF NOT EXISTS banners (
        id VARCHAR(255) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        image_url TEXT,
        link_url TEXT,
        active BOOLEAN DEFAULT true,
        order_index INTEGER DEFAULT 0,
        start_date TEXT,
        end_date TEXT,
        coupon_code TEXT
      );
    `;
    try {
      await sql`ALTER TABLE banners ADD COLUMN IF NOT EXISTS start_date TEXT`;
      await sql`ALTER TABLE banners ADD COLUMN IF NOT EXISTS end_date TEXT`;
      await sql`ALTER TABLE banners ADD COLUMN IF NOT EXISTS coupon_code TEXT`;
    } catch {
    }
  } catch {
    return res.status(500).json({ error: 'Falha ao preparar recurso de banners' });
  }

  if (req.method === 'GET') {
    try {
      const rows = isAdmin
        ? await sql`SELECT * FROM banners ORDER BY order_index ASC`
        : await sql`
            SELECT id, title, image_url, link_url, active, order_index, start_date, end_date, coupon_code
            FROM banners
            WHERE active = TRUE
            ORDER BY order_index ASC
          `;
      return res.status(200).json(rows);
    } catch {
      return res.status(500).json({ error: 'Falha ao listar banners' });
    }
  }

  if (req.method === 'POST') {
    const auth = authenticateRequest(req, res, ['admin']);
    if (!auth) return;

    const body = parseJsonBody(req);
    if (!body) return res.status(400).json({ error: 'Corpo JSON inválido' });

    const id = typeof body.id === 'string' ? body.id.trim() : '';
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const imageUrl = typeof body.image_url === 'string' ? body.image_url.trim() : '';
    const linkUrl = typeof body.link_url === 'string' ? body.link_url.trim() : '';
    const active = body.active === undefined ? true : Boolean(body.active);
    const orderIndex = Number.isFinite(Number(body.order_index)) ? Math.max(0, Math.min(9999, Number(body.order_index))) : 0;
    const startDate = typeof body.start_date === 'string' && body.start_date.length <= 64 ? body.start_date : null;
    const endDate = typeof body.end_date === 'string' && body.end_date.length <= 64 ? body.end_date : null;
    const couponCode = typeof body.coupon_code === 'string' && body.coupon_code.length <= 80 ? body.coupon_code : '';

    if (!isSafeId(id) || title.length < 2 || title.length > 160) {
      return res.status(400).json({ error: 'Dados inválidos do banner' });
    }
    if (!isSafeUrl(imageUrl) || !isSafeUrl(linkUrl)) {
      return res.status(400).json({ error: 'URL inválida no banner' });
    }

    try {
      await sql`
        INSERT INTO banners (id, title, image_url, link_url, active, order_index, start_date, end_date, coupon_code)
        VALUES (${id}, ${title}, ${imageUrl || ''}, ${linkUrl || ''}, ${active}, ${orderIndex}, ${startDate}, ${endDate}, ${couponCode})
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          image_url = EXCLUDED.image_url,
          link_url = EXCLUDED.link_url,
          active = EXCLUDED.active,
          order_index = EXCLUDED.order_index,
          start_date = EXCLUDED.start_date,
          end_date = EXCLUDED.end_date,
          coupon_code = EXCLUDED.coupon_code;
      `;
      return res.status(200).json({ success: true });
    } catch {
      return res.status(500).json({ error: 'Falha ao salvar banner' });
    }
  }

  if (req.method === 'DELETE') {
    const auth = authenticateRequest(req, res, ['admin']);
    if (!auth) return;

    const { id } = req.query;
    if (!isSafeId(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }
    try {
      await sql`DELETE FROM banners WHERE id = ${id}`;
      return res.status(200).json({ success: true });
    } catch {
      return res.status(500).json({ error: 'Falha ao excluir banner' });
    }
  }

  return res.status(405).json({ error: 'Método não permitido' });
}

module.exports = handler;
