document.addEventListener('DOMContentLoaded', async () => {
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
        mainContent.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16 animate-pulse">
                <div class="bg-surface-container-low rounded-[2rem] h-52"></div>
                <div class="bg-surface-container-low rounded-[2rem] h-52"></div>
                <div class="bg-surface-container-low rounded-[2rem] h-52"></div>
                <div class="bg-surface-container-low rounded-[2rem] h-52"></div>
            </div>
            <div class="space-y-4 animate-pulse">
                <div class="bg-surface-container-lowest rounded-2xl h-24"></div>
                <div class="bg-surface-container-lowest rounded-2xl h-24"></div>
                <div class="bg-surface-container-lowest rounded-2xl h-24"></div>
            </div>
        `;
    }
    const sidebar = document.getElementById('categories-sidebar');
    if (sidebar) {
        sidebar.innerHTML = `
            <div class="space-y-2 animate-pulse">
                <div class="bg-surface-container h-12 rounded-xl"></div>
                <div class="bg-surface-container h-12 rounded-xl"></div>
                <div class="bg-surface-container h-12 rounded-xl"></div>
                <div class="bg-surface-container h-12 rounded-xl"></div>
            </div>
        `;
    }
    const sidebarPromise = renderCategoriesSidebar();
    
    // Check URL to see if we should render an article or the home page
    const params = new URLSearchParams(window.location.search);
    const articleSlug = params.get('article');
    const categorySlug = params.get('category');
    const searchQuery = params.get('q');

    if (articleSlug) {
        await renderArticle(articleSlug);
    } else if (categorySlug) {
        await renderCategory(categorySlug);
    } else if (searchQuery) {
        await renderSearch(searchQuery);
    } else {
        await renderHome();
    }
    await sidebarPromise;

    // Handle search input
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');

    if (searchBtn && searchInput) {
        searchBtn.addEventListener('click', () => {
            const q = searchInput.value.trim();
            if (q) {
                window.location.href = `?q=${encodeURIComponent(q)}`;
            }
        });
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                searchBtn.click();
            }
        });
    }
});

function timeAgo(dateString) {
    const date = new Date(dateString);
    const seconds = Math.floor((new Date() - date) / 1000);
    let interval = seconds / 86400;
    if (interval > 1) return `Publicado há ${Math.floor(interval)} dias`;
    interval = seconds / 3600;
    if (interval > 1) return `Publicado há ${Math.floor(interval)} horas`;
    interval = seconds / 60;
    if (interval > 1) return `Publicado há ${Math.floor(interval)} minutos`;
    return 'Publicado recentemente';
}

function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, tag => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
    }[tag]));
}

function asArray(value) {
    return Array.isArray(value) ? value : [];
}

function asText(value) {
    return typeof value === 'string' ? value : '';
}

function getFeaturedOrder(article) {
    const parsed = Number.parseInt(article?.featured_order ?? article?.featuredOrder, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : Number.MAX_SAFE_INTEGER;
}

function sanitizeUrl(value) {
    const url = asText(value).trim();
    if (!url) return '';
    if (url.startsWith('/') || url.startsWith('#') || url.startsWith('?')) return url;
    try {
        const parsed = new URL(url, window.location.origin);
        if (parsed.protocol === 'http:' || parsed.protocol === 'https:') return parsed.href;
        return '';
    } catch {
        return '';
    }
}

function formatInlineMarkdown(text) {
    let formatted = escapeHTML(asText(text));
    formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');
    formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    formatted = formatted.replace(/\*([^*\n]+)\*/g, '<em>$1</em>');
    formatted = formatted.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, href) => {
        const safeHref = sanitizeUrl(href);
        if (!safeHref) return escapeHTML(label);
        return `<a href="${safeHref}" target="_blank" rel="noopener noreferrer">${escapeHTML(label)}</a>`;
    });
    return formatted;
}

function markdownToHtml(content) {
    const lines = asText(content).split('\n');
    const htmlParts = [];
    let listType = null;

    const closeList = () => {
        if (listType) {
            htmlParts.push(`</${listType}>`);
            listType = null;
        }
    };

    lines.forEach((rawLine) => {
        const line = asText(rawLine);
        const trimmed = line.trim();

        if (!trimmed) {
            closeList();
            return;
        }

        const imageMatch = trimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
        if (imageMatch) {
            closeList();
            const alt = escapeHTML(imageMatch[1]);
            const src = sanitizeUrl(imageMatch[2]);
            if (src) {
                htmlParts.push(`<p><img src="${src}" alt="${alt}" loading="lazy" decoding="async"></p>`);
            }
            return;
        }

        const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
        if (headingMatch) {
            closeList();
            const level = headingMatch[1].length;
            htmlParts.push(`<h${level}>${formatInlineMarkdown(headingMatch[2])}</h${level}>`);
            return;
        }

        const orderedMatch = trimmed.match(/^\d+\.\s+(.+)$/);
        if (orderedMatch) {
            if (listType !== 'ol') {
                closeList();
                listType = 'ol';
                htmlParts.push('<ol>');
            }
            htmlParts.push(`<li>${formatInlineMarkdown(orderedMatch[1])}</li>`);
            return;
        }

        const unorderedMatch = trimmed.match(/^[-*]\s+(.+)$/);
        if (unorderedMatch) {
            if (listType !== 'ul') {
                closeList();
                listType = 'ul';
                htmlParts.push('<ul>');
            }
            htmlParts.push(`<li>${formatInlineMarkdown(unorderedMatch[1])}</li>`);
            return;
        }

        if (trimmed.startsWith('>')) {
            closeList();
            htmlParts.push(`<blockquote>${formatInlineMarkdown(trimmed.replace(/^>\s?/, ''))}</blockquote>`);
            return;
        }

        closeList();
        htmlParts.push(`<p>${formatInlineMarkdown(trimmed)}</p>`);
    });

    closeList();
    return htmlParts.join('');
}

function sanitizeHtml(html) {
    const template = document.createElement('template');
    template.innerHTML = asText(html);

    ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button', 'textarea', 'select', 'meta', 'link'].forEach((tag) => {
        template.content.querySelectorAll(tag).forEach((el) => el.remove());
    });

    template.content.querySelectorAll('*').forEach((el) => {
        [...el.attributes].forEach((attr) => {
            const name = attr.name.toLowerCase();
            const value = attr.value;
            if (name.startsWith('on') || name === 'style') {
                el.removeAttribute(attr.name);
                return;
            }
            if (name === 'href' || name === 'src') {
                const safe = sanitizeUrl(value);
                if (safe) {
                    el.setAttribute(attr.name, safe);
                } else {
                    el.removeAttribute(attr.name);
                }
            }
        });
    });

    return template.innerHTML;
}

function normalizeArticleContent(content) {
    const value = asText(content).trim();
    if (!value) return '<p></p>';
    const looksLikeHtml = /<\/?[a-z][\s\S]*>/i.test(value);
    const html = looksLikeHtml ? value : markdownToHtml(value);
    return sanitizeHtml(html);
}

async function renderCategoriesSidebar() {
    const sidebar = document.getElementById('categories-sidebar');
    if (!sidebar) return;

    const categories = asArray(await db.getCategories());
    
    // Add "Visão Geral" as the first link
    let html = `
        <a class="flex items-center gap-3 p-4 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-all" href="index.html">
            <span class="material-symbols-outlined text-xl" data-icon="grid_view">grid_view</span>
            Visão Geral
        </a>
    `;
    
    categories.forEach(cat => {
        const slug = asText(cat.slug);
        const name = asText(cat.name);
        const icon = asText(cat.icon) || 'article';
        if (slug === 'geral' || name.toLowerCase() === 'visão geral') return;
        html += `
            <a class="flex items-center gap-3 p-4 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-all" href="?category=${encodeURIComponent(slug)}">
                <span class="material-symbols-outlined text-xl" data-icon="${escapeHTML(icon)}">${escapeHTML(icon)}</span>
                ${escapeHTML(name)}
            </a>
        `;
    });
    sidebar.innerHTML = html;
}

async function renderHome() {
    const mainContent = document.getElementById('main-content');
    if (!mainContent) return;

    const [categoriesData, allArticlesData] = await Promise.all([
        db.getCategories(),
        db.getArticles()
    ]);
    const categories = asArray(categoriesData);
    const allArticles = asArray(allArticlesData);
    const articles = allArticles.filter(a => a && a.status === 'published');

    let html = `
        <!-- Category Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
    `;

    categories.slice(0, 5).forEach((cat, index) => {
        const colors = ['primary', 'secondary', 'tertiary', 'outline'];
        const color = colors[index % colors.length];
        
        html += `
            <div class="bg-surface-container-low p-8 rounded-[2rem] hover:bg-surface-container-high transition-all duration-300 group border border-outline-variant/5">
                <div class="w-14 h-14 rounded-2xl bg-${color}/10 flex items-center justify-center text-${color === 'outline' ? 'on-surface' : color} mb-6 group-hover:scale-110 transition-transform">
                    <span class="material-symbols-outlined text-3xl" data-icon="${escapeHTML(asText(cat.icon))}">${escapeHTML(asText(cat.icon))}</span>
                </div>
                <h3 class="font-headline text-2xl font-bold text-on-surface mb-3">${escapeHTML(asText(cat.name))}</h3>
                <p class="text-on-surface-variant font-body mb-6">${escapeHTML(asText(cat.description))}</p>
                <a class="text-${color === 'outline' ? 'on-surface' : color} font-label text-sm flex items-center gap-2 hover:gap-3 transition-all" href="?category=${encodeURIComponent(asText(cat.slug))}">Explorar categoria <span class="material-symbols-outlined text-sm">arrow_forward</span></a>
            </div>
        `;
    });

    html += `
        </div>
        <!-- Featured Articles -->
        <div>
            <div class="flex items-center justify-between mb-8">
                <h2 class="font-headline text-3xl font-bold text-on-surface">Artigos em Destaque</h2>
            </div>
            <div class="space-y-4">
    `;

    // Filter featured articles and sort by custom order
    const featuredArticles = articles.filter(a => a.featured === true || a.featured === 'true');
    
    if (featuredArticles.length === 0) {
        html += `<p class="text-on-surface-variant">Nenhum artigo em destaque no momento.</p>`;
    } else {
        featuredArticles
            .sort((a, b) => {
                const orderDiff = getFeaturedOrder(a) - getFeaturedOrder(b);
                if (orderDiff !== 0) return orderDiff;
                return new Date(b.created_at || b.createdAt) - new Date(a.created_at || a.createdAt);
            })
            .slice(0, 5)
            .forEach(article => {
            const cat = categories.find(c => c.id === (article.category_id || article.categoryId));
            const icon = cat ? asText(cat.icon) : 'article';
            
            html += `
                <article class="group bg-surface-container-lowest p-6 rounded-2xl border-b border-transparent hover:border-primary/20 hover:bg-surface-container-low transition-all">
                    <a class="flex items-center justify-between" href="?article=${encodeURIComponent(asText(article.slug))}">
                        <div class="flex items-center gap-6">
                            <div class="w-12 h-12 flex items-center justify-center bg-surface-container-high rounded-xl text-on-surface-variant group-hover:text-primary transition-colors">
                                <span class="material-symbols-outlined" data-icon="${escapeHTML(icon)}">${escapeHTML(icon)}</span>
                            </div>
                            <div>
                                <h4 class="font-headline text-lg font-bold text-on-surface">${escapeHTML(asText(article.title))}</h4>
                                <p class="text-sm text-on-surface-variant">${timeAgo(article.created_at || article.createdAt)} • Em ${cat ? escapeHTML(asText(cat.name)) : 'Geral'}</p>
                            </div>
                        </div>
                        <span class="material-symbols-outlined text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity">chevron_right</span>
                    </a>
                </article>
            `;
            });
    }

    html += `
            </div>
        </div>
    `;

    mainContent.innerHTML = html;
}

async function renderArticle(slug) {
    const mainContent = document.getElementById('main-content');
    const allArticles = asArray(await db.getArticles());
    const article = allArticles.find(a => a && a.slug === slug && a.status === 'published');
    
    if (!article) {
        mainContent.innerHTML = `<h2 class="text-3xl font-bold text-on-surface">Artigo não encontrado</h2>`;
        return;
    }

    // SEO Meta Tags update
    document.title = `${article.title} - Wiki`;
    
    const allCategories = asArray(await db.getCategories());
    const cat = allCategories.find(c => c.id === (article.category_id || article.categoryId));
    const contentHtml = normalizeArticleContent(article.content);

    mainContent.innerHTML = `
        <div class="bg-surface-container-lowest p-8 rounded-[2rem] border border-outline-variant/5">
            <div class="mb-8 border-b border-white/10 pb-6">
                <div class="flex items-center gap-2 text-sm text-primary mb-4">
                    <a href="index.html" class="hover:underline">Início</a>
                    <span class="material-symbols-outlined text-[16px]">chevron_right</span>
                    <a href="?category=${cat ? encodeURIComponent(asText(cat.slug)) : ''}" class="hover:underline">${cat ? escapeHTML(asText(cat.name)) : 'Geral'}</a>
                </div>
                <h1 class="font-headline text-4xl md:text-5xl font-extrabold text-on-surface mb-4">${escapeHTML(asText(article.title))}</h1>
                <p class="text-on-surface-variant text-sm">${timeAgo(article.created_at || article.createdAt)}</p>
            </div>
            <div class="prose prose-invert prose-p:text-on-surface-variant prose-headings:text-on-surface max-w-none font-body">
                ${contentHtml}
            </div>
        </div>
    `;
}

async function renderCategory(slug) {
    const mainContent = document.getElementById('main-content');
    const allCategories = asArray(await db.getCategories());
    const cat = allCategories.find(c => c.slug === slug);
    
    if (!cat) {
        mainContent.innerHTML = `<h2 class="text-3xl font-bold text-on-surface">Categoria não encontrada</h2>`;
        return;
    }

    // SEO Meta Tags update
    document.title = `${cat.name} - Wiki`;

    const allArticles = asArray(await db.getArticles());
    const articles = allArticles.filter(a => a && (a.category_id === cat.id || a.categoryId === cat.id) && a.status === 'published');
    
    let html = `
        <div class="mb-12">
            <div class="flex items-center gap-4 mb-4">
                <div class="w-16 h-16 rounded-2xl bg-surface-container-high flex items-center justify-center text-primary">
                    <span class="material-symbols-outlined text-4xl" data-icon="${escapeHTML(asText(cat.icon))}">${escapeHTML(asText(cat.icon))}</span>
                </div>
                <div>
                    <h1 class="font-headline text-4xl md:text-5xl font-extrabold text-on-surface">${escapeHTML(asText(cat.name))}</h1>
                    <p class="text-on-surface-variant text-lg mt-2">${escapeHTML(asText(cat.description))}</p>
                </div>
            </div>
        </div>
        <div class="space-y-4">
    `;

    if (articles.length === 0) {
        html += `<p class="text-on-surface-variant">Nenhum artigo encontrado nesta categoria.</p>`;
    } else {
        articles.sort((a, b) => new Date(b.created_at || b.createdAt) - new Date(a.created_at || a.createdAt)).forEach(article => {
            html += `
                <article class="group bg-surface-container-lowest p-6 rounded-2xl border-b border-transparent hover:border-primary/20 hover:bg-surface-container-low transition-all">
                    <a class="flex items-center justify-between" href="?article=${encodeURIComponent(asText(article.slug))}">
                        <div class="flex items-center gap-6">
                            <div class="w-12 h-12 flex items-center justify-center bg-surface-container-high rounded-xl text-on-surface-variant group-hover:text-primary transition-colors">
                                <span class="material-symbols-outlined" data-icon="article">article</span>
                            </div>
                            <div>
                                <h4 class="font-headline text-lg font-bold text-on-surface">${escapeHTML(asText(article.title))}</h4>
                                <p class="text-sm text-on-surface-variant">${timeAgo(article.created_at || article.createdAt)}</p>
                            </div>
                        </div>
                        <span class="material-symbols-outlined text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity">chevron_right</span>
                    </a>
                </article>
            `;
        });
    }

    html += `</div>`;
    mainContent.innerHTML = html;
}

async function renderSearch(query) {
    const mainContent = document.getElementById('main-content');
    const allArticles = asArray(await db.getArticles());
    const queryText = asText(query).toLowerCase();
    const articles = allArticles.filter(a => 
        a &&
        a.status === 'published' && 
        (asText(a.title).toLowerCase().includes(queryText) || asText(a.content).toLowerCase().includes(queryText))
    );

    document.title = `Busca: ${query} - Wiki`;
    const safeQuery = escapeHTML(query);

    let html = `
        <div class="mb-8">
            <h1 class="font-headline text-4xl font-extrabold text-on-surface mb-2">Resultados para "${safeQuery}"</h1>
            <p class="text-on-surface-variant">${articles.length} artigo(s) encontrado(s).</p>
        </div>
        <div class="space-y-4">
    `;

    if (articles.length === 0) {
        html += `<p class="text-on-surface-variant">Tente buscar com outros termos.</p>`;
    } else {
        const categories = asArray(await db.getCategories());
        articles.forEach(article => {
            const cat = categories.find(c => c.id === (article.category_id || article.categoryId));
            const icon = cat ? asText(cat.icon) : 'article';
            html += `
                <article class="group bg-surface-container-lowest p-6 rounded-2xl border-b border-transparent hover:border-primary/20 hover:bg-surface-container-low transition-all">
                    <a class="flex items-center justify-between" href="?article=${encodeURIComponent(asText(article.slug))}">
                        <div class="flex items-center gap-6">
                            <div class="w-12 h-12 flex items-center justify-center bg-surface-container-high rounded-xl text-on-surface-variant group-hover:text-primary transition-colors">
                                <span class="material-symbols-outlined">${escapeHTML(icon)}</span>
                            </div>
                            <div>
                                <h4 class="font-headline text-lg font-bold text-on-surface">${escapeHTML(asText(article.title))}</h4>
                                <p class="text-sm text-on-surface-variant">Em ${cat ? escapeHTML(asText(cat.name)) : 'Geral'}</p>
                            </div>
                        </div>
                        <span class="material-symbols-outlined text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity">chevron_right</span>
                    </a>
                </article>
            `;
        });
    }

    html += `</div>`;
    mainContent.innerHTML = html;
}
