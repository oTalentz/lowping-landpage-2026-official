// Global State
let currentToken = localStorage.getItem('admin_token');

function returnToHome() {
    // Reset global state tied to dashboard (not token, just view state if needed, or redirect)
    window.location.href = '../index.html';
}

// Utility Functions
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = type === 'success' ? 'check_circle' : 'error';
    const colorClass = type === 'success' ? 'text-tertiary' : 'text-error';
    
    toast.innerHTML = `
        <span class="material-symbols-outlined ${colorClass}">${icon}</span>
        <span class="text-sm font-medium toast-message"></span>
    `;
    toast.querySelector('.toast-message').textContent = message;
    
    container.appendChild(toast);
    
    // Animate in
    setTimeout(() => toast.classList.add('show'), 10);
    
    // Animate out
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
window.showToast = showToast;

function switchView(viewId) {
    document.getElementById('login-view').classList.add('hidden-view');
    document.getElementById('dashboard-view').classList.add('hidden-view');
    document.getElementById(viewId).classList.remove('hidden-view');
}
window.switchView = switchView;

function showSection(section) {
    // Hide all
    const sectionBanners = document.getElementById('section-banners');
    if (sectionBanners) sectionBanners.classList.add('hidden-view');
    const sectionWiki = document.getElementById('section-wiki');
    if (sectionWiki) sectionWiki.classList.add('hidden-view');
    
    // Show active
    const activeSection = document.getElementById(`section-${section}`);
    if (activeSection) activeSection.classList.remove('hidden-view');
    
    // Update nav styles
    document.querySelectorAll('.nav-item').forEach(el => {
        el.classList.remove('text-[#ffb2bb]', 'bg-white/5', 'border-r-2', 'border-[#ffb2bb]');
        el.classList.add('text-[#c2c6d6]', 'opacity-70');
        el.querySelector('span').style.fontVariationSettings = "'FILL' 0";
    });
    
    const activeNav = document.getElementById(`nav-${section}`);
    if (activeNav) {
        activeNav.classList.remove('text-[#c2c6d6]', 'opacity-70');
        activeNav.classList.add('text-[#ffb2bb]', 'bg-white/5', 'border-r-2', 'border-[#ffb2bb]');
        activeNav.querySelector('span').style.fontVariationSettings = "'FILL' 1";
    }

    // Update mobile nav styles
    document.querySelectorAll('.mob-nav-item').forEach(el => {
        el.classList.remove('text-[#ffb2bb]');
        el.classList.add('text-[#c2c6d6]', 'opacity-70');
        el.querySelector('span').style.fontVariationSettings = "'FILL' 0";
    });

    const activeMobNav = document.getElementById(`mob-nav-${section}`);
    if (activeMobNav) {
        activeMobNav.classList.remove('text-[#c2c6d6]', 'opacity-70');
        activeMobNav.classList.add('text-[#ffb2bb]');
        activeMobNav.querySelector('span').style.fontVariationSettings = "'FILL' 1";
    }
}
window.showSection = showSection;

function openModal(modalId) {
    document.getElementById(modalId).classList.remove('hidden-view');
}
window.openModal = openModal;

function closeModal(modalId) {
    document.getElementById(modalId).classList.add('hidden-view');
}
window.closeModal = closeModal;

function confirmAction(message, onConfirm) {
    if(confirm(message)) {
        onConfirm();
    }
}
window.confirmAction = confirmAction;

// Date Helpers
function parseDateToSave(dateStr) {
    if (!dateStr) return '';
    const parts = dateStr.split('/');
    if (parts.length === 3) {
        let year = parseInt(parts[2], 10);
        year = year < 100 ? 2000 + year : year;
        return `${year}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
    return dateStr;
}

function formatDateToShow(dateStr) {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
        let year = parts[0].slice(-2);
        return `${parts[2].slice(0, 2)}/${parts[1]}/${year}`; // handle potential time string
    }
    if (dateStr.includes('T')) {
        const d = new Date(dateStr);
        if (!isNaN(d)) {
            return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth()+1).padStart(2, '0')}/${String(d.getFullYear()).slice(-2)}`;
        }
    }
    return dateStr;
}

function maskDate(e) {
    let v = e.target.value.replace(/\D/g, '');
    if (v.length > 2) v = v.slice(0, 2) + '/' + v.slice(2);
    if (v.length > 5) v = v.slice(0, 5) + '/' + v.slice(5, 7);
    e.target.value = v;
}

