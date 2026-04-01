const fs = require('fs');

function getHtmlFiles(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = dir + '/' + file;
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            if(!file.includes('node_modules')) {
                results = results.concat(getHtmlFiles(file));
            }
        } else { 
            if (file.endsWith('.html')) results.push(file);
        }
    });
    return results;
}

const files = getHtmlFiles('.');

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    // Replace script tailwind cdn
    content = content.replace(/<script src="https:\/\/cdn\.tailwindcss\.com\?plugins=[^>]+><\/script>/g, '<link rel="stylesheet" href="/style.css" />');
    content = content.replace(/<script src="https:\/\/cdn\.tailwindcss\.com[^>]*><\/script>/g, '<link rel="stylesheet" href="/style.css" />');
    
    // Replace script config
    const configRegex = /<script id="tailwind-config">[\s\S]*?<\/script>/g;
    content = content.replace(configRegex, '');

    fs.writeFileSync(file, content);
});

console.log('Migrated HTML files to use local style.css');
