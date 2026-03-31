# Wiki Lowping - Documentação Técnica e Manual do Administrador

## Visão Geral
A Wiki Lowping foi desenvolvida como uma Single Page Application (SPA) modular, utilizando `localStorage` como banco de dados mockado para simular o comportamento de um backend real. Ela possui um painel administrativo completo com controle de permissões e um editor de texto rico.

## Estrutura de Arquivos
- `code.html`: A página principal da Wiki, visível para o público.
- `wiki.js`: Controla a lógica de renderização dinmica da página pública (categorias, busca, artigos).
- `admin.html`: Interface do Painel Administrativo.
- `admin.js`: Lógica do painel (autenticação, CRUD de artigos, integração com Quill.js).
- `mock_db.js`: Simula o banco de dados (Tabelas: Users, Categories, Articles, Versions) usando `localStorage`.
- `tests.html`: Suite de testes para validar funcionalidades core (banco de dados, permissões, versionamento, busca).

## Funcionalidades Implementadas
1. **Navegação Intuitiva e Busca:** A Wiki pública suporta navegação por categorias e busca de texto completo em títulos e conteúdos.
2. **Sistema de Gerenciamento de Conteúdo (CMS):** O `admin.html` permite criar, editar e excluir artigos.
3. **Editor de Texto Rico:** Integração com **Quill.js** para formatação avançada de conteúdo.
4. **Versionamento:** Toda vez que um artigo é editado, a versão anterior é salva no banco `wiki_versions`.
5. **Controle de Permissões:**
   - **Admin (`admin/123`):** Pode criar, editar e excluir artigos.
   - **Editor (`editor/123`):** Pode criar e editar, mas **não pode excluir**.
   - **Viewer (`viewer/123`):** Apenas leitura no painel.
6. **Otimização SEO:** URLs baseadas em *slugs* (`?article=slug`) e atualização dinmica da tag `<title>`.
7. **Design Responsivo:** Construído com Tailwind CSS seguindo os padrões do `DESIGN.md` (The Midnight Kinetic).

---

## Manual do Administrador

### Como acessar o painel
1. Abra o arquivo `admin.html` no navegador.
2. Faça login usando uma das contas padrão:
   - **Admin:** Usuário: `admin` | Senha: `123`
   - **Editor:** Usuário: `editor` | Senha: `123`

### Como criar um artigo
1. No menu lateral, clique em **Artigos**.
2. Clique no botão azul **+ Novo Artigo** no topo direito.
3. Preencha o Título (o Slug será gerado automaticamente).
4. Selecione a Categoria.
5. Escolha o Status (Publicado ou Rascunho). Artigos em Rascunho não aparecem na Wiki pública.
6. Escreva o conteúdo utilizando o editor (você pode adicionar imagens, links e formatação).
7. Clique em **Salvar Artigo**.

### Como editar e versionar
1. Na lista de artigos, clique no ícone de lápis (Editar) ao lado do artigo desejado.
2. Faça as alterações e clique em **Salvar Artigo**.
3. O sistema salvará automaticamente a versão antiga no histórico interno.

### Testes
Para rodar os testes de funcionalidade e segurança:
1. Abra o arquivo `tests.html` no navegador.
2. Os resultados aparecerão na tela indicando se o Banco de Dados, Permissões, Criação/Versionamento e Lógica de Busca estão funcionando corretamente.