// API Helpers
async function apiCall(url, options = {}) {
    const headers = {
        'Content-Type': 'application/json',
        ...(currentToken ? { 'Authorization': currentToken } : {})
    };
    
    try {
        const response = await fetch(url, { ...options, headers });
        
        // Handle non-JSON responses gracefully (e.g. HTML error pages from Vercel)
        let data;
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
            data = await response.json();
        } else {
            const text = await response.text();
            throw new Error(`Servidor retornou resposta inválida (${response.status}): ${text.substring(0, 50)}...`);
        }
        
        if (!response.ok) {
            if (response.status === 401 && url !== '/api/login' && url !== '/api/auth/login') {
                logout();
            }
            
            // Defensive fix for missing endpoints (e.g. legacy routes like /api/coupons)
            if (response.status === 404) {
                console.warn(`[API] Endpoint not found: ${url}. Returning fallback data.`);
                return []; // Fallback empty array to prevent rendering crashes
            }

            throw new Error(data.error || 'Erro na requisição');
        }
        return data;
    } catch (error) {
        // Only show toast if it's not a graceful fallback
        if (error.message !== 'Not Found' && !url.includes('coupons')) {
            showToast(error.message, 'error');
        }
        throw error;
    }
}

// Auth Logic
const togglePasswordBtn = document.getElementById('toggle-password');
if (togglePasswordBtn) {
    togglePasswordBtn.addEventListener('click', () => {
        const passInput = document.getElementById('login-pass');
        const icon = togglePasswordBtn.querySelector('span');
        
        if (passInput.type === 'password') {
            passInput.type = 'text';
            icon.textContent = 'visibility_off';
        } else {
            passInput.type = 'password';
            icon.textContent = 'visibility';
        }
    });
}

document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const user = document.getElementById('login-user').value;
    const pass = document.getElementById('login-pass').value;
    
    try {
        // Usa a rota real se disponível, ou a rota antiga
        const loginUrl = window.location.hostname.includes('localhost') || window.location.hostname.includes('127.0.0.1') ? '/api/login' : '/api/auth/login';
        
        const data = await apiCall(loginUrl, {
            method: 'POST',
            body: JSON.stringify({ username: user, password: pass })
        });
        
        currentToken = data.token;
        localStorage.setItem('admin_token', currentToken);
        document.getElementById('login-error').classList.add('hidden');
        showToast('Login realizado com sucesso!');
        initDashboard();
    } catch (err) {
        document.getElementById('login-error').classList.remove('hidden');
        document.getElementById('login-error').innerText = err.message;
    }
});

function logout() {
    currentToken = null;
    localStorage.removeItem('admin_token');
    switchView('login-view');
    document.getElementById('login-form').reset();
}

// Dashboard Init
async function initDashboard() {
    if (!currentToken) {
        switchView('login-view');
        return;
    }
    switchView('dashboard-view');
    showSection('banners');
    await loadBanners();
}

// --- Banners Logic ---
let bannersList = [];

async function loadBanners() {
    try {
        bannersList = await apiCall('/api/admin/banners');
        renderBanners();
    } catch (e) {
        console.error(e);
    }
}

function renderBanners() {
    const grid = document.getElementById('banners-grid');
    grid.innerHTML = '';
    
    bannersList.forEach(b => {
        const div = document.createElement('div');
        div.className = 'bg-surface-container-low rounded-xl overflow-hidden border border-white/5 relative group';
        
        div.innerHTML = `
            <div class="h-32 bg-surface-container-highest relative">
                <img src="${b.image_url}" class="w-full h-full object-cover opacity-60" onerror="this.src='https://via.placeholder.com/400x200?text=Invalid+Image'">
                <div class="absolute inset-0 bg-gradient-to-t from-background to-transparent"></div>
                <div class="absolute top-2 right-2 bg-black/50 backdrop-blur px-2 py-1 rounded text-[10px] font-label">Ordem: ${b.order_index}</div>
            </div>
            <div class="p-4">
                <h3 class="font-bold font-headline mb-1 truncate">${b.title}</h3>
                <p class="text-xs text-on-surface-variant mb-4">
                    Status: ${b.active ? 'Ativo' : 'Inativo'}
                </p>
                <div class="flex gap-2">
                    <button class="btn-edit-banner flex-1 py-1.5 rounded bg-white/5 hover:bg-white/10 text-xs transition-colors flex justify-center items-center gap-1" data-id="${b.id}">
                        <span class="material-symbols-outlined text-sm">edit</span> Editar
                    </button>
                    <button class="btn-delete-banner flex-1 py-1.5 rounded bg-error/10 text-error hover:bg-error/20 text-xs transition-colors flex justify-center items-center gap-1" data-id="${b.id}">
                        <span class="material-symbols-outlined text-sm">delete</span> Excluir
                    </button>
                </div>
            </div>
        `;
        grid.appendChild(div);
    });
}

