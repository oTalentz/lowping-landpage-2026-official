const fs = require('fs');

const script = `
    <script>
        // Menu Mobile Toggle
        const mobileMenuBtn = document.getElementById('mobile-menu-btn');
        const mobileMenu = document.getElementById('mobile-menu');
        if (mobileMenuBtn && mobileMenu) {
            mobileMenuBtn.addEventListener('click', () => {
                const isExpanded = mobileMenuBtn.getAttribute('aria-expanded') === 'true';
                mobileMenuBtn.setAttribute('aria-expanded', !isExpanded);
                mobileMenu.classList.toggle('hidden');
                mobileMenu.classList.toggle('flex');
                const icon = mobileMenuBtn.querySelector('.material-symbols-outlined');
                if(icon) icon.textContent = isExpanded ? 'menu' : 'close';
            });
        }
    </script>
`;

['Wiki/index.html', 'Parceiros/index.html', 'Cupom/index.html', 'Admin/code.html'].forEach(f => {
    if (fs.existsSync(f)) {
        let c = fs.readFileSync(f, 'utf8');
        if (c.includes('mobile-menu-btn') && !c.includes('mobileMenuBtn.addEventListener')) {
            c = c.replace('</body>', script + '\n</body>');
            fs.writeFileSync(f, c);
            console.log('Fixed ' + f);
        }
    }
});