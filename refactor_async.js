const fs = require('fs');
let code = fs.readFileSync('Admin/wiki_admin.js', 'utf8');

code = code.replace(/function renderAdminArticles\(\)/g, 'async function renderAdminArticles()');
code = code.replace(/function renderAdminCategories\(\)/g, 'async function renderAdminCategories()');
code = code.replace(/function populateCategorySelect\(\)/g, 'async function populateCategorySelect()');
code = code.replace(/function openArticleEditor\(articleId = null\)/g, 'async function openArticleEditor(articleId = null)');
code = code.replace(/function saveArticle\(e\)/g, 'async function saveArticle(e)');
code = code.replace(/window\.deleteArticle = function\(id\)/g, 'window.deleteArticle = async function(id)');

code = code.replace(/const articles = db\.getArticles\(\);/g, 'const articles = await db.getArticles();');
code = code.replace(/const categories = db\.getCategories\(\);/g, 'const categories = await db.getCategories();');
code = code.replace(/let articles = db\.getArticles\(\);/g, 'let articles = await db.getArticles();');
code = code.replace(/db\.saveArticles\(/g, 'await db.saveArticles(');

code = code.replace(/populateCategorySelect\(\);/g, 'await populateCategorySelect();');

// getArticles call inside openArticleEditor
code = code.replace(/const article = db\.getArticles\(\)\.find\(a => a\.id === articleId\);/g, 'const allArticles = await db.getArticles();\n        const article = allArticles.find(a => a.id === articleId);');

fs.writeFileSync('Admin/wiki_admin.js', code);
console.log('wiki_admin.js updated for async');
