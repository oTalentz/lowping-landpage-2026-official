const crypto = require('crypto');
const { neon } = require('@neondatabase/serverless');
const {
  applySecurityHeaders,
  setCors,
  parseJsonBody,
  authenticateRequest
} = require('../_lib/security');

const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

function sanitizeFileName(value) {
  if (typeof value !== 'string') return 'image';
  const normalized = value.trim().replace(/[^\w.\-()\s]/g, '').slice(0, 120);
  return normalized || 'image';
}

function parseBase64Data(value) {
  if (typeof value !== 'string' || value.length === 0) return null;
  const sanitized = value.replace(/\s/g, '');
  if (!/^[A-Za-z0-9+/=]+$/.test(sanitized)) return null;
  try {
    const buffer = Buffer.from(sanitized, 'base64');
    if (!buffer || buffer.length === 0) return null;
    return buffer;
  } catch {
    return null;
  }
}

function matchesSignature(buffer, mimeType) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 12) return false;
  if (mimeType === 'image/png') {
    return (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a
    );
  }
  if (mimeType === 'image/jpeg') {
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }
  if (mimeType === 'image/gif') {
    const header = buffer.subarray(0, 6).toString('ascii');
    return header === 'GIF87a' || header === 'GIF89a';
  }
  if (mimeType === 'image/webp') {
    const riff = buffer.subarray(0, 4).toString('ascii');
    const webp = buffer.subarray(8, 12).toString('ascii');
    return riff === 'RIFF' && webp === 'WEBP';
  }
  return false;
}

function isSafeImageId(value) {
  return typeof value === 'string' && /^[a-f0-9]{24,64}$/.test(value);
}

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
      CREATE TABLE IF NOT EXISTS wiki_images (
        id VARCHAR(80) PRIMARY KEY,
        original_name VARCHAR(160) NOT NULL,
        mime_type VARCHAR(80) NOT NULL,
        size_bytes INTEGER NOT NULL,
        data_base64 TEXT NOT NULL,
        created_by VARCHAR(80),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
  } catch {
    return res.status(500).json({ error: 'Falha ao preparar recurso de imagens' });
  }

  if (req.method === 'GET') {
    const id = typeof req.query?.id === 'string' ? req.query.id.trim() : '';
    if (!isSafeImageId(id)) return res.status(400).json({ error: 'ID de imagem inválido' });
    try {
      const rows = await sql`
        SELECT mime_type, size_bytes, data_base64
        FROM wiki_images
        WHERE id = ${id}
        LIMIT 1
      `;
      if (!rows || rows.length === 0) {
        return res.status(404).json({ error: 'Imagem não encontrada' });
      }
      const row = rows[0];
      const payload = parseBase64Data(row.data_base64);
      if (!payload) {
        return res.status(500).json({ error: 'Imagem armazenada está corrompida' });
      }
      res.setHeader('Content-Type', row.mime_type || 'application/octet-stream');
      res.setHeader('Content-Length', String(payload.length));
      res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
      return res.status(200).send(payload);
    } catch {
      return res.status(500).json({ error: 'Falha ao carregar imagem' });
    }
  }

  if (req.method === 'POST') {
    const auth = authenticateRequest(req, res, ['admin']);
    if (!auth) return;

    const body = parseJsonBody(req);
    if (!body) return res.status(400).json({ error: 'Corpo JSON inválido' });

    const mimeType = typeof body.mimeType === 'string' ? body.mimeType.trim().toLowerCase() : '';
    const originalName = sanitizeFileName(body.fileName);
    const buffer = parseBase64Data(body.dataBase64);

    if (!ALLOWED_IMAGE_TYPES.has(mimeType)) {
      return res.status(400).json({ error: 'Formato não suportado. Use JPG, PNG, WEBP ou GIF.' });
    }
    if (!buffer) {
      return res.status(400).json({ error: 'Arquivo inválido ou corrompido.' });
    }
    if (buffer.length > MAX_IMAGE_BYTES) {
      return res.status(413).json({ error: `Arquivo excede o limite de ${Math.floor(MAX_IMAGE_BYTES / (1024 * 1024))}MB.` });
    }
    if (!matchesSignature(buffer, mimeType)) {
      return res.status(400).json({ error: 'Conteúdo do arquivo não corresponde ao formato informado.' });
    }

    const id = crypto.randomBytes(16).toString('hex');
    const dataBase64 = buffer.toString('base64');

    try {
      await sql`
        INSERT INTO wiki_images (id, original_name, mime_type, size_bytes, data_base64, created_by)
        VALUES (${id}, ${originalName}, ${mimeType}, ${buffer.length}, ${dataBase64}, ${auth.sub || 'admin'})
      `;
      return res.status(200).json({
        success: true,
        id,
        url: `/api/wiki/images?id=${id}`,
        mimeType,
        sizeBytes: buffer.length
      });
    } catch {
      return res.status(500).json({ error: 'Falha ao salvar imagem' });
    }
  }

  const auth = authenticateRequest(req, res, ['admin']);
  if (!auth) return;

  const id = typeof req.query?.id === 'string' ? req.query.id.trim() : '';
  if (!isSafeImageId(id)) return res.status(400).json({ error: 'ID de imagem inválido' });

  try {
    await sql`DELETE FROM wiki_images WHERE id = ${id}`;
    return res.status(200).json({ success: true });
  } catch {
    return res.status(500).json({ error: 'Falha ao excluir imagem' });
  }
}

module.exports = handler;
module.exports._test = {
  parseBase64Data,
  matchesSignature,
  isSafeImageId,
  sanitizeFileName,
  MAX_IMAGE_BYTES
};
