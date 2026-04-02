// mock_db.js
// Mock Database using localStorage

const defaultCategories = [
    { id: 1, slug: 'geral', name: 'Visão Geral', icon: 'dashboard', description: 'Termos de serviço e guias introdutórios.' },
    { id: 2, slug: 'minecraft', name: 'Minecraft', icon: 'sports_esports', description: 'Tudo sobre instalação de plugins, mods, otimização de performance.' },
    { id: 3, slug: 'vps', name: 'VPS Hosting', icon: 'dns', description: 'Guias para Linux, Windows, configuração de firewall e administração.' },
    { id: 4, slug: 'financeiro', name: 'Faturamento', icon: 'payments', description: 'Informações sobre métodos de pagamento, renovações e faturas.' },
    { id: 5, slug: 'seguranca', name: 'Segurança', icon: 'security', description: 'Melhores práticas para manter seu servidor seguro.' },
    { id: 6, slug: 'painel', name: 'Painel', icon: 'tune', description: 'Guias de uso do painel de controle, criação de servidor, backup e ações rápidas.' }
];

const defaultArticles = [
    {
        id: 1,
        slug: 'como-configurar-seu-servidor-de-minecraft',
        title: 'Como configurar seu servidor de Minecraft',
        categoryId: 2,
        content: '<h1>Configurando seu Servidor</h1><p>Bem-vindo ao guia de configuração. Primeiro, acesse o painel...</p>',
        authorId: 1,
        status: 'published', // draft, pending, published
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
        updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
        id: 2,
        slug: 'instalando-modpacks-via-painel',
        title: 'Instalando Modpacks via Painel',
        categoryId: 2,
        content: '<h1>Instalando Modpacks</h1><p>No painel lateral, clique em Modpacks e selecione o seu favorito...</p>',
        authorId: 1,
        status: 'published',
        createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
        updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    },
    {
        id: 3,
        slug: 'configurando-dns-para-sua-vps',
        title: 'Configurando DNS para sua VPS',
        categoryId: 3,
        content: '<h1>Configurando DNS</h1><p>Para apontar seu domínio para a VPS, crie um registro A apontando para o IP...</p>',
        authorId: 1,
        status: 'published',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    }
];

const defaultUsers = [
    { id: 1, username: 'admin', password: '123', role: 'admin' },
    { id: 2, username: 'editor', password: '123', role: 'editor' },
    { id: 3, username: 'viewer', password: '123', role: 'viewer' }
];

function initDB() {
    if (!localStorage.getItem('wiki_categories')) {
        localStorage.setItem('wiki_categories', JSON.stringify(defaultCategories));
    }
    if (!localStorage.getItem('wiki_articles')) {
        localStorage.setItem('wiki_articles', JSON.stringify(defaultArticles));
    }
    if (!localStorage.getItem('wiki_users')) {
        localStorage.setItem('wiki_users', JSON.stringify(defaultUsers));
    }
    if (!localStorage.getItem('wiki_versions')) {
        localStorage.setItem('wiki_versions', JSON.stringify([]));
    }
}

initDB();

const db = {
    getCategories: () => JSON.parse(localStorage.getItem('wiki_categories') || '[]'),
    getArticles: () => JSON.parse(localStorage.getItem('wiki_articles') || '[]'),
    getUsers: () => JSON.parse(localStorage.getItem('wiki_users') || '[]'),
    getVersions: () => JSON.parse(localStorage.getItem('wiki_versions') || '[]'),
    
    saveCategories: (data) => localStorage.setItem('wiki_categories', JSON.stringify(data)),
    saveArticles: (data) => localStorage.setItem('wiki_articles', JSON.stringify(data)),
    saveUsers: (data) => localStorage.setItem('wiki_users', JSON.stringify(data)),
    saveVersions: (data) => localStorage.setItem('wiki_versions', JSON.stringify(data)),
    
    getCurrentUser: () => JSON.parse(localStorage.getItem('wiki_current_user') || 'null'),
    setCurrentUser: (user) => localStorage.setItem('wiki_current_user', JSON.stringify(user)),
    logout: () => localStorage.removeItem('wiki_current_user')
};
