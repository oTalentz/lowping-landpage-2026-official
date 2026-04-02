const crypto = require('crypto');

const loginAttemptStore = new Map();

function applySecurityHeaders(res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
}

function parseAllowedOrigins() {
  return (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function isSameOriginRequest(req, origin) {
  try {
    const parsed = new URL(origin);
    return parsed.host === req.headers.host;
  } catch {
    return false;
  }
}

function setCors(req, res, methods) {
  const origin = req.headers.origin;
  const allowList = parseAllowedOrigins();
  let allowedOrigin = '';

  if (!origin) {
    allowedOrigin = '*';
  } else if (allowList.length > 0) {
    if (!allowList.includes(origin)) {
      res.status(403).json({ error: 'Origin não permitido' });
      return false;
    }
    allowedOrigin = origin;
  } else if (isSameOriginRequest(req, origin)) {
    allowedOrigin = origin;
  } else {
    res.status(403).json({ error: 'Origin não permitido' });
    return false;
  }

  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', methods.join(','));
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, X-Init-Key');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return false;
  }

  return true;
}

function toDerivedSecret(seed) {
  if (typeof seed !== 'string') return null;
  const normalized = seed.trim();
  if (!normalized) return null;
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

function getSecret(secretSeed = '') {
  const normalizedSeed = typeof secretSeed === 'string' ? secretSeed.trim() : '';
  const seeded = normalizedSeed ? toDerivedSecret(`lowping-admin:${normalizedSeed}`) : null;
  if (seeded) return seeded;
  const candidateSecrets = [
    process.env.ADMIN_JWT_SECRET,
    process.env.JWT_SECRET,
    process.env.AUTH_SECRET,
    process.env.NEXTAUTH_SECRET
  ];
  for (const candidate of candidateSecrets) {
    if (typeof candidate !== 'string') continue;
    const normalized = candidate.trim();
    if (!normalized) continue;
    if (normalized.length >= 32) return normalized;
    return toDerivedSecret(normalized);
  }
  const connectionSeed =
    process.env.POSTGRES_URL ||
    process.env.STORAGE_POSTGRES_URL ||
    process.env.DATABASE_URL ||
    process.env.STORAGE_DATABASE_URL;
  const derivedFromConnection = toDerivedSecret(`lowping-admin:${connectionSeed || ''}`);
  if (derivedFromConnection) return derivedFromConnection;
  return null;
}

function parseJsonBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return null;
    }
  }
  return {};
}

function base64Url(input) {
  return Buffer.from(input).toString('base64url');
}

function safeEqual(a, b) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

function signPayload(payload, secret) {
  const header = base64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64Url(JSON.stringify(payload));
  const signature = crypto.createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
}

function verifySignedToken(token, secret) {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [header, body, signature] = parts;
  const expected = crypto.createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url');
  if (!safeEqual(signature, expected)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (!payload.exp || Date.now() >= payload.exp * 1000) return null;
    return payload;
  } catch {
    return null;
  }
}

function issueAuthToken(subject, role = 'admin', ttlSeconds = 3600, secretSeed = '') {
  const secret = getSecret(secretSeed);
  if (!secret) return null;
  const now = Math.floor(Date.now() / 1000);
  return signPayload(
    {
      sub: String(subject),
      role,
      iat: now,
      exp: now + ttlSeconds,
      jti: crypto.randomBytes(12).toString('hex')
    },
    secret
  );
}

function extractBearerToken(authorization) {
  if (!authorization || typeof authorization !== 'string') return null;
  const [scheme, token] = authorization.trim().split(' ');
  if (!scheme || !token || scheme !== 'Bearer') return null;
  return token;
}

function authenticateRequest(req, res, allowedRoles = ['admin']) {
  const secret = getSecret();
  if (!secret) {
    res.status(500).json({ error: 'Configuração de segurança inválida' });
    return null;
  }

  const token = extractBearerToken(req.headers.authorization || '');
  if (!token) {
    res.status(401).json({ error: 'Não autenticado' });
    return null;
  }

  const payload = verifySignedToken(token, secret);
  if (!payload) {
    res.status(401).json({ error: 'Token inválido ou expirado' });
    return null;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(payload.role)) {
    res.status(403).json({ error: 'Sem permissão' });
    return null;
  }

  return payload;
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `scrypt:${salt}:${derived}`;
}

function verifyPassword(password, storedHash) {
  if (typeof storedHash !== 'string') return false;
  const parts = storedHash.split(':');
  if (parts.length !== 3 || parts[0] !== 'scrypt') {
    return false;
  }
  const salt = parts[1];
  const current = crypto.scryptSync(password, salt, 64).toString('hex');
  return safeEqual(current, parts[2]);
}

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || 'unknown';
}

function consumeLoginRateLimit(key) {
  const now = Date.now();
  const current = loginAttemptStore.get(key) || {
    attempts: 0,
    windowStart: now,
    blockedUntil: 0
  };

  if (current.blockedUntil > now) {
    return { allowed: false, retryAfterMs: current.blockedUntil - now };
  }

  if (now - current.windowStart > 10 * 60 * 1000) {
    current.attempts = 0;
    current.windowStart = now;
    current.blockedUntil = 0;
  }

  current.attempts += 1;

  if (current.attempts > 6) {
    current.blockedUntil = now + 15 * 60 * 1000;
    loginAttemptStore.set(key, current);
    return { allowed: false, retryAfterMs: current.blockedUntil - now };
  }

  loginAttemptStore.set(key, current);
  return { allowed: true, retryAfterMs: 0 };
}

function clearLoginRateLimit(key) {
  loginAttemptStore.delete(key);
}

function isSafeId(value, maxLength = 80) {
  return typeof value === 'string' && value.length > 0 && value.length <= maxLength && /^[a-zA-Z0-9_-]+$/.test(value);
}

function isSafeUrl(value) {
  if (!value) return true;
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (!trimmed) return true;
  if (trimmed.startsWith('//')) return false;
  if (trimmed.startsWith('/') || trimmed.startsWith('#') || trimmed.startsWith('?')) {
    return true;
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return false;
    if (parsed.hostname.toLowerCase() === 'via.placeholder.com') return false;
    return true;
  } catch {
    return false;
  }
}

module.exports = {
  applySecurityHeaders,
  setCors,
  parseJsonBody,
  issueAuthToken,
  authenticateRequest,
  hashPassword,
  verifyPassword,
  getClientIp,
  consumeLoginRateLimit,
  clearLoginRateLimit,
  isSafeId,
  isSafeUrl
};
