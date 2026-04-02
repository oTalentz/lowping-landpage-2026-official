const test = require('node:test');
const assert = require('node:assert/strict');
const { createManager } = require('../shared/promo-banner-manager');

function createStorage(seed = {}) {
  const data = new Map(Object.entries(seed));
  return {
    getItem(key) {
      return data.has(key) ? data.get(key) : null;
    },
    setItem(key, value) {
      data.set(key, String(value));
    }
  };
}

function createNode() {
  return {
    style: {},
    dataset: {},
    textContent: '',
    innerHTML: '',
    className: '',
    children: [],
    appendChild(child) {
      this.children.push(child);
    }
  };
}

function createDocument() {
  const elements = {
    'promo-banner': { ...createNode(), offsetHeight: 40 },
    'promo-banner-text': createNode(),
    'promo-banner-action': createNode(),
    'promo-banner-spacer': createNode(),
    'main-nav': createNode()
  };
  return {
    visibilityState: 'visible',
    getElementById(id) {
      return elements[id] || null;
    },
    createElement(tag) {
      return { ...createNode(), tagName: tag };
    },
    addEventListener() {},
    _elements: elements
  };
}

test('integração: mantém banner em navegação e atualiza após sync remoto', async () => {
  const sharedStorage = createStorage({
    banners: JSON.stringify([]),
    coupons: JSON.stringify([{ code: 'CACHE15', discount: 15, status: 'active' }])
  });

  global.addEventListener = () => {};
  global.fetch = async (url) => {
    if (url.includes('/coupons')) {
      return {
        ok: true,
        headers: { get: () => 'application/json' },
        json: async () => [{ code: 'REMOTO20', discount: 20, status: 'active' }]
      };
    }
    return {
      ok: true,
      headers: { get: () => 'application/json' },
      json: async () => []
    };
  };

  const jogosDoc = createDocument();
  const jogosManager = createManager(jogosDoc, sharedStorage);
  jogosManager.renderFromCache();
  assert.match(jogosDoc._elements['promo-banner-text'].innerHTML, /CACHE15/);

  const vpsDoc = createDocument();
  const vpsManager = createManager(vpsDoc, sharedStorage);
  vpsManager.renderFromCache();
  assert.match(vpsDoc._elements['promo-banner-text'].innerHTML, /CACHE15/);
  assert.equal(vpsDoc._elements['promo-banner'].style.display, 'flex');

  await vpsManager.syncRemote();
  assert.match(vpsDoc._elements['promo-banner-text'].innerHTML, /REMOTO20/);
});
