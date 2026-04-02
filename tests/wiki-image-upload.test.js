const test = require('node:test');
const assert = require('node:assert/strict');
const {
  parseBase64Data,
  matchesSignature,
  isSafeImageId,
  sanitizeFileName,
  MAX_IMAGE_BYTES
} = require('../api/wiki/images')._test;
const { isSafeUrl } = require('../api/_lib/security');

function bufferToBase64(buffer) {
  return Buffer.from(buffer).toString('base64');
}

test('parseBase64Data decodifica payload válido', () => {
  const pngHeader = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x00]);
  const result = parseBase64Data(bufferToBase64(pngHeader));
  assert.ok(result);
  assert.equal(result.length, pngHeader.length);
});

test('parseBase64Data rejeita dados inválidos', () => {
  assert.equal(parseBase64Data('%%%'), null);
  assert.equal(parseBase64Data(''), null);
});

test('matchesSignature valida PNG, JPEG, GIF e WEBP', () => {
  const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x00]);
  const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
  const gif = Buffer.from('GIF89a123456', 'ascii');
  const webp = Buffer.concat([Buffer.from('RIFF', 'ascii'), Buffer.from([0x00, 0x00, 0x00, 0x00]), Buffer.from('WEBP', 'ascii')]);

  assert.equal(matchesSignature(png, 'image/png'), true);
  assert.equal(matchesSignature(jpeg, 'image/jpeg'), true);
  assert.equal(matchesSignature(gif, 'image/gif'), true);
  assert.equal(matchesSignature(webp, 'image/webp'), true);
  assert.equal(matchesSignature(png, 'image/jpeg'), false);
});

test('isSafeImageId aplica regex segura para IDs', () => {
  assert.equal(isSafeImageId('0123456789abcdef01234567'), true);
  assert.equal(isSafeImageId('short'), false);
  assert.equal(isSafeImageId('../etc/passwd'), false);
});

test('sanitizeFileName remove caracteres perigosos', () => {
  const sanitized = sanitizeFileName('../../evil<script>.png');
  assert.equal(sanitized.includes('/'), false);
  assert.equal(sanitized.includes('<'), false);
  assert.equal(sanitized.length > 0, true);
});

test('MAX_IMAGE_BYTES permanece em 5MB', () => {
  assert.equal(MAX_IMAGE_BYTES, 5 * 1024 * 1024);
});

test('isSafeUrl valida protocolos e bloqueia domínio proibido', () => {
  assert.equal(isSafeUrl('https://exemplo.com/img.png'), true);
  assert.equal(isSafeUrl('http://exemplo.com/img.png'), true);
  assert.equal(isSafeUrl('/api/wiki/images?id=abc123abc123abc123abc123'), true);
  assert.equal(isSafeUrl('javascript:alert(1)'), false);
  assert.equal(isSafeUrl('//cdn.exemplo.com/img.png'), false);
  assert.equal(isSafeUrl('https://via.placeholder.com/150'), false);
});
