const { defineConfig } = require('vite');

module.exports = defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        admin: 'admin/index.html',
        vps: 'Vps/index.html',
        wiki: 'Wiki/index.html',
        admin_code: 'Admin/code.html',
        parceiros: 'Parceiros/index.html',
        termos: 'Termos/index.html',
        privacidade: 'Privacidade/index.html',
        cupom: 'Cupom/index.html',
        contato: 'Contato/index.html',
        jogos: 'Jogos/index.html'
      }
    }
  },
  server: {
    port: 3000,
    open: true
  }
});
