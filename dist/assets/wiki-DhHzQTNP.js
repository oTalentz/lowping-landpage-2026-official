import{t as e}from"./modulepreload-polyfill-BRIdl15F.js";/* empty css              */var t=e((()=>{var e=`/api`,t=null,n=null,r=null,i=null;function a(e){try{let t=localStorage.getItem(e);if(!t)return[];let n=JSON.parse(t);return Array.isArray(n)?n:[]}catch{return[]}}function o(){let e=localStorage.getItem(`admin_token`);return e?`Bearer ${e.replace(/^Bearer\s+/i,``)}`:``}window.db={useMock:!1,async getCategories(){if(this.useMock)return a(`wiki_categories`);if(t)return t;if(r)return r;try{return r=fetch(`${e}/wiki/categories`).then(e=>{if(!e.ok)throw Error(`Falha ao carregar categorias`);return e.json()}).then(e=>(t=Array.isArray(e)?e:[],t)).finally(()=>{r=null}),await r}catch(e){return console.error(e),[]}},async getArticles(){if(this.useMock)return a(`wiki_articles`);if(n)return n;if(i)return i;try{return i=fetch(`${e}/wiki/articles`).then(e=>{if(!e.ok)throw Error(`Falha ao carregar artigos`);return e.json()}).then(e=>(n=Array.isArray(e)?e:[],n)).finally(()=>{i=null}),await i}catch(e){return console.error(e),[]}},async saveCategories(n){if(this.useMock)return localStorage.setItem(`wiki_categories`,JSON.stringify(n));for(let t of n){let n={id:t.id,name:t.name,slug:t.slug||t.id,description:t.description,icon:t.icon},r=await fetch(`${e}/wiki/categories`,{method:`POST`,headers:{"Content-Type":`application/json`,Authorization:o()},body:JSON.stringify(n)});if(!r.ok){let e=await r.json().catch(()=>({}));throw Error(e.error||`Erro ao salvar categoria`)}}t=null,r=null},async saveArticle(t){if(this.useMock){let e=a(`wiki_articles`),n=e.findIndex(e=>e.id===t.id);n===-1?e.push(t):e[n]=t,localStorage.setItem(`wiki_articles`,JSON.stringify(e));return}let r={id:t.id,category_id:t.categoryId||t.category_id,title:t.title,slug:t.slug,content:t.content,author:t.author||t.authorId||`Admin`,status:t.status,featured:t.featured||!1},s=await fetch(`${e}/wiki/articles`,{method:`POST`,headers:{"Content-Type":`application/json`,Authorization:o()},body:JSON.stringify(r)});if(!s.ok){let e=await s.json().catch(()=>({}));throw Error(e.error||`Erro ao salvar artigo`)}n=null,i=null},async saveArticles(t){if(this.useMock)return localStorage.setItem(`wiki_articles`,JSON.stringify(t));for(let n of t){let t={id:n.id,category_id:n.categoryId||n.category_id,title:n.title,slug:n.slug,content:n.content,author:n.author||n.authorId||`Admin`,status:n.status},r=await fetch(`${e}/wiki/articles`,{method:`POST`,headers:{"Content-Type":`application/json`,Authorization:o()},body:JSON.stringify(t)});if(!r.ok){let e=await r.json().catch(()=>({}));throw Error(e.error||`Erro ao salvar artigo`)}}n=null,i=null},async getVersions(){return a(`wiki_versions`)},async saveVersions(e){localStorage.setItem(`wiki_versions`,JSON.stringify(e))},async deleteArticle(t){if(this.useMock){let e=a(`wiki_articles`);e=e.filter(e=>e.id!==t),localStorage.setItem(`wiki_articles`,JSON.stringify(e));return}let r=await fetch(`${e}/wiki/articles?id=${t}`,{method:`DELETE`,headers:{Authorization:o()}});if(!r.ok){let e=await r.json().catch(()=>({}));throw Error(e.error||`Erro ao excluir artigo`)}n=null,i=null}}})),n=e((()=>{document.addEventListener(`DOMContentLoaded`,async()=>{let e=document.getElementById(`main-content`);e&&(e.innerHTML=`
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
        `);let n=l(),r=new URLSearchParams(window.location.search),i=r.get(`article`),a=r.get(`category`),o=r.get(`q`);i?await d(i):a?await f(a):o?await p(o):await u(),await n;let s=document.getElementById(`search-input`),c=document.getElementById(`search-btn`);c&&s&&(c.addEventListener(`click`,()=>{let e=s.value.trim();e&&(window.location.href=`?q=${encodeURIComponent(e)}`)}),s.addEventListener(`keypress`,e=>{e.key===`Enter`&&c.click()}))});function e(e){let t=new Date(e),n=Math.floor((new Date-t)/1e3),r=n/86400;return r>1?`Publicado há ${Math.floor(r)} dias`:(r=n/3600,r>1?`Publicado há ${Math.floor(r)} horas`:(r=n/60,r>1?`Publicado há ${Math.floor(r)} minutos`:`Publicado recentemente`))}function t(e){return e?e.replace(/[&<>'"]/g,e=>({"&":`&amp;`,"<":`&lt;`,">":`&gt;`,"'":`&#39;`,'"':`&quot;`})[e]):``}function n(e){return Array.isArray(e)?e:[]}function r(e){return typeof e==`string`?e:``}function i(e){let t=r(e).trim();if(!t)return``;if(t.startsWith(`/`)||t.startsWith(`#`)||t.startsWith(`?`))return t;try{let e=new URL(t,window.location.origin);return e.protocol===`http:`||e.protocol===`https:`?e.href:``}catch{return``}}function a(e){let n=t(r(e));return n=n.replace(/`([^`]+)`/g,`<code>$1</code>`),n=n.replace(/\*\*([^*]+)\*\*/g,`<strong>$1</strong>`),n=n.replace(/\*([^*\n]+)\*/g,`<em>$1</em>`),n=n.replace(/\[([^\]]+)\]\(([^)]+)\)/g,(e,n,r)=>{let a=i(r);return a?`<a href="${a}" target="_blank" rel="noopener noreferrer">${t(n)}</a>`:t(n)}),n}function o(e){let n=r(e).split(`
`),o=[],s=null,c=()=>{s&&=(o.push(`</${s}>`),null)};return n.forEach(e=>{let n=r(e).trim();if(!n){c();return}let l=n.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);if(l){c();let e=t(l[1]),n=i(l[2]);n&&o.push(`<p><img src="${n}" alt="${e}" loading="lazy" decoding="async"></p>`);return}let u=n.match(/^(#{1,6})\s+(.+)$/);if(u){c();let e=u[1].length;o.push(`<h${e}>${a(u[2])}</h${e}>`);return}let d=n.match(/^\d+\.\s+(.+)$/);if(d){s!==`ol`&&(c(),s=`ol`,o.push(`<ol>`)),o.push(`<li>${a(d[1])}</li>`);return}let f=n.match(/^[-*]\s+(.+)$/);if(f){s!==`ul`&&(c(),s=`ul`,o.push(`<ul>`)),o.push(`<li>${a(f[1])}</li>`);return}if(n.startsWith(`>`)){c(),o.push(`<blockquote>${a(n.replace(/^>\s?/,``))}</blockquote>`);return}c(),o.push(`<p>${a(n)}</p>`)}),c(),o.join(``)}function s(e){let t=document.createElement(`template`);return t.innerHTML=r(e),[`script`,`style`,`iframe`,`object`,`embed`,`form`,`input`,`button`,`textarea`,`select`,`meta`,`link`].forEach(e=>{t.content.querySelectorAll(e).forEach(e=>e.remove())}),t.content.querySelectorAll(`*`).forEach(e=>{[...e.attributes].forEach(t=>{let n=t.name.toLowerCase(),r=t.value;if(n.startsWith(`on`)||n===`style`){e.removeAttribute(t.name);return}if(n===`href`||n===`src`){let n=i(r);n?e.setAttribute(t.name,n):e.removeAttribute(t.name)}})}),t.innerHTML}function c(e){let t=r(e).trim();return t?s(/<\/?[a-z][\s\S]*>/i.test(t)?t:o(t)):`<p></p>`}async function l(){let e=document.getElementById(`categories-sidebar`);if(!e)return;let i=n(await db.getCategories()),a=`
        <a class="flex items-center gap-3 p-4 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-all" href="index.html">
            <span class="material-symbols-outlined text-xl" data-icon="grid_view">grid_view</span>
            Visão Geral
        </a>
    `;i.forEach(e=>{let n=r(e.slug),i=r(e.name),o=r(e.icon)||`article`;n===`geral`||i.toLowerCase()===`visão geral`||(a+=`
            <a class="flex items-center gap-3 p-4 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-all" href="?category=${encodeURIComponent(n)}">
                <span class="material-symbols-outlined text-xl" data-icon="${t(o)}">${t(o)}</span>
                ${t(i)}
            </a>
        `)}),e.innerHTML=a}async function u(){let i=document.getElementById(`main-content`);if(!i)return;let[a,o]=await Promise.all([db.getCategories(),db.getArticles()]),s=n(a),c=n(o).filter(e=>e&&e.status===`published`),l=`
        <!-- Category Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
    `;s.slice(0,5).forEach((e,n)=>{let i=[`primary`,`secondary`,`tertiary`,`outline`],a=i[n%i.length];l+=`
            <div class="bg-surface-container-low p-8 rounded-[2rem] hover:bg-surface-container-high transition-all duration-300 group border border-outline-variant/5">
                <div class="w-14 h-14 rounded-2xl bg-${a}/10 flex items-center justify-center text-${a===`outline`?`on-surface`:a} mb-6 group-hover:scale-110 transition-transform">
                    <span class="material-symbols-outlined text-3xl" data-icon="${t(r(e.icon))}">${t(r(e.icon))}</span>
                </div>
                <h3 class="font-headline text-2xl font-bold text-on-surface mb-3">${t(r(e.name))}</h3>
                <p class="text-on-surface-variant font-body mb-6">${t(r(e.description))}</p>
                <a class="text-${a===`outline`?`on-surface`:a} font-label text-sm flex items-center gap-2 hover:gap-3 transition-all" href="?category=${encodeURIComponent(r(e.slug))}">Explorar categoria <span class="material-symbols-outlined text-sm">arrow_forward</span></a>
            </div>
        `}),l+=`
        </div>
        <!-- Featured Articles -->
        <div>
            <div class="flex items-center justify-between mb-8">
                <h2 class="font-headline text-3xl font-bold text-on-surface">Artigos em Destaque</h2>
            </div>
            <div class="space-y-4">
    `;let u=c.filter(e=>e.featured===!0||e.featured===`true`);u.length===0?l+=`<p class="text-on-surface-variant">Nenhum artigo em destaque no momento.</p>`:u.sort((e,t)=>new Date(t.created_at||t.createdAt)-new Date(e.created_at||e.createdAt)).slice(0,5).forEach(n=>{let i=s.find(e=>e.id===(n.category_id||n.categoryId)),a=i?r(i.icon):`article`;l+=`
                <article class="group bg-surface-container-lowest p-6 rounded-2xl border-b border-transparent hover:border-primary/20 hover:bg-surface-container-low transition-all">
                    <a class="flex items-center justify-between" href="?article=${encodeURIComponent(r(n.slug))}">
                        <div class="flex items-center gap-6">
                            <div class="w-12 h-12 flex items-center justify-center bg-surface-container-high rounded-xl text-on-surface-variant group-hover:text-primary transition-colors">
                                <span class="material-symbols-outlined" data-icon="${t(a)}">${t(a)}</span>
                            </div>
                            <div>
                                <h4 class="font-headline text-lg font-bold text-on-surface">${t(r(n.title))}</h4>
                                <p class="text-sm text-on-surface-variant">${e(n.created_at||n.createdAt)} • Em ${i?t(r(i.name)):`Geral`}</p>
                            </div>
                        </div>
                        <span class="material-symbols-outlined text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity">chevron_right</span>
                    </a>
                </article>
            `}),l+=`
            </div>
        </div>
    `,i.innerHTML=l}async function d(i){let a=document.getElementById(`main-content`),o=n(await db.getArticles()).find(e=>e&&e.slug===i&&e.status===`published`);if(!o){a.innerHTML=`<h2 class="text-3xl font-bold text-on-surface">Artigo não encontrado</h2>`;return}document.title=`${o.title} - Wiki`;let s=n(await db.getCategories()).find(e=>e.id===(o.category_id||o.categoryId)),l=c(o.content);a.innerHTML=`
        <div class="bg-surface-container-lowest p-8 rounded-[2rem] border border-outline-variant/5">
            <div class="mb-8 border-b border-white/10 pb-6">
                <div class="flex items-center gap-2 text-sm text-primary mb-4">
                    <a href="index.html" class="hover:underline">Início</a>
                    <span class="material-symbols-outlined text-[16px]">chevron_right</span>
                    <a href="?category=${s?encodeURIComponent(r(s.slug)):``}" class="hover:underline">${s?t(r(s.name)):`Geral`}</a>
                </div>
                <h1 class="font-headline text-4xl md:text-5xl font-extrabold text-on-surface mb-4">${t(r(o.title))}</h1>
                <p class="text-on-surface-variant text-sm">${e(o.created_at||o.createdAt)}</p>
            </div>
            <div class="prose prose-invert prose-p:text-on-surface-variant prose-headings:text-on-surface max-w-none font-body">
                ${l}
            </div>
        </div>
    `}async function f(i){let a=document.getElementById(`main-content`),o=n(await db.getCategories()).find(e=>e.slug===i);if(!o){a.innerHTML=`<h2 class="text-3xl font-bold text-on-surface">Categoria não encontrada</h2>`;return}document.title=`${o.name} - Wiki`;let s=n(await db.getArticles()).filter(e=>e&&(e.category_id===o.id||e.categoryId===o.id)&&e.status===`published`),c=`
        <div class="mb-12">
            <div class="flex items-center gap-4 mb-4">
                <div class="w-16 h-16 rounded-2xl bg-surface-container-high flex items-center justify-center text-primary">
                    <span class="material-symbols-outlined text-4xl" data-icon="${t(r(o.icon))}">${t(r(o.icon))}</span>
                </div>
                <div>
                    <h1 class="font-headline text-4xl md:text-5xl font-extrabold text-on-surface">${t(r(o.name))}</h1>
                    <p class="text-on-surface-variant text-lg mt-2">${t(r(o.description))}</p>
                </div>
            </div>
        </div>
        <div class="space-y-4">
    `;s.length===0?c+=`<p class="text-on-surface-variant">Nenhum artigo encontrado nesta categoria.</p>`:s.sort((e,t)=>new Date(t.created_at||t.createdAt)-new Date(e.created_at||e.createdAt)).forEach(n=>{c+=`
                <article class="group bg-surface-container-lowest p-6 rounded-2xl border-b border-transparent hover:border-primary/20 hover:bg-surface-container-low transition-all">
                    <a class="flex items-center justify-between" href="?article=${encodeURIComponent(r(n.slug))}">
                        <div class="flex items-center gap-6">
                            <div class="w-12 h-12 flex items-center justify-center bg-surface-container-high rounded-xl text-on-surface-variant group-hover:text-primary transition-colors">
                                <span class="material-symbols-outlined" data-icon="article">article</span>
                            </div>
                            <div>
                                <h4 class="font-headline text-lg font-bold text-on-surface">${t(r(n.title))}</h4>
                                <p class="text-sm text-on-surface-variant">${e(n.created_at||n.createdAt)}</p>
                            </div>
                        </div>
                        <span class="material-symbols-outlined text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity">chevron_right</span>
                    </a>
                </article>
            `}),c+=`</div>`,a.innerHTML=c}async function p(e){let i=document.getElementById(`main-content`),a=n(await db.getArticles()),o=r(e).toLowerCase(),s=a.filter(e=>e&&e.status===`published`&&(r(e.title).toLowerCase().includes(o)||r(e.content).toLowerCase().includes(o)));document.title=`Busca: ${e} - Wiki`;let c=`
        <div class="mb-8">
            <h1 class="font-headline text-4xl font-extrabold text-on-surface mb-2">Resultados para "${t(e)}"</h1>
            <p class="text-on-surface-variant">${s.length} artigo(s) encontrado(s).</p>
        </div>
        <div class="space-y-4">
    `;if(s.length===0)c+=`<p class="text-on-surface-variant">Tente buscar com outros termos.</p>`;else{let e=n(await db.getCategories());s.forEach(n=>{let i=e.find(e=>e.id===(n.category_id||n.categoryId)),a=i?r(i.icon):`article`;c+=`
                <article class="group bg-surface-container-lowest p-6 rounded-2xl border-b border-transparent hover:border-primary/20 hover:bg-surface-container-low transition-all">
                    <a class="flex items-center justify-between" href="?article=${encodeURIComponent(r(n.slug))}">
                        <div class="flex items-center gap-6">
                            <div class="w-12 h-12 flex items-center justify-center bg-surface-container-high rounded-xl text-on-surface-variant group-hover:text-primary transition-colors">
                                <span class="material-symbols-outlined">${t(a)}</span>
                            </div>
                            <div>
                                <h4 class="font-headline text-lg font-bold text-on-surface">${t(r(n.title))}</h4>
                                <p class="text-sm text-on-surface-variant">Em ${i?t(r(i.name)):`Geral`}</p>
                            </div>
                        </div>
                        <span class="material-symbols-outlined text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity">chevron_right</span>
                    </a>
                </article>
            `})}c+=`</div>`,i.innerHTML=c}}));t(),n();