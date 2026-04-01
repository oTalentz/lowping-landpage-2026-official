const test = require('node:test');
const assert = require('node:assert/strict');
const { createManager, resolveState } = require('../shared/promo-banner-manager');

function createStorage(seed = {}) {
  const data = new Map(Object.entries(seed));
  return {
    getItem(key) {
      return data.has(key) ? data.get(key) : null;
    },
    setItem(key, value) {
      data.set(key, String(value));
    },
    removeItem(key) {
      data.delete(key);
    }
  };
}

function createElement() {
  return {
    style: {},
    dataset: {},
    children: [],
    textContent: '',
    innerHTML: '',
    className: '',
    appendChild(child) {
      this.children.push(child);
    }
  };
}

function createDocument() {
  const elements = {
    'promo-banner': { ...createElement(), offsetHeight: 44 },
    'promo-banner-text': createElement(),
    'promo-banner-action': createElement(),
    'dynamic-banners-container': createElement(),
    'promo-banner-spacer': createElement(),
    'main-nav': createElement()
  };

  return {
    visibilityState: 'visible',
    getElementById(id) {
      return elements[id] || null;
    },
    createElement(tag) {
      return { ...createElement(), tagName: tag };
    },
    addEventListener() {},
    _elements: elements
  };
}

test('resolveState prioriza banner de texto sobre cupom ativo', () => {
  const now = Date.now();
  const state = resolveState(
    [
      { id: 'b1', title: 'PROMO **MEGA10**', active: true, order_index: 1, start_date: null, end_date: null },
      { id: 'b2', title: 'Imagem', image_url: 'https://cdn.local/img.png', active: true, order_index: 2 }
    ],
    [{ id: 'c1', code: 'LOWPING20', discount: 20, active: true }],
    now
  );

  assert.equal(state.kind, 'text-banner');
  assert.equal(state.buttonLabel, 'ACESSAR');
  assert.match(state.textHtml, /promo-inline-highlight/);
  assert.equal(state.imageBanners.length, 1);
});

test('manager mantém banner visível entre navegações usando cache local', () => {
  global.addEventListener = () => {};
  global.fetch = async () => ({ ok: false, status: 500, headers: { get: () => 'application/json' }, json: async () => [] });

  const storage = createStorage({
    banners: JSON.stringify([]),
    coupons: JSON.stringify([{ code: 'PROMO10', discount: 10, status: 'active' }])
  });

  const docPageA = createDocument();
  const pageAManager = createManager(docPageA, storage);
  pageAManager.renderFromCache();

  assert.equal(docPageA._elements['promo-banner'].style.display, 'flex');
  assert.equal(docPageA._elements['promo-banner'].style.flexWrap, 'wrap');
  assert.equal(docPageA._elements['promo-banner'].style.overflow, 'hidden');
  assert.match(docPageA._elements['promo-banner-text'].innerHTML, /PROMO10/);
  assert.equal(docPageA._elements['promo-banner-spacer'].style.height, '44px');

  const docPageB = createDocument();
  const pageBManager = createManager(docPageB, storage);
  pageBManager.renderFromCache();

  assert.equal(docPageB._elements['promo-banner'].style.display, 'flex');
  assert.match(docPageB._elements['promo-banner-text'].innerHTML, /PROMO10/);
  assert.equal(docPageB._elements['promo-banner-spacer'].style.height, '44px');
});

test('manager evita desaparecer quando cupom está vazio e existe banner ativo', () => {
  const storage = createStorage({
    banners: JSON.stringify([{ id: 'tb', title: 'ATIVE **VIP50**', active: true, order_index: 1 }]),
    coupons: JSON.stringify([])
  });
  const doc = createDocument();
  const manager = createManager(doc, storage);

  manager.renderFromCache();

  assert.equal(doc._elements['promo-banner'].style.display, 'flex');
  assert.match(doc._elements['promo-banner-text'].innerHTML, /VIP50/);
  assert.equal(doc._elements['promo-banner-action'].textContent, 'ACESSAR');
});
