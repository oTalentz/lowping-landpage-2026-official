const fs = require('fs');
let code = fs.readFileSync('Wiki/wiki.js', 'utf8');

code = code.replace(/function renderSidebar\(\)/g, 'async function renderSidebar()');
code = code.replace(/function renderHome\(\)/g, 'async function renderHome()');
code = code.replace(/function renderArticle\(slug\)/g, 'async function renderArticle(slug)');
code = code.replace(/function renderCategory\(slug\)/g, 'async function renderCategory(slug)');
code = code.replace(/function renderSearch\(query\)/g, 'async function renderSearch(query)');

code = code.replace(/const categories = db\.getCategories\(\);/g, 'const categories = await db.getCategories();');
code = code.replace(/const articles = db\.getArticles\(\)/g, 'const allArticles = await db.getArticles();\n    const articles = allArticles');
code = code.replace(/const article = db\.getArticles\(\)/g, 'const allArticles = await db.getArticles();\n    const article = allArticles');
code = code.replace(/const cat = db\.getCategories\(\)/g, 'const allCategories = await db.getCategories();\n    const cat = allCategories');
code = code.replace(/const category = db\.getCategories\(\)/g, 'const allCategories = await db.getCategories();\n    const category = allCategories');

// Wait, the router function needs to be async too
code = code.replace(/function handleRoute\(\)/g, 'async function handleRoute()');
code = code.replace(/renderHome\(\);/g, 'await renderHome();');
code = code.replace(/renderArticle\(path\.replace/g, 'await renderArticle(path.replace');
code = code.replace(/renderCategory\(path\.replace/g, 'await renderCategory(path.replace');

fs.writeFileSync('Wiki/wiki.js', code);
console.log('wiki.js updated for async');
