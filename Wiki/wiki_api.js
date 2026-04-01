// wiki_api.js
// Client API para conectar ao Vercel Serverless Backend

const API_BASE = '/api';

const db = {
    // Flag temporária para fallback se o backend falhar
    useMock: false, 

    async getCategories() {
        if (this.useMock) return JSON.parse(localStorage.getItem('wiki_categories') || '[]');
        const res = await fetch(`${API_BASE}/wiki/categories`);
        return await res.json();
    },
    
    async getArticles() {
        if (this.useMock) return JSON.parse(localStorage.getItem('wiki_articles') || '[]');
        const res = await fetch(`${API_BASE}/wiki/articles`);
        return await res.json();
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
            await fetch(`${API_BASE}/wiki/categories`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        }
    },

    async saveArticle(art) {
        if (this.useMock) {
            let articles = JSON.parse(localStorage.getItem('wiki_articles') || '[]');
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
            status: art.status
        };
        await fetch(`${API_BASE}/wiki/articles`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
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
            await fetch(`${API_BASE}/wiki/articles`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        }
    },

    // Versões ainda em localStorage por enquanto (para não complicar o DB demais agora)
    async getVersions() {
        return JSON.parse(localStorage.getItem('wiki_versions') || '[]');
    },
    async saveVersions(data) {
        localStorage.setItem('wiki_versions', JSON.stringify(data));
    },

    async deleteArticle(id) {
        if (this.useMock) {
            let articles = JSON.parse(localStorage.getItem('wiki_articles') || '[]');
            articles = articles.filter(a => a.id !== id);
            localStorage.setItem('wiki_articles', JSON.stringify(articles));
            return;
        }
        await fetch(`${API_BASE}/wiki/articles?id=${id}`, {
            method: 'DELETE'
        });
    }
};

window.db = db;
