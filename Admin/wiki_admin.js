let quill;
let currentWikiSection = 'articles';
const MAX_TITLE_LENGTH = 180;
const MAX_SLUG_LENGTH = 80;
const MAX_CONTENT_LENGTH = 200000;
const ALLOWED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_IMAGE_UPLOAD_BYTES = 5 * 1024 * 1024;
let isQuillImageUploadInProgress = false;

function validateImageFile(file) {
    if (!file) return 'Nenhum arquivo selecionado.';
    if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.type)) {
        return 'Formato não suportado. Use JPG, PNG, WEBP ou GIF.';
    }
    if (!Number.isFinite(file.size) || file.size <= 0) {
        return 'Arquivo inválido.';
    }
    if (file.size > MAX_IMAGE_UPLOAD_BYTES) {
        return `Arquivo excede o limite de ${Math.floor(MAX_IMAGE_UPLOAD_BYTES / (1024 * 1024))}MB.`;
    }
    return '';
}

function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            if (typeof reader.result !== 'string') {
                reject(new Error('Falha ao processar arquivo.'));
                return;
            }
            resolve(reader.result);
        };
        reader.onerror = () => reject(new Error('Falha ao ler arquivo.'));
        reader.readAsDataURL(file);
    });
}

function insertImageAtCursor(url) {
    if (!quill || !url) return;
    const safeUrl = sanitizeEditorUrl(url);
    if (!safeUrl) throw new Error('URL de imagem inválida após upload.');
    const selection = quill.getSelection(true);
    const index = selection && Number.isInteger(selection.index) ? selection.index : quill.getLength();
    quill.insertEmbed(index, 'image', safeUrl, 'user');
    quill.setSelection(index + 1, 0, 'user');
}

async function uploadImageForEditor(file) {
    const validationError = validateImageFile(file);
    if (validationError) {
        if (typeof showToast === 'function') showToast(validationError, 'error');
        return;
    }
    if (!db || typeof db.uploadImage !== 'function') {
        if (typeof showToast === 'function') showToast('Upload de imagem não está disponível.', 'error');
        return;
    }
    if (isQuillImageUploadInProgress) {
        if (typeof showToast === 'function') showToast('Aguarde o upload atual terminar.', 'error');
        return;
    }

    isQuillImageUploadInProgress = true;
    try {
        if (typeof showToast === 'function') showToast('Enviando imagem...');
        const dataUrl = await readFileAsDataUrl(file);
        const base64 = dataUrl.split(',')[1] || '';
        if (!base64) throw new Error('Não foi possível codificar a imagem.');
        const response = await db.uploadImage({
            fileName: file.name,
            mimeType: file.type,
            dataBase64: base64
        });
        if (!response || typeof response.url !== 'string') {
            throw new Error('Resposta inválida do upload.');
        }
        insertImageAtCursor(response.url);
        if (typeof showToast === 'function') showToast('Imagem enviada com sucesso!');
    } catch (error) {
        if (typeof showToast === 'function') showToast(error.message || 'Falha no upload da imagem.', 'error');
    } finally {
        isQuillImageUploadInProgress = false;
    }
}

function openImageFilePicker() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = ALLOWED_IMAGE_MIME_TYPES.join(',');
    input.onchange = async () => {
        const file = input.files && input.files[0] ? input.files[0] : null;
        if (!file) return;
        await uploadImageForEditor(file);
    };
    input.click();
}

function sanitizeEditorUrl(value) {
    if (typeof value !== 'string') return '';
    const trimmed = value.trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('/') || trimmed.startsWith('#') || trimmed.startsWith('?')) return trimmed;
    try {
        const parsed = new URL(trimmed, window.location.origin);
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return '';
        if (parsed.hostname.toLowerCase() === 'via.placeholder.com') return '';
        return parsed.href;
    } catch {
        return '';
    }
}

