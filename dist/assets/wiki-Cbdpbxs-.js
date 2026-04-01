import{t as e}from"./modulepreload-polyfill-D1H0ivOT.js";/* empty css              */var t=e((()=>{var e=`/api`,t=null,n=null,r=null,i=null;window.db={useMock:!1,async getCategories(){if(this.useMock)return JSON.parse(localStorage.getItem(`wiki_categories`)||`[]`);if(t)return t;if(r)return r;try{return r=fetch(`${e}/wiki/categories`).then(e=>{if(!e.ok)throw Error(`Falha ao carregar categorias`);return e.json()}).then(e=>(t=Array.isArray(e)?e:[],t)).finally(()=>{r=null}),await r}catch(e){return console.error(e),[]}},async getArticles(){if(this.useMock)return JSON.parse(localStorage.getItem(`wiki_articles`)||`[]`);if(n)return n;if(i)return i;try{return i=fetch(`${e}/wiki/articles`).then(e=>{if(!e.ok)throw Error(`Falha ao carregar artigos`);return e.json()}).then(e=>(n=Array.isArray(e)?e:[],n)).finally(()=>{i=null}),await i}catch(e){return console.error(e),[]}},async saveCategories(n){if(this.useMock)return localStorage.setItem(`wiki_categories`,JSON.stringify(n));for(let t of n){let n={id:t.id,name:t.name,slug:t.slug||t.id,description:t.description,icon:t.icon},r=await fetch(`${e}/wiki/categories`,{method:`POST`,headers:{"Content-Type":`application/json`,Authorization:localStorage.getItem(`admin_token`)||``},body:JSON.stringify(n)});if(!r.ok){let e=await r.json().catch(()=>({}));throw Error(e.error||`Erro ao salvar categoria`)}}t=null,r=null},async saveArticle(t){if(this.useMock){let e=JSON.parse(localStorage.getItem(`wiki_articles`)||`[]`),n=e.findIndex(e=>e.id===t.id);n===-1?e.push(t):e[n]=t,localStorage.setItem(`wiki_articles`,JSON.stringify(e));return}let r={id:t.id,category_id:t.categoryId||t.category_id,title:t.title,slug:t.slug,content:t.content,author:t.author||t.authorId||`Admin`,status:t.status,featured:t.featured||!1},a=await fetch(`${e}/wiki/articles`,{method:`POST`,headers:{"Content-Type":`application/json`,Authorization:localStorage.getItem(`admin_token`)||``},body:JSON.stringify(r)});if(!a.ok){let e=await a.json().catch(()=>({}));throw Error(e.error||`Erro ao salvar artigo`)}n=null,i=null},async saveArticles(t){if(this.useMock)return localStorage.setItem(`wiki_articles`,JSON.stringify(t));for(let n of t){let t={id:n.id,category_id:n.categoryId||n.category_id,title:n.title,slug:n.slug,content:n.content,author:n.author||n.authorId||`Admin`,status:n.status},r=await fetch(`${e}/wiki/articles`,{method:`POST`,headers:{"Content-Type":`application/json`,Authorization:localStorage.getItem(`admin_token`)||``},body:JSON.stringify(t)});if(!r.ok){let e=await r.json().catch(()=>({}));throw Error(e.error||`Erro ao salvar artigo`)}}n=null,i=null},async getVersions(){return JSON.parse(localStorage.getItem(`wiki_versions`)||`[]`)},async saveVersions(e){localStorage.setItem(`wiki_versions`,JSON.stringify(e))},async deleteArticle(t){if(this.useMock){let e=JSON.parse(localStorage.getItem(`wiki_articles`)||`[]`);e=e.filter(e=>e.id!==t),localStorage.setItem(`wiki_articles`,JSON.stringify(e));return}let r=await fetch(`${e}/wiki/articles?id=${t}`,{method:`DELETE`,headers:{Authorization:localStorage.getItem(`admin_token`)||``}});if(!r.ok){let e=await r.json().catch(()=>({}));throw Error(e.error||`Erro ao excluir artigo`)}n=null,i=null}}})),n=e((()=>{document.addEventListener(`DOMContentLoaded`,async()=>{let e=document.getElementById(`main-content`);e&&(e.innerHTML=`
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16 animate-pulse">
                <div class="bg-surface-container-low rounded-[2rem] h-52"></div>
                <div class="bg-surface-container-low rounded-[2rem] h-52"></div>
                <div class="bg-surface-container-low rounded-[2rem] h-52"></div>
                <div class="bg-surface-container-low rounded-[2rem] h-52"></div>
            </div>
            <div class="space-y-4 animate-pulse">
                <div class="bg-surface-container-lowest rounded-2xl h-24"></div>
                <div class="bg-surface-container-lowest rounded-2xl h-24"></div>
                <div class="bg-surface-container-lowest rounded-2xl h-24"></div>
            </div>
        `);let t=document.getElementById(`categories-sidebar`);t&&(t.innerHTML=`
            <div class="space-y-2 animate-pulse">
                <div class="bg-surface-container h-12 rounded-xl"></div>
                <div class="bg-surface-container h-12 rounded-xl"></div>
                <div class="bg-surface-container h-12 rounded-xl"></div>
                <div class="bg-surface-container h-12 rounded-xl"></div>
            </div>
        `);let s=n(),c=new URLSearchParams(window.location.search),l=c.get(`article`),u=c.get(`category`),d=c.get(`q`);l?await i(l):u?await a(u):d?await o(d):await r(),await s;let f=document.getElementById(`search-input`),p=document.getElementById(`search-btn`);p&&f&&(p.addEventListener(`click`,()=>{let e=f.value.trim();e&&(window.location.href=`?q=${encodeURIComponent(e)}`)}),f.addEventListener(`keypress`,e=>{e.key===`Enter`&&p.click()}))});function e(e){let t=new Date(e),n=Math.floor((new Date-t)/1e3),r=n/86400;return r>1?`Publicado há ${Math.floor(r)} dias`:(r=n/3600,r>1?`Publicado há ${Math.floor(r)} horas`:(r=n/60,r>1?`Publicado há ${Math.floor(r)} minutos`:`Publicado recentemente`))}function t(e){return e?e.replace(/[&<>'"]/g,e=>({"&":`&amp;`,"<":`&lt;`,">":`&gt;`,"'":`&#39;`,'"':`&quot;`})[e]):``}async function n(){let e=document.getElementById(`categories-sidebar`);if(!e)return;let t=await db.getCategories(),n=`
        <a class="flex items-center gap-3 p-4 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-all" href="index.html">
            <span class="material-symbols-outlined text-xl" data-icon="grid_view">grid_view</span>
            Visão Geral
        </a>
    `;t.forEach(e=>{e.slug===`geral`||e.name.toLowerCase()===`visão geral`||(n+=`
            <a class="flex items-center gap-3 p-4 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-all" href="?category=${e.slug}">
                <span class="material-symbols-outlined text-xl" data-icon="${e.icon}">${e.icon}</span>
                ${e.name}
            </a>
        `)}),e.innerHTML=n}async function r(){let t=document.getElementById(`main-content`);if(!t)return;let[n,r]=await Promise.all([db.getCategories(),db.getArticles()]),i=r.filter(e=>e.status===`published`),a=`
        <!-- Category Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
    `;n.slice(0,4).forEach((e,t)=>{let n=[`primary`,`secondary`,`tertiary`,`outline`],r=n[t%n.length];a+=`
            <div class="bg-surface-container-low p-8 rounded-[2rem] hover:bg-surface-container-high transition-all duration-300 group border border-outline-variant/5">
                <div class="w-14 h-14 rounded-2xl bg-${r}/10 flex items-center justify-center text-${r===`outline`?`on-surface`:r} mb-6 group-hover:scale-110 transition-transform">
                    <span class="material-symbols-outlined text-3xl" data-icon="${e.icon}">${e.icon}</span>
                </div>
                <h3 class="font-headline text-2xl font-bold text-on-surface mb-3">${e.name}</h3>
                <p class="text-on-surface-variant font-body mb-6">${e.description}</p>
                <a class="text-${r===`outline`?`on-surface`:r} font-label text-sm flex items-center gap-2 hover:gap-3 transition-all" href="?category=${e.slug}">Explorar categoria <span class="material-symbols-outlined text-sm">arrow_forward</span></a>
            </div>
        `}),a+=`
        </div>
        <!-- Featured Articles -->
        <div>
            <div class="flex items-center justify-between mb-8">
                <h2 class="font-headline text-3xl font-bold text-on-surface">Artigos em Destaque</h2>
            </div>
            <div class="space-y-4">
    `;let o=i.filter(e=>e.featured===!0||e.featured===`true`);o.length===0?a+=`<p class="text-on-surface-variant">Nenhum artigo em destaque no momento.</p>`:o.sort((e,t)=>new Date(t.created_at||t.createdAt)-new Date(e.created_at||e.createdAt)).slice(0,5).forEach(t=>{let r=n.find(e=>e.id===(t.category_id||t.categoryId)),i=r?r.icon:`article`;a+=`
                <article class="group bg-surface-container-lowest p-6 rounded-2xl border-b border-transparent hover:border-primary/20 hover:bg-surface-container-low transition-all">
                    <a class="flex items-center justify-between" href="?article=${t.slug}">
                        <div class="flex items-center gap-6">
                            <div class="w-12 h-12 flex items-center justify-center bg-surface-container-high rounded-xl text-on-surface-variant group-hover:text-primary transition-colors">
                                <span class="material-symbols-outlined" data-icon="${i}">${i}</span>
                            </div>
                            <div>
                                <h4 class="font-headline text-lg font-bold text-on-surface">${t.title}</h4>
                                <p class="text-sm text-on-surface-variant">${e(t.created_at||t.createdAt)} • Em ${r?r.name:`Geral`}</p>
                            </div>
                        </div>
                        <span class="material-symbols-outlined text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity">chevron_right</span>
                    </a>
                </article>
            `}),a+=`
            </div>
        </div>
    `,t.innerHTML=a}async function i(t){let n=document.getElementById(`main-content`),r=(await db.getArticles()).find(e=>e.slug===t&&e.status===`published`);if(!r){n.innerHTML=`<h2 class="text-3xl font-bold text-on-surface">Artigo não encontrado</h2>`;return}document.title=`${r.title} - Wiki`;let i=(await db.getCategories()).find(e=>e.id===(r.category_id||r.categoryId));n.innerHTML=`
        <div class="bg-surface-container-lowest p-8 rounded-[2rem] border border-outline-variant/5">
            <div class="mb-8 border-b border-white/10 pb-6">
                <div class="flex items-center gap-2 text-sm text-primary mb-4">
                    <a href="index.html" class="hover:underline">Início</a>
                    <span class="material-symbols-outlined text-[16px]">chevron_right</span>
                    <a href="?category=${i?i.slug:``}" class="hover:underline">${i?i.name:`Geral`}</a>
                </div>
                <h1 class="font-headline text-4xl md:text-5xl font-extrabold text-on-surface mb-4">${r.title}</h1>
                <p class="text-on-surface-variant text-sm">${e(r.created_at||r.createdAt)}</p>
            </div>
            <div class="prose prose-invert prose-p:text-on-surface-variant prose-headings:text-on-surface max-w-none font-body">
                ${r.content}
            </div>
        </div>
    `}async function a(t){let n=document.getElementById(`main-content`),r=(await db.getCategories()).find(e=>e.slug===t);if(!r){n.innerHTML=`<h2 class="text-3xl font-bold text-on-surface">Categoria não encontrada</h2>`;return}document.title=`${r.name} - Wiki`;let i=(await db.getArticles()).filter(e=>(e.category_id===r.id||e.categoryId===r.id)&&e.status===`published`),a=`
        <div class="mb-12">
            <div class="flex items-center gap-4 mb-4">
                <div class="w-16 h-16 rounded-2xl bg-surface-container-high flex items-center justify-center text-primary">
                    <span class="material-symbols-outlined text-4xl" data-icon="${r.icon}">${r.icon}</span>
                </div>
                <div>
                    <h1 class="font-headline text-4xl md:text-5xl font-extrabold text-on-surface">${r.name}</h1>
                    <p class="text-on-surface-variant text-lg mt-2">${r.description}</p>
                </div>
            </div>
        </div>
        <div class="space-y-4">
    `;i.length===0?a+=`<p class="text-on-surface-variant">Nenhum artigo encontrado nesta categoria.</p>`:i.sort((e,t)=>new Date(t.created_at||t.createdAt)-new Date(e.created_at||e.createdAt)).forEach(t=>{a+=`
                <article class="group bg-surface-container-lowest p-6 rounded-2xl border-b border-transparent hover:border-primary/20 hover:bg-surface-container-low transition-all">
                    <a class="flex items-center justify-between" href="?article=${t.slug}">
                        <div class="flex items-center gap-6">
                            <div class="w-12 h-12 flex items-center justify-center bg-surface-container-high rounded-xl text-on-surface-variant group-hover:text-primary transition-colors">
                                <span class="material-symbols-outlined" data-icon="article">article</span>
                            </div>
                            <div>
                                <h4 class="font-headline text-lg font-bold text-on-surface">${t.title}</h4>
                                <p class="text-sm text-on-surface-variant">${e(t.created_at||t.createdAt)}</p>
                            </div>
                        </div>
                        <span class="material-symbols-outlined text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity">chevron_right</span>
                    </a>
                </article>
            `}),a+=`</div>`,n.innerHTML=a}async function o(e){let n=document.getElementById(`main-content`),r=(await db.getArticles()).filter(t=>t.status===`published`&&(t.title.toLowerCase().includes(e.toLowerCase())||t.content.toLowerCase().includes(e.toLowerCase())));document.title=`Busca: ${e} - Wiki`;let i=`
        <div class="mb-8">
            <h1 class="font-headline text-4xl font-extrabold text-on-surface mb-2">Resultados para "${t(e)}"</h1>
            <p class="text-on-surface-variant">${r.length} artigo(s) encontrado(s).</p>
        </div>
        <div class="space-y-4">
    `;if(r.length===0)i+=`<p class="text-on-surface-variant">Tente buscar com outros termos.</p>`;else{let e=await db.getCategories();r.forEach(t=>{let n=e.find(e=>e.id===(t.category_id||t.categoryId)),r=n?n.icon:`article`;i+=`
                <article class="group bg-surface-container-lowest p-6 rounded-2xl border-b border-transparent hover:border-primary/20 hover:bg-surface-container-low transition-all">
                    <a class="flex items-center justify-between" href="?article=${t.slug}">
                        <div class="flex items-center gap-6">
                            <div class="w-12 h-12 flex items-center justify-center bg-surface-container-high rounded-xl text-on-surface-variant group-hover:text-primary transition-colors">
                                <span class="material-symbols-outlined">${r}</span>
                            </div>
                            <div>
                                <h4 class="font-headline text-lg font-bold text-on-surface">${t.title}</h4>
                                <p class="text-sm text-on-surface-variant">Em ${n?n.name:`Geral`}</p>
                            </div>
                        </div>
                        <span class="material-symbols-outlined text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity">chevron_right</span>
                    </a>
                </article>
            `})}i+=`</div>`,n.innerHTML=i}}));t(),n();