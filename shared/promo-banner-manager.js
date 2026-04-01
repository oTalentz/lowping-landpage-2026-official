;(function (global) {
  const STORAGE_KEYS = {
    banners: 'banners',
    coupons: 'coupons',
    state: 'promo_banner_state_v2'
  };

  function nowMs() {
    return Date.now();
  }

  function safeJsonParse(raw, fallback) {
    if (!raw || typeof raw !== 'string') return fallback;
    try {
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  }

  function readArray(storage, key) {
    if (!storage) return [];
    const value = safeJsonParse(storage.getItem(key), []);
    return Array.isArray(value) ? value : [];
  }

  function writeArray(storage, key, data) {
    if (!storage) return;
    storage.setItem(key, JSON.stringify(Array.isArray(data) ? data : []));
  }

  function writeState(storage, state) {
    if (!storage) return;
    storage.setItem(
      STORAGE_KEYS.state,
      JSON.stringify({
        ...state,
        updatedAt: nowMs()
      })
    );
  }

  function readState(storage) {
    if (!storage) return null;
    return safeJsonParse(storage.getItem(STORAGE_KEYS.state), null);
  }

  function isActiveByDate(startDate, endDate, now) {
    if (startDate) {
      const start = new Date(startDate).getTime();
      if (!Number.isNaN(start) && start > now) return false;
    }
    if (endDate) {
      const end = new Date(endDate).getTime();
      if (!Number.isNaN(end) && end < now) return false;
    }
    return true;
  }

  function pickActiveTextBanner(banners, now) {
    if (!Array.isArray(banners)) return null;
    return banners
      .filter((banner) => banner && banner.active && !banner.image_url && isActiveByDate(banner.start_date, banner.end_date, now))
      .sort((a, b) => (Number(a.order_index) || 0) - (Number(b.order_index) || 0))[0] || null;
  }

  function pickActiveImageBanners(banners, now) {
    if (!Array.isArray(banners)) return [];
    return banners
      .filter((banner) => banner && banner.active && banner.image_url && isActiveByDate(banner.start_date, banner.end_date, now))
      .sort((a, b) => (Number(a.order_index) || 0) - (Number(b.order_index) || 0));
  }

  function pickActiveCoupon(coupons, now) {
    if (!Array.isArray(coupons)) return null;
    return (
      coupons.find((coupon) => {
        if (!coupon) return false;
        if (!(coupon.status === 'active' || coupon.active === true)) return false;
        if (!coupon.valid_until) return true;
        const end = new Date(coupon.valid_until).getTime();
        return Number.isNaN(end) ? true : end >= now;
      }) || null
    );
  }

  function escapeHtml(input) {
    return String(input || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function renderBannerText(rawText) {
    const escaped = escapeHtml(rawText);
    return escaped.replace(/\*\*(.*?)\*\*/g, '<span class="promo-inline-highlight">$1</span>');
  }

  function resolveState(banners, coupons, now) {
    const textBanner = pickActiveTextBanner(banners, now);
    const imageBanners = pickActiveImageBanners(banners, now);
    const coupon = pickActiveCoupon(coupons, now);

    if (textBanner) {
      return {
        kind: 'text-banner',
        textHtml: renderBannerText(textBanner.title || ''),
        buttonLabel: textBanner.coupon_code ? 'COPIAR CUPOM' : 'ACESSAR',
        buttonMode: textBanner.coupon_code ? 'copy' : 'link',
        buttonValue: textBanner.coupon_code || textBanner.link_url || '',
        endDate: textBanner.end_date || null,
        imageBanners
      };
    }

    if (coupon) {
      return {
        kind: 'coupon',
        textHtml: `CUPOM DE ${escapeHtml(coupon.discount)}% OFF: <span class="promo-inline-highlight">${escapeHtml(coupon.code)}</span>`,
        buttonLabel: 'COPIAR CUPOM',
        buttonMode: 'copy',
        buttonValue: coupon.code || '',
        endDate: coupon.valid_until || null,
        imageBanners
      };
    }

    return {
      kind: 'none',
      textHtml: '',
      buttonLabel: '',
      buttonMode: '',
      buttonValue: '',
      endDate: null,
      imageBanners
    };
  }

  function applyPromoState(state, doc) {
    const promoBanner = doc.getElementById('promo-banner');
    const textSpan = doc.getElementById('promo-banner-text');
    const copyBtn = doc.getElementById('promo-banner-action');
    if (!promoBanner || !textSpan || !copyBtn) return;

    if (!state || state.kind === 'none') {
      promoBanner.style.display = 'none';
      syncLayoutOffset(doc, 0);
      return;
    }

    promoBanner.style.display = 'flex';
    promoBanner.style.flexWrap = 'wrap';
    promoBanner.style.gap = '8px';
    promoBanner.style.overflow = 'hidden';
    promoBanner.style.alignItems = 'center';
    promoBanner.style.justifyContent = 'space-between';
    textSpan.style.flex = '1 1 220px';
    textSpan.style.minWidth = '0';
    copyBtn.style.flex = '0 0 auto';
    copyBtn.style.maxWidth = '100%';
    textSpan.innerHTML = state.textHtml || '';
    copyBtn.textContent = state.buttonLabel || 'COPIAR';
    copyBtn.dataset.mode = state.buttonMode || '';
    copyBtn.dataset.value = state.buttonValue || '';
    copyBtn.onclick = function () {
      const mode = this.dataset.mode;
      const value = this.dataset.value;
      if (!value) return;
      if (mode === 'copy' && global.navigator?.clipboard?.writeText) {
        global.navigator.clipboard.writeText(value);
        const original = this.textContent;
        this.textContent = 'COPIADO!';
        setTimeout(() => {
          this.textContent = original;
        }, 2000);
      } else if (mode === 'link') {
        global.location.href = value;
      }
    };

    if (state.endDate) {
      const endMs = new Date(state.endDate).getTime();
      if (!Number.isNaN(endMs)) {
        global.promoBannerEndTime = Math.floor(endMs / 1000);
      }
    }
    syncLayoutOffset(doc, promoBanner.offsetHeight || 40);
  }

  function applyImageBanners(state, doc) {
    const container = doc.getElementById('dynamic-banners-container');
    if (!container) return;
    container.innerHTML = '';

    const banners = Array.isArray(state?.imageBanners) ? state.imageBanners : [];
    banners.forEach((banner) => {
      const link = doc.createElement('a');
      link.href = banner.link_url || '#';
      link.className = 'promo-image-item';
      const img = doc.createElement('img');
      img.src = banner.image_url;
      img.alt = banner.title || 'Banner promocional';
      img.className = 'promo-image';
      link.appendChild(img);
      container.appendChild(link);
    });
  }

  async function fetchJson(url) {
    const response = await global.fetch(url, { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) throw new Error('invalid-json');
    return response.json();
  }

  function bindStorageSync(reRender) {
    global.addEventListener('storage', (event) => {
      if (!event.key) return;
      if (event.key === STORAGE_KEYS.banners || event.key === STORAGE_KEYS.coupons || event.key === STORAGE_KEYS.state) {
        reRender();
      }
    });
  }

  function syncLayoutOffset(doc, height) {
    const bannerSpacer = doc.getElementById('promo-banner-spacer');
    if (bannerSpacer) {
      bannerSpacer.style.height = `${height}px`;
    }
    const nav = doc.getElementById('main-nav');
    if (nav) {
      nav.style.top = `${height}px`;
    }
  }

  function createManager(doc, storage) {
    function renderFromCache() {
      const banners = readArray(storage, STORAGE_KEYS.banners);
      const coupons = readArray(storage, STORAGE_KEYS.coupons);
      const fallbackState = readState(storage);
      const computed = resolveState(banners, coupons, nowMs());
      const fallbackIsRecent =
        fallbackState &&
        typeof fallbackState.updatedAt === 'number' &&
        nowMs() - fallbackState.updatedAt < 5 * 60 * 1000 &&
        fallbackState.kind &&
        fallbackState.kind !== 'none';
      const state = computed.kind === 'none' && fallbackIsRecent ? fallbackState : computed;
      applyPromoState(state, doc);
      applyImageBanners(state, doc);
      writeState(storage, state);
      return state;
    }

    async function syncRemote() {
      const [couponsResult, bannersResult] = await Promise.allSettled([
        fetchJson('/api/admin/coupons'),
        fetchJson('/api/admin/banners')
      ]);

      if (couponsResult.status === 'fulfilled') {
        writeArray(storage, STORAGE_KEYS.coupons, couponsResult.value);
      }
      if (bannersResult.status === 'fulfilled') {
        writeArray(storage, STORAGE_KEYS.banners, bannersResult.value);
      }
      return renderFromCache();
    }

    function init() {
      renderFromCache();
      syncRemote().catch(() => {
      });
      bindStorageSync(renderFromCache);
      global.addEventListener('resize', renderFromCache);
      doc.addEventListener('visibilitychange', () => {
        if (doc.visibilityState === 'visible') renderFromCache();
      });
    }

    return { init, renderFromCache, syncRemote, resolveState };
  }

  const api = {
    createManager,
    resolveState,
    readState,
    writeState,
    renderBannerText
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  global.PromoBannerManager = api;
})(typeof window !== 'undefined' ? window : globalThis);
