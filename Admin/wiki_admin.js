let quill;
let currentWikiSection = 'articles';

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
                showWikiSection('articles');
            } else if (typeof showSection === 'function') {
                showSection('wiki');
                showWikiSection('articles');
            }
        });
    }

    const mobNavWiki = document.getElementById('mob-nav-wiki');
    if (mobNavWiki) {
        mobNavWiki.addEventListener('click', (e) => {
            e.preventDefault();
            if (typeof window.showSection === 'function') {
                window.showSection('wiki');
                showWikiSection('articles');
            } else if (typeof showSection === 'function') {
                showSection('wiki');
                showWikiSection('articles');
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
            toolbar: [
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
            ]
        }
    });
}

function showWikiSection(section) {
    currentWikiSection = section;
    const title = document.getElementById('wiki-section-title');
    const createBtnText = document.getElementById('btn-new-wiki-text');

    const btnArticles = document.getElementById('btn-wiki-articles');
    const btnCategories = document.getElementById('btn-wiki-categories');

    // Reset styles
    btnArticles.className = 'px-4 py-2 rounded-xl text-[#c2c6d6] hover:bg-white/5 font-medium text-sm transition-colors border border-transparent';
    btnCategories.className = 'px-4 py-2 rounded-xl text-[#c2c6d6] hover:bg-white/5 font-medium text-sm transition-colors border border-transparent';

    if (section === 'articles') {
        title.innerText = 'Wiki - Artigos';
        createBtnText.innerText = 'Novo Artigo';
        btnArticles.className = 'px-4 py-2 rounded-xl text-[#adc6ff] bg-white/5 font-medium text-sm transition-colors border border-[#adc6ff]/20';
        renderAdminArticles();
    } else if (section === 'categories') {
        title.innerText = 'Wiki - Categorias';
        createBtnText.innerText = 'Nova Categoria';
        btnCategories.className = 'px-4 py-2 rounded-xl text-[#adc6ff] bg-white/5 font-medium text-sm transition-colors border border-[#adc6ff]/20';
        renderAdminCategories();
    }
}

async function renderAdminArticles() {
    const articles = await db.getArticles();
    const categories = await db.getCategories();
    const contentArea = document.getElementById('wiki-content-area');

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
    contentArea.innerHTML = html;
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
            document.querySelector(`input[name="article-status"][value="${article.status}"]`).checked = true;
            if (featuredCheckbox) featuredCheckbox.checked = article.featured || false;
            quill.clipboard.dangerouslyPasteHTML(article.content);
        }
    } else {
        titleEl.innerText = 'Novo Artigo';
    }

    modal.classList.remove('hidden-view');
}

window.closeEditor = function() {
    document.getElementById('editor-modal').classList.add('hidden-view');
}

async function handleArticleSubmit(e) {
    e.preventDefault();
    
    // Assuming currentUser logic is skipped or mocked to admin here
    const id = document.getElementById('article-id').value;
    const title = document.getElementById('article-title-input').value;
    const slug = document.getElementById('article-slug-input').value;
    const categoryId = document.getElementById('article-category-input').value;
    const status = document.querySelector('input[name="article-status"]:checked') ? document.querySelector('input[name="article-status"]:checked').value : 'published';
    const featured = document.getElementById('wiki-article-featured') ? document.getElementById('wiki-article-featured').checked : false;
    const content = quill.root.innerHTML;

    let articles = await db.getArticles();

    let articleToSave;

    if (id) {
        // Update existing
        const index = articles.findIndex(a => a.id == id);
        if (index !== -1) {
            // Save version
            saveVersion(articles[index]);

            articleToSave = {
                ...articles[index],
                title, slug, categoryId, status, content, featured,
                updatedAt: new Date().toISOString()
            };
            if(typeof showToast === 'function') showToast('Artigo atualizado com sucesso!');
        }
    } else {
        // Create new
        articleToSave = {
            id: Date.now().toString(),
            title, slug, categoryId, status, content, featured,
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

function saveVersion(article) {
    const versions = db.getVersions();
    versions.push({
        id: Date.now(),
        articleId: article.id,
        content: article.content,
        savedAt: new Date().toISOString(),
        savedBy: 1
    });
    db.saveVersions(versions);
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
