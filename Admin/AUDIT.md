# Auditoria de Fluxo de Dados e Segurança (Admin Panel)

## 1. Visão Geral da Arquitetura
A interface do painel de administração foi reestruturada para operar como uma Single Page Application (SPA), onde o frontend se comunica com o backend estritamente via requisições HTTP RESTful (atualmente emuladas por um interceptador de `fetch` no `mock_api.js` para garantir o funcionamento independente do ambiente). 

## 2. Auditoria do Sistema de Autenticação
- **Login e Validação**: O frontend valida o preenchimento de campos e envia as credenciais via `POST /api/login`.
- **Segurança da Senha**: O frontend envia a senha em texto plano (simulado no payload HTTP via HTTPS). No backend mockado, a senha é hasheada através de uma função de hash local e comparada com o hash salvo no banco de dados (`localStorage`).
- **Gestão de Sessão (JWT)**: Após o sucesso do login, o backend retorna um token, armazenado pelo frontend de forma segura e anexado via cabeçalho `Authorization: Bearer <token>` em todas as requisições subsequentes.
- **Proteção contra Força Bruta**: Implementada limitação de taxa (Rate Limiting). Se o usuário errar a senha 3 vezes, ele sofrerá um "lockout" de 1 minuto, durante o qual todas as requisições de login retornarão o código HTTP 429 (Too Many Requests).
- **Tratamento de Erros e Logout**: Se um token for inválido, o backend responde com HTTP 401, o frontend captura e redireciona automaticamente o usuário para a tela de login limpando a sessão.

## 3. Fluxo de Dados: Cupons
- **GET /api/coupons**: Retorna um array com todos os cupons. O Frontend mapeia cada objeto iterando e renderizando na tabela.
- **POST /api/coupons**: Payload enviado com validação estrita no frontend (`min="1"`, `max="100"` para desconto, campos obrigatórios preenchidos).
- **PUT /api/coupons/:id**: Atualiza estados e metadados. Utilizado para editar o cupom inteiro ou fazer o toggle rápido de "Ativar/Desativar" (enviando apenas `{ active: boolean }`).
- **DELETE /api/coupons/:id**: Destruição de recurso protegida pelo componente de confirmação na UI para prevenir exclusão acidental. Retorna 200 OK.

## 4. Fluxo de Dados: Banners
- **GET /api/banners**: Retorna banners armazenados no banco. O backend os envia já ordenados pelo campo numérico de prioridade (`order`).
- **POST /api/banners**: Criação validada com URLs de imagens.
- **PUT /api/banners/:id** & **DELETE /api/banners/:id**: Operações idênticas ao módulo de cupons, com proteção de integridade.
- **Regra de Negócio de Períodos**: O frontend exige inputs nativos do tipo `date`, e o backend armazena e retorna no formato ISO. O frontend os formata utilizando `toLocaleDateString` de forma legível para o usuário final.

## 5. Documentação das Correções Realizadas
- **Remoção de Código Obsoleto**: Toda a UI não-funcional de "Servidores", "Usuários", "Configurações" foi permanentemente removida da árvore do DOM, diminuindo a carga cognitiva e fechando brechas de segurança por views não implementadas.
- **Sincronização Painel Admin ↔ Frontend**: Foi implementado um script de sincronização nas páginas públicas (ex: planos de hospedagem Minecraft e VPS) para que leiam os dados validados do `localStorage` e reflitam imediatamente banners promocionais e cupons ativos sem necessidade de recarregar o servidor.
- **Responsividade do Painel e Correções nas Páginas Públicas**: Implementada barra de navegação inferior mobile (Bottom Nav) no Admin e corrigidos menus mobile, layout com sidebars e aspas incorretas nas páginas legais (Termos de Serviço e Política de Privacidade).
- **Estado Global e UI Loading**: Implementados `Toasts` globais (`#toast-container`) para dar feedback instantâneo (Sucesso ou Erro) sobre o status HTTP de todas as operações CRUD realizadas no backend.
- **Modificações de Estilo**: Limpeza nos arquivos do painel, garantindo fidelidade à biblioteca de cores "Midnight Kinetic" (`#adc6ff`, `#ffb2bb`, `#1d1f27`) mantendo o glassmorphism intacto através das classes nativas e utilitárias do TailwindCSS.