function sanitizeArticleHtml(content) {
    const template = document.createElement('template');
    template.innerHTML = typeof content === 'string' ? content : '';

    const blockedTags = ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button', 'textarea', 'select', 'meta', 'link'];
    blockedTags.forEach((tag) => {
        template.content.querySelectorAll(tag).forEach((el) => el.remove());
    });

    template.content.querySelectorAll('*').forEach((el) => {
        [...el.attributes].forEach((attr) => {
            const name = attr.name.toLowerCase();
            if (name.startsWith('on') || name === 'style' || name === 'srcset') {
                el.removeAttribute(attr.name);
                return;
            }
            if (name === 'href' || name === 'src') {
                const safeUrl = sanitizeEditorUrl(attr.value);
                if (!safeUrl) {
                    if (name === 'src' && el.tagName === 'IMG') {
                        el.remove();
                    } else {
                        el.removeAttribute(attr.name);
                    }
                    return;
                }
                el.setAttribute(attr.name, safeUrl);
                if (name === 'href') {
                    el.setAttribute('target', '_blank');
                    el.setAttribute('rel', 'noopener noreferrer');
                }
            }
        });
    });

    return template.innerHTML;
}

function isArticleFeatured(article) {
    return article && (article.featured === true || article.featured === 'true');
}

