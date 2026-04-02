// wiki_api.js
// Client API para conectar ao Vercel Serverless Backend

const API_BASE = '/api';

function getStoredArray(key) {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function getAuthHeader() {
    const raw = localStorage.getItem('admin_token');
    if (!raw) return '';
    return `Bearer ${raw.replace(/^Bearer\s+/i, '')}`;
}

const db = {
    // Flag temporária para fallback se o backend falhar
    useMock: false, 

    async getCategories() {
        if (this.useMock) return getStoredArray('wiki_categories');
        try {
            const res = await fetch(`${API_BASE}/wiki/categories`);
            if (!res.ok) throw new Error('Falha ao carregar categorias');
            const data = await res.json();
            return Array.isArray(data) ? data : [];
        } catch (err) {
            console.error(err);
            return [];
        }
    },
    
    async getArticles() {
        if (this.useMock) return getStoredArray('wiki_articles');
        try {
            const res = await fetch(`${API_BASE}/wiki/articles`);
            if (!res.ok) throw new Error('Falha ao carregar artigos');
            const data = await res.json();
            return Array.isArray(data) ? data : [];
        } catch (err) {
            console.error(err);
            return [];
        }
    },

    async saveCategories(data) {
        if (this.useMock) return localStorage.setItem('wiki_categories', JSON.stringify(data));
        // No mundo real salvaríamos 1 a 1, mas para manter a API igual:
        for(let cat of data) {
            const payload = {
                id: cat.id,
                name: cat.name,
                slug: cat.slug || cat.id,
                description: cat.description,
                icon: cat.icon
            };
            const res = await fetch(`${API_BASE}/wiki/categories`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': getAuthHeader()
                },
                body: JSON.stringify(payload)
            });
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.error || 'Erro ao salvar categoria');
            }
        }
    },

    async saveArticle(art) {
        if (this.useMock) {
            let articles = getStoredArray('wiki_articles');
            const index = articles.findIndex(a => a.id === art.id);
            if (index !== -1) {
                articles[index] = art;
            } else {
                articles.push(art);
            }
            localStorage.setItem('wiki_articles', JSON.stringify(articles));
            return;
        }
        const payload = {
            id: art.id,
            category_id: art.categoryId || art.category_id,
            title: art.title,
            slug: art.slug,
            content: art.content,
            author: art.author || art.authorId || 'Admin',
            status: art.status,
            featured: art.featured || false
        };
        const res = await fetch(`${API_BASE}/wiki/articles`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': getAuthHeader()
            },
            body: JSON.stringify(payload)
        });
        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.error || 'Erro ao salvar artigo');
        }
    },

    async saveArticles(data) {
        if (this.useMock) return localStorage.setItem('wiki_articles', JSON.stringify(data));
        for(let art of data) {
            const payload = {
                id: art.id,
                category_id: art.categoryId || art.category_id,
                title: art.title,
                slug: art.slug,
                content: art.content,
                author: art.author || art.authorId || 'Admin',
                status: art.status
            };
            const res = await fetch(`${API_BASE}/wiki/articles`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': getAuthHeader()
                },
                body: JSON.stringify(payload)
            });
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.error || 'Erro ao salvar artigo');
            }
        }
    },

    // Versões ainda em localStorage por enquanto (para não complicar o DB demais agora)
    async getVersions() {
        return getStoredArray('wiki_versions');
    },
    async saveVersions(data) {
        localStorage.setItem('wiki_versions', JSON.stringify(data));
    },

    async deleteArticle(id) {
        if (this.useMock) {
            let articles = getStoredArray('wiki_articles');
            articles = articles.filter(a => a.id !== id);
            localStorage.setItem('wiki_articles', JSON.stringify(articles));
            return;
        }
        const res = await fetch(`${API_BASE}/wiki/articles?id=${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': getAuthHeader()
            }
        });
        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.error || 'Erro ao excluir artigo');
        }
    }
};

window.db = db;
