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
            await fetch(`${API_BASE}/wiki/categories`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(cat)
            });
        }
    },

    async saveArticles(data) {
        if (this.useMock) return localStorage.setItem('wiki_articles', JSON.stringify(data));
        for(let art of data) {
            await fetch(`${API_BASE}/wiki/articles`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(art)
            });
        }
    },

    // Versões ainda em localStorage por enquanto (para não complicar o DB demais agora)
    async getVersions() {
        return JSON.parse(localStorage.getItem('wiki_versions') || '[]');
    },
    async saveVersions(data) {
        localStorage.setItem('wiki_versions', JSON.stringify(data));
    }
};

window.db = db;