function getFeaturedOrder(article) {
    const parsed = Number.parseInt(article?.featured_order ?? article?.featuredOrder, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : Number.MAX_SAFE_INTEGER;
}

function getSortedFeaturedArticles(articles) {
    return (Array.isArray(articles) ? articles : [])
        .filter((article) => isArticleFeatured(article))
        .sort((a, b) => {
            const orderDiff = getFeaturedOrder(a) - getFeaturedOrder(b);
            if (orderDiff !== 0) return orderDiff;
            return new Date(b.updated_at || b.updatedAt) - new Date(a.updated_at || a.updatedAt);
        });
}

function getWikiSectionFromUrl() {
    if (typeof window.getRouteStateFromUrl === 'function') {
        const route = window.getRouteStateFromUrl();
        return route.wikiSection === 'categories' ? 'categories' : 'articles';
    }
    const params = new URLSearchParams(window.location.search);
    return params.get('wiki') === 'categories' ? 'categories' : 'articles';
}

function syncWikiSectionToUrl(section) {
    if (typeof window.getRouteStateFromUrl === 'function') {
        const route = window.getRouteStateFromUrl();
        const safeSection = section === 'categories' ? 'categories' : route.wikiSection;
        if (typeof window.history?.replaceState === 'function') {
            const params = new URLSearchParams(window.location.search);
            params.set('section', 'wiki');
            params.set('wiki', safeSection);
            const query = params.toString();
            const nextUrl = `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash || ''}`;
            window.history.replaceState({}, '', nextUrl);
        }
        return;
    }
    const params = new URLSearchParams(window.location.search);
    params.set('section', 'wiki');
    params.set('wiki', section === 'categories' ? 'categories' : 'articles');
    const query = params.toString();
    const nextUrl = `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash || ''}`;
    window.history.replaceState({}, '', nextUrl);
}

function initWikiAdmin() {
    initQuill();

    // Event listeners for Navigation
    const navWiki = document.getElementById('nav-wiki');
    if (navWiki) {
        navWiki.addEventListener('click', (e) => {
            e.preventDefault();
            // showSection is a global function from app.js
            if (typeof window.showSection === 'function') {
                window.showSection('wiki');
                showWikiSection(getWikiSectionFromUrl());
            } else if (typeof showSection === 'function') {
                showSection('wiki');
                showWikiSection(getWikiSectionFromUrl());
            }
        });
    }

    const mobNavWiki = document.getElementById('mob-nav-wiki');
    if (mobNavWiki) {
        mobNavWiki.addEventListener('click', (e) => {
            e.preventDefault();
            if (typeof window.showSection === 'function') {
                window.showSection('wiki');
                showWikiSection(getWikiSectionFromUrl());
            } else if (typeof showSection === 'function') {
                showSection('wiki');
                showWikiSection(getWikiSectionFromUrl());
            }
        });
    }
    
    // Also bind banners just in case they are not bound in app.js
    document.getElementById('nav-banners')?.addEventListener('click', (e) => {
        e.preventDefault();
        if (typeof window.showSection === 'function') window.showSection('banners');
        else if (typeof showSection === 'function') showSection('banners');
    });
    document.getElementById('mob-nav-banners')?.addEventListener('click', (e) => {
        e.preventDefault();
        if (typeof window.showSection === 'function') window.showSection('banners');
        else if (typeof showSection === 'function') showSection('banners');
    });

    // Wiki inner navigation
    const btnArticles = document.getElementById('btn-wiki-articles');
    const btnCategories = document.getElementById('btn-wiki-categories');
    
    if (btnArticles) {
        btnArticles.addEventListener('click', () => showWikiSection('articles'));
    }
    if (btnCategories) {
        btnCategories.addEventListener('click', () => showWikiSection('categories'));
    }

    // Article Form
    const articleForm = document.getElementById('article-form');
    if (articleForm) {
        articleForm.addEventListener('submit', handleArticleSubmit);
    }

    // Auto-generate slug
    const titleInput = document.getElementById('article-title-input');
    const slugInput = document.getElementById('article-slug-input');
    if (titleInput && slugInput) {
        titleInput.addEventListener('input', () => {
            if (!document.getElementById('article-id').value) { // only auto-generate for new articles
                slugInput.value = titleInput.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
            }
        });
    }

    // Create Button
    const createBtn = document.getElementById('btn-new-wiki');
    if (createBtn) {
        createBtn.addEventListener('click', () => {
            if (currentWikiSection === 'articles') {
                openArticleEditor();
            } else {
                if (typeof window.showToast === 'function') window.showToast('Criação de categorias em breve.', 'error');
                else if (typeof showToast === 'function') showToast('Criação de categorias em breve.', 'error');
            }
        });
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWikiAdmin);
} else {
    initWikiAdmin();
}

function initQuill() {
    quill = new Quill('#quill-editor', {
        theme: 'snow',
        placeholder: 'Escreva o conteúdo do artigo aqui...',
        modules: {
            toolbar: {
                container: [
                    [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                    ['bold', 'italic', 'underline', 'strike'],
                    ['blockquote', 'code-block'],
                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                    [{ 'script': 'sub'}, { 'script': 'super' }],
                    [{ 'indent': '-1'}, { 'indent': '+1' }],
                    [{ 'direction': 'rtl' }],
                    [{ 'color': [] }, { 'background': [] }],
                    [{ 'align': [] }],
                    ['link', 'image', 'video'],
                    ['clean']
                ],
                handlers: {
                    image: () => {
                        openImageFilePicker();
                    }
                }
            }
        }
    });
    quill.root.addEventListener('paste', (event) => {
        const imageFile = event.clipboardData?.files ? [...event.clipboardData.files].find((file) => file.type.startsWith('image/')) : null;
        if (imageFile) {
            event.preventDefault();
            uploadImageForEditor(imageFile);
            return;
        }
        const html = event.clipboardData?.getData('text/html');
        if (!html) return;
        event.preventDefault();
        const sanitized = sanitizeArticleHtml(html);
        const selection = quill.getSelection(true);
        const index = selection && Number.isInteger(selection.index) ? selection.index : quill.getLength();
        quill.clipboard.dangerouslyPasteHTML(index, sanitized, 'user');
    });
}

function showWikiSection(section, options = {}) {
    const { syncUrl = true } = options;
    const normalizedSection = section === 'categories' ? 'categories' : 'articles';
    currentWikiSection = section;
    const title = document.getElementById('wiki-section-title');
    const createBtnText = document.getElementById('btn-new-wiki-text');

    const btnArticles = document.getElementById('btn-wiki-articles');
    const btnCategories = document.getElementById('btn-wiki-categories');
    if (!title || !createBtnText || !btnArticles || !btnCategories) return;

    // Reset styles
    btnArticles.className = 'px-4 py-2 rounded-xl text-[#c2c6d6] hover:bg-white/5 font-medium text-sm transition-colors border border-transparent';
    btnCategories.className = 'px-4 py-2 rounded-xl text-[#c2c6d6] hover:bg-white/5 font-medium text-sm transition-colors border border-transparent';

    if (normalizedSection === 'articles') {
        title.innerText = 'Wiki - Artigos';
        createBtnText.innerText = 'Novo Artigo';
        btnArticles.className = 'px-4 py-2 rounded-xl text-[#adc6ff] bg-white/5 font-medium text-sm transition-colors border border-[#adc6ff]/20';
        renderAdminArticles();
    } else if (normalizedSection === 'categories') {
        title.innerText = 'Wiki - Categorias';
        createBtnText.innerText = 'Nova Categoria';
        btnCategories.className = 'px-4 py-2 rounded-xl text-[#adc6ff] bg-white/5 font-medium text-sm transition-colors border border-[#adc6ff]/20';
        renderAdminCategories();
    }

    currentWikiSection = normalizedSection;
    if (syncUrl) syncWikiSectionToUrl(normalizedSection);
}
window.showWikiSection = showWikiSection;

async function renderAdminArticles() {
    const articles = await db.getArticles();
    const categories = await db.getCategories();
    const contentArea = document.getElementById('wiki-content-area');
    const featuredArticles = getSortedFeaturedArticles(articles);

    let html = `
        <div class="bg-surface-container-lowest rounded-2xl border border-white/10 overflow-hidden w-full overflow-x-auto">
            <table class="w-full text-left min-w-[600px]">
                <thead class="bg-white/5 border-b border-white/10 text-on-surface-variant text-sm uppercase tracking-wider font-label">
                    <tr>
                        <th class="px-6 py-4">Título</th>
                        <th class="px-6 py-4">Categoria</th>
                        <th class="px-6 py-4">Status</th>
                        <th class="px-6 py-4">Atualizado</th>
                        <th class="px-6 py-4 text-right">Ações</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-white/5 text-white">
    `;

    if (articles.length === 0) {
        html += `<tr><td colspan="5" class="px-6 py-8 text-center text-on-surface-variant">Nenhum artigo encontrado.</td></tr>`;
    } else {
        articles.sort((a, b) => new Date(b.updated_at || b.updatedAt) - new Date(a.updated_at || a.updatedAt)).forEach(article => {
            const cat = categories.find(c => c.id === (article.category_id || article.categoryId));
            const statusColor = article.status === 'published' ? 'text-[#6cdf65]' : 'text-[#8b91a8]';
            const date = new Date(article.updated_at || article.updatedAt).toLocaleDateString('pt-BR');
            
            html += `
                <tr class="hover:bg-white/5 transition-colors">
                    <td class="px-6 py-4 font-medium text-sm">${article.title}</td>
                    <td class="px-6 py-4 text-[#c2c6d6] text-sm">${cat ? cat.name : '-'}</td>
                    <td class="px-6 py-4 font-medium text-sm ${statusColor}">${article.status === 'published' ? 'Publicado' : 'Rascunho'}</td>
                    <td class="px-6 py-4 text-[#c2c6d6] text-sm">${date}</td>
                    <td class="px-6 py-4 text-right">
                        <button onclick="editArticle('${article.id}')" class="text-[#adc6ff] hover:text-white bg-[#adc6ff]/10 p-2 rounded-lg transition-colors mr-2" title="Editar">
                            <span class="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button onclick="deleteArticle('${article.id}')" class="text-[#ffb4ab] hover:text-white bg-[#ffb4ab]/10 p-2 rounded-lg transition-colors" title="Excluir">
                            <span class="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                    </td>
                </tr>
            `;
        });
    }

    html += `</tbody></table></div>`;

    html += `
        <div class="mt-6 bg-surface-container-lowest rounded-2xl border border-white/10 p-6">
            <div class="flex items-center justify-between gap-3 mb-4">
                <h3 class="text-lg font-bold font-headline text-white">Ordem dos Artigos em Destaque</h3>
                <span class="text-xs text-[#8b91a8]">Use os botões para mover para cima/baixo</span>
            </div>
            <div class="space-y-2">
    `;

    if (featuredArticles.length === 0) {
        html += `<p class="text-sm text-[#8b91a8]">Nenhum artigo marcado como destaque.</p>`;
    } else {
        featuredArticles.forEach((article, index) => {
            const cat = categories.find(c => c.id === (article.category_id || article.categoryId));
            const isFirst = index === 0;
            const isLast = index === featuredArticles.length - 1;
            html += `
                <div class="flex items-center justify-between gap-4 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                    <div class="min-w-0">
                        <p class="text-sm font-semibold text-white truncate">${article.title}</p>
                        <p class="text-xs text-[#8b91a8]">${cat ? cat.name : 'Sem categoria'} • posição ${index + 1}</p>
                    </div>
                    <div class="flex items-center gap-2 shrink-0">
                        <button onclick="moveFeaturedArticle('${article.id}', 'up')" ${isFirst ? 'disabled' : ''} class="text-[#adc6ff] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed bg-[#adc6ff]/10 p-2 rounded-lg transition-colors" title="Mover para cima">
                            <span class="material-symbols-outlined text-[18px]">arrow_upward</span>
                        </button>
                        <button onclick="moveFeaturedArticle('${article.id}', 'down')" ${isLast ? 'disabled' : ''} class="text-[#adc6ff] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed bg-[#adc6ff]/10 p-2 rounded-lg transition-colors" title="Mover para baixo">
                            <span class="material-symbols-outlined text-[18px]">arrow_downward</span>
                        </button>
                    </div>
                </div>
            `;
        });
    }

    html += `
            </div>
        </div>
    `;
    contentArea.innerHTML = html;
}

window.moveFeaturedArticle = async function(articleId, direction) {
    const allArticles = await db.getArticles();
    const featured = getSortedFeaturedArticles(allArticles);
    const currentIndex = featured.findIndex((article) => article.id === articleId);
    if (currentIndex === -1) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= featured.length) return;

    const temp = featured[currentIndex];
    featured[currentIndex] = featured[targetIndex];
    featured[targetIndex] = temp;

    try {
        for (let i = 0; i < featured.length; i++) {
            const article = featured[i];
            await db.saveArticle({
                ...article,
                categoryId: article.categoryId || article.category_id,
                featured: true,
                featuredOrder: i + 1
            });
        }
        if (typeof showToast === 'function') showToast('Ordem dos destaques atualizada com sucesso!');
        renderAdminArticles();
    } catch (error) {
        console.error('Erro ao reordenar destaques:', error);
        if (typeof showToast === 'function') showToast('Erro ao reordenar destaques.', 'error');
    }
}

async function renderAdminCategories() {
    const categories = await db.getCategories();
    const contentArea = document.getElementById('wiki-content-area');

    let html = `
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    `;

    categories.forEach(cat => {
        html += `
            <div class="bg-surface-container-lowest p-6 rounded-2xl border border-white/10 flex flex-col items-center text-center">
                <div class="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-[#adc6ff] mb-4">
                    <span class="material-symbols-outlined text-3xl">${cat.icon}</span>
                </div>
                <h3 class="font-headline text-xl font-bold text-white mb-2">${cat.name}</h3>
                <p class="text-sm text-[#c2c6d6] mb-4">${cat.description}</p>
                <div class="mt-auto flex gap-2 w-full">
                    <button class="flex-1 bg-white/5 py-2 rounded-lg text-[#c2c6d6] hover:text-white transition-colors text-sm font-medium border border-transparent hover:border-white/10">Editar</button>
                </div>
            </div>
        `;
    });

    html += `</div>`;
    contentArea.innerHTML = html;
}

// Editor Functions
async function populateCategorySelect() {
    const select = document.getElementById('article-category-input');
    const categories = await db.getCategories();
    select.innerHTML = categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
}

async function openArticleEditor(articleId = null) {
    await populateCategorySelect();
    const modal = document.getElementById('editor-modal');
    const titleEl = document.getElementById('editor-title');
    
    document.getElementById('article-form').reset();
    document.getElementById('article-id').value = '';
    const featuredCheckbox = document.getElementById('wiki-article-featured');
    if (featuredCheckbox) featuredCheckbox.checked = false;
    quill.root.innerHTML = '';

    if (articleId) {
        const allArticles = await db.getArticles();
        const article = allArticles.find(a => a.id === articleId);
        if (article) {
            titleEl.innerText = 'Editar Artigo';
            document.getElementById('article-id').value = article.id;
            document.getElementById('article-title-input').value = article.title;
            document.getElementById('article-slug-input').value = article.slug;
            document.getElementById('article-category-input').value = article.category_id || article.categoryId;
            const statusInput = document.querySelector(`input[name="article-status"][value="${article.status}"]`);
            if (statusInput) statusInput.checked = true;
            if (featuredCheckbox) featuredCheckbox.checked = article.featured || false;
            quill.clipboard.dangerouslyPasteHTML(sanitizeArticleHtml(article.content));
        }
    } else {
        titleEl.innerText = 'Novo Artigo';
    }

    modal.classList.remove('hidden-view');
    modal.scrollTop = 0;
    const modalPanel = modal.firstElementChild;
    if (modalPanel) modalPanel.scrollTop = 0;
    quill.setSelection(0, 0, 'silent');
}

window.closeEditor = function() {
    document.getElementById('editor-modal').classList.add('hidden-view');
}

async function handleArticleSubmit(e) {
    e.preventDefault();
    
    const id = document.getElementById('article-id').value;
    const title = document.getElementById('article-title-input').value.trim();
    const slug = document.getElementById('article-slug-input').value.trim().toLowerCase();
    const categoryId = document.getElementById('article-category-input').value.trim();
    const status = document.querySelector('input[name="article-status"]:checked') ? document.querySelector('input[name="article-status"]:checked').value : 'published';
    const featured = document.getElementById('wiki-article-featured') ? document.getElementById('wiki-article-featured').checked : false;
    const content = sanitizeArticleHtml(quill.root.innerHTML.trim());
    const contentText = quill.getText().trim();

    if (!title || title.length < 3 || title.length > MAX_TITLE_LENGTH) {
        if (typeof showToast === 'function') showToast(`Título inválido. Use entre 3 e ${MAX_TITLE_LENGTH} caracteres.`, 'error');
        return;
    }
    if (!slug || !/^[a-z0-9-]+$/.test(slug) || slug.length > MAX_SLUG_LENGTH) {
        if (typeof showToast === 'function') showToast(`Slug inválido. Use apenas letras minúsculas, números e hífen (máx. ${MAX_SLUG_LENGTH}).`, 'error');
        return;
    }
    if (!categoryId) {
        if (typeof showToast === 'function') showToast('Selecione uma categoria.', 'error');
        return;
    }
    if (!contentText || contentText.length < 10) {
        if (typeof showToast === 'function') showToast('Conteúdo muito curto. Escreva pelo menos 10 caracteres.', 'error');
        return;
    }
    if (content.length > MAX_CONTENT_LENGTH) {
        if (typeof showToast === 'function') showToast('Conteúdo muito grande para salvar. Reduza imagens/HTML incorporado.', 'error');
        return;
    }

    let articles = await db.getArticles();
    const featuredArticles = getSortedFeaturedArticles(articles.filter((article) => article.id !== id));
    const nextFeaturedOrder = featuredArticles.length + 1;

    let articleToSave;

    if (id) {
        const index = articles.findIndex(a => a.id == id);
        if (index === -1) {
            if (typeof showToast === 'function') showToast('Artigo não encontrado para atualização.', 'error');
            return;
        }
        await saveVersion(articles[index]);

        articleToSave = {
            ...articles[index],
            title, slug, categoryId, status, content, featured,
            featuredOrder: featured ? getFeaturedOrder(articles[index]) === Number.MAX_SAFE_INTEGER ? nextFeaturedOrder : getFeaturedOrder(articles[index]) : null,
            updatedAt: new Date().toISOString()
        };
        if(typeof showToast === 'function') showToast('Artigo atualizado com sucesso!');
    } else {
        articleToSave = {
            id: Date.now().toString(),
            title, slug, categoryId, status, content, featured,
            featuredOrder: featured ? nextFeaturedOrder : null,
            authorId: '1', // mock admin
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        if(typeof showToast === 'function') showToast('Artigo criado com sucesso!');
    }

    try {
        if (articleToSave) {
            await db.saveArticle(articleToSave);
        }
        closeEditor();
        renderAdminArticles();
    } catch (error) {
        console.error("Erro ao salvar artigo:", error);
        if(typeof showToast === 'function') showToast('Erro: ' + error.message, 'error');
    }
}

async function saveVersion(article) {
    const existingVersions = await db.getVersions();
    const versions = Array.isArray(existingVersions) ? existingVersions : [];
    versions.push({
        id: Date.now(),
        articleId: article.id,
        content: article.content,
        savedAt: new Date().toISOString(),
        savedBy: 1
    });
    await db.saveVersions(versions);
}

window.editArticle = function(id) {
    openArticleEditor(id);
}

window.deleteArticle = async function(id) {
    if (confirm('Tem certeza que deseja excluir este artigo?')) {
        try {
            await db.deleteArticle(id);
            if(typeof showToast === 'function') showToast('Artigo excluído com sucesso!');
            renderAdminArticles();
        } catch (error) {
            console.error("Erro ao excluir artigo:", error);
            if(typeof showToast === 'function') showToast('Erro: ' + error.message, 'error');
        }
    }
}