// Event Delegation for dynamic buttons
document.getElementById('banners-grid')?.addEventListener('click', (e) => {
    const editBtn = e.target.closest('.btn-edit-banner');
    const deleteBtn = e.target.closest('.btn-delete-banner');
    
    if (editBtn) {
        editBanner(editBtn.getAttribute('data-id'));
    } else if (deleteBtn) {
        deleteBanner(deleteBtn.getAttribute('data-id'));
    }
});

function openBannerModal(id = null) {
    const form = document.getElementById('banner-form');
    form.reset();
    document.getElementById('banner-id').value = '';
    document.getElementById('banner-modal-title').innerText = 'Novo Banner';
    
    if (id) {
        const b = bannersList.find(x => x.id == id);
        if (b) {
            document.getElementById('banner-modal-title').innerText = 'Editar Banner';
            document.getElementById('banner-id').value = b.id;
            document.getElementById('banner-title').value = b.title || '';
            document.getElementById('banner-image').value = b.image_url || '';
            document.getElementById('banner-start').value = formatDateToShow(b.start_date) || '';
            document.getElementById('banner-end').value = formatDateToShow(b.end_date) || '';
            document.getElementById('banner-coupon').value = b.coupon_code || '';
            document.getElementById('banner-order').value = b.order_index || 1;
        }
    }
    openModal('banner-modal');
}

function editBanner(id) {
    openBannerModal(id);
}

async function deleteBanner(id) {
    confirmAction('Tem certeza que deseja excluir este banner?', async () => {
        try {
            await apiCall(`/api/admin/banners?id=${id}`, { method: 'DELETE' });
            showToast('Banner excluído com sucesso!');
            loadBanners();
        } catch(e) {}
    });
}

document.getElementById('banner-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('banner-id').value || Date.now().toString(); // Fallback id se não existir
    const data = {
        id: id,
        title: document.getElementById('banner-title').value,
        image_url: document.getElementById('banner-image').value,
        start_date: parseDateToSave(document.getElementById('banner-start').value),
        end_date: parseDateToSave(document.getElementById('banner-end').value),
        coupon_code: document.getElementById('banner-coupon').value,
        active: true,
        order_index: parseInt(document.getElementById('banner-order').value) || 0
    };
    
    try {
        await apiCall('/api/admin/banners', { method: 'POST', body: JSON.stringify(data) });
        showToast(id ? 'Banner atualizado!' : 'Banner criado!');
        closeModal('banner-modal');
        loadBanners();
    } catch(e) {}
});

// Initialize on load
function initApp() {
    // Add event listeners for static elements
    const returnHomeBtn = document.getElementById('btn-return-home');
    if (returnHomeBtn) returnHomeBtn.addEventListener('click', returnToHome);
    
    const navBanners = document.getElementById('nav-banners');
    if (navBanners) navBanners.addEventListener('click', (e) => { e.preventDefault(); showSection('banners'); });
    
    const mobNavBanners = document.getElementById('mob-nav-banners');
    if (mobNavBanners) mobNavBanners.addEventListener('click', () => showSection('banners'));

    const logoutDesktop = document.getElementById('btn-logout-desktop');
    if (logoutDesktop) logoutDesktop.addEventListener('click', logout);
    
    const logoutMobile = document.getElementById('btn-logout-mobile');
    if (logoutMobile) logoutMobile.addEventListener('click', logout);

    const newBannerBtn = document.getElementById('btn-new-banner');
    if (newBannerBtn) newBannerBtn.addEventListener('click', () => openBannerModal());
    
    const cancelBannerBtn = document.getElementById('btn-cancel-banner');
    if (cancelBannerBtn) cancelBannerBtn.addEventListener('click', () => closeModal('banner-modal'));

    const bannerStartInput = document.getElementById('banner-start');
    if (bannerStartInput) bannerStartInput.addEventListener('input', maskDate);
    
    const bannerEndInput = document.getElementById('banner-end');
    if (bannerEndInput) bannerEndInput.addEventListener('input', maskDate);

    if (currentToken) {
        // Verify token with backend (usando /api/health como dummy check ou pulando)
        apiCall('/api/health').then(() => {
            initDashboard();
        }).catch(() => {
            logout();
        });
    } else {
        initDashboard();
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
