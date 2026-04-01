document.addEventListener('DOMContentLoaded', async () => {
    renderCategoriesSidebar();
    
    // Check URL to see if we should render an article or the home page
    const params = new URLSearchParams(window.location.search);
    const articleSlug = params.get('article');
    const categorySlug = params.get('category');
    const searchQuery = params.get('q');

    if (articleSlug) {
        renderArticle(articleSlug);
    } else if (categorySlug) {
        renderCategory(categorySlug);
    } else if (searchQuery) {
        renderSearch(searchQuery);
    } else {
        await renderHome();
    }

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

async function renderCategoriesSidebar() {
    const sidebar = document.getElementById('categories-sidebar');
    if (!sidebar) return;

    const categories = await db.getCategories();
    let html = '';
    categories.forEach(cat => {
        html += `
            <a class="flex items-center gap-3 p-4 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-all" href="?category=${cat.slug}">
                <span class="material-symbols-outlined text-xl" data-icon="${cat.icon}">${cat.icon}</span>
                ${cat.name}
            </a>
        `;
    });
    sidebar.innerHTML = html;
}

async function renderHome() {
    const mainContent = document.getElementById('main-content');
    if (!mainContent) return;

    const categories = await db.getCategories();
    const allArticles = await db.getArticles();
    const articles = allArticles.filter(a => a.status === 'published');

    let html = `
        <!-- Category Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
    `;

    categories.slice(0, 4).forEach((cat, index) => {
        const colors = ['primary', 'secondary', 'tertiary', 'outline'];
        const color = colors[index % colors.length];
        
        html += `
            <div class="bg-surface-container-low p-8 rounded-[2rem] hover:bg-surface-container-high transition-all duration-300 group border border-outline-variant/5">
                <div class="w-14 h-14 rounded-2xl bg-${color}/10 flex items-center justify-center text-${color === 'outline' ? 'on-surface' : color} mb-6 group-hover:scale-110 transition-transform">
                    <span class="material-symbols-outlined text-3xl" data-icon="${cat.icon}">${cat.icon}</span>
                </div>
                <h3 class="font-headline text-2xl font-bold text-on-surface mb-3">${cat.name}</h3>
                <p class="text-on-surface-variant font-body mb-6">${cat.description}</p>
                <a class="text-${color === 'outline' ? 'on-surface' : color} font-label text-sm flex items-center gap-2 hover:gap-3 transition-all" href="?category=${cat.slug}">Explorar categoria <span class="material-symbols-outlined text-sm">arrow_forward</span></a>
            </div>
        `;
    });

    html += `
        </div>
        <!-- Featured Articles -->
        <div>
            <div class="flex items-center justify-between mb-8">
                <h2 class="font-headline text-3xl font-bold text-on-surface">Artigos Recentes</h2>
            </div>
            <div class="space-y-4">
    `;

    // Sort by date desc
    articles.sort((a, b) => new Date(b.created_at || b.createdAt) - new Date(a.created_at || a.createdAt)).slice(0, 5).forEach(article => {
        const cat = categories.find(c => c.id === (article.category_id || article.categoryId));
        const icon = cat ? cat.icon : 'article';
        
        html += `
            <article class="group bg-surface-container-lowest p-6 rounded-2xl border-b border-transparent hover:border-primary/20 hover:bg-surface-container-low transition-all">
                <a class="flex items-center justify-between" href="?article=${article.slug}">
                    <div class="flex items-center gap-6">
                        <div class="w-12 h-12 flex items-center justify-center bg-surface-container-high rounded-xl text-on-surface-variant group-hover:text-primary transition-colors">
                            <span class="material-symbols-outlined" data-icon="${icon}">${icon}</span>
                        </div>
                        <div>
                            <h4 class="font-headline text-lg font-bold text-on-surface">${article.title}</h4>
                            <p class="text-sm text-on-surface-variant">${timeAgo(article.created_at || article.createdAt)} • Em ${cat ? cat.name : 'Geral'}</p>
                        </div>
                    </div>
                    <span class="material-symbols-outlined text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity">chevron_right</span>
                </a>
            </article>
        `;
    });

    html += `
            </div>
        </div>
    `;

    mainContent.innerHTML = html;
}

async function renderArticle(slug) {
    const mainContent = document.getElementById('main-content');
    const allArticles = await db.getArticles();
    const article = allArticles.find(a => a.slug === slug && a.status === 'published');
    
    if (!article) {
        mainContent.innerHTML = `<h2 class="text-3xl font-bold text-on-surface">Artigo não encontrado</h2>`;
        return;
    }

    // SEO Meta Tags update
    document.title = `${article.title} - Wiki`;
    
    const allCategories = await db.getCategories();
    const cat = allCategories.find(c => c.id === (article.category_id || article.categoryId));

    mainContent.innerHTML = `
        <div class="bg-surface-container-lowest p-8 rounded-[2rem] border border-outline-variant/5">
            <div class="mb-8 border-b border-white/10 pb-6">
                <div class="flex items-center gap-2 text-sm text-primary mb-4">
                    <a href="index.html" class="hover:underline">Início</a>
                    <span class="material-symbols-outlined text-[16px]">chevron_right</span>
                    <a href="?category=${cat ? cat.slug : ''}" class="hover:underline">${cat ? cat.name : 'Geral'}</a>
                </div>
                <h1 class="font-headline text-4xl md:text-5xl font-extrabold text-on-surface mb-4">${article.title}</h1>
                <p class="text-on-surface-variant text-sm">${timeAgo(article.created_at || article.createdAt)}</p>
            </div>
            <div class="prose prose-invert prose-p:text-on-surface-variant prose-headings:text-on-surface max-w-none font-body">
                ${article.content}
            </div>
        </div>
    `;
}

async function renderCategory(slug) {
    const mainContent = document.getElementById('main-content');
    const allCategories = await db.getCategories();
    const cat = allCategories.find(c => c.slug === slug);
    
    if (!cat) {
        mainContent.innerHTML = `<h2 class="text-3xl font-bold text-on-surface">Categoria não encontrada</h2>`;
        return;
    }

    // SEO Meta Tags update
    document.title = `${cat.name} - Wiki`;

    const allArticles = await db.getArticles();
    const articles = allArticles.filter(a => (a.category_id === cat.id || a.categoryId === cat.id) && a.status === 'published');
    
    let html = `
        <div class="mb-12">
            <div class="flex items-center gap-4 mb-4">
                <div class="w-16 h-16 rounded-2xl bg-surface-container-high flex items-center justify-center text-primary">
                    <span class="material-symbols-outlined text-4xl" data-icon="${cat.icon}">${cat.icon}</span>
                </div>
                <div>
                    <h1 class="font-headline text-4xl md:text-5xl font-extrabold text-on-surface">${cat.name}</h1>
                    <p class="text-on-surface-variant text-lg mt-2">${cat.description}</p>
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
                    <a class="flex items-center justify-between" href="?article=${article.slug}">
                        <div class="flex items-center gap-6">
                            <div class="w-12 h-12 flex items-center justify-center bg-surface-container-high rounded-xl text-on-surface-variant group-hover:text-primary transition-colors">
                                <span class="material-symbols-outlined" data-icon="article">article</span>
                            </div>
                            <div>
                                <h4 class="font-headline text-lg font-bold text-on-surface">${article.title}</h4>
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
    const allArticles = await db.getArticles();
    const articles = allArticles.filter(a => 
        a.status === 'published' && 
        (a.title.toLowerCase().includes(query.toLowerCase()) || a.content.toLowerCase().includes(query.toLowerCase()))
    );

    document.title = `Busca: ${query} - Wiki`;

    let html = `
        <div class="mb-8">
            <h1 class="font-headline text-4xl font-extrabold text-on-surface mb-2">Resultados para "${query}"</h1>
            <p class="text-on-surface-variant">${articles.length} artigo(s) encontrado(s).</p>
        </div>
        <div class="space-y-4">
    `;

    if (articles.length === 0) {
        html += `<p class="text-on-surface-variant">Tente buscar com outros termos.</p>`;
    } else {
        const categories = await db.getCategories();
        articles.forEach(article => {
            const cat = categories.find(c => c.id === (article.category_id || article.categoryId));
            const icon = cat ? cat.icon : 'article';
            html += `
                <article class="group bg-surface-container-lowest p-6 rounded-2xl border-b border-transparent hover:border-primary/20 hover:bg-surface-container-low transition-all">
                    <a class="flex items-center justify-between" href="?article=${article.slug}">
                        <div class="flex items-center gap-6">
                            <div class="w-12 h-12 flex items-center justify-center bg-surface-container-high rounded-xl text-on-surface-variant group-hover:text-primary transition-colors">
                                <span class="material-symbols-outlined">${icon}</span>
                            </div>
                            <div>
                                <h4 class="font-headline text-lg font-bold text-on-surface">${article.title}</h4>
                                <p class="text-sm text-on-surface-variant">Em ${cat ? cat.name : 'Geral'}</p>
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
