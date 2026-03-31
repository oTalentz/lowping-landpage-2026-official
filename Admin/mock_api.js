// Mock Backend - Simulates API and Data Flow
class MockAPI {
    constructor() {
        this.delay = 500; // Simulate network latency
        this.initData();
    }

    initData() {
        if (!localStorage.getItem('admin_users')) {
            // Admin password is 'admin123'
            // In a real scenario, this would be a bcrypt hash. We simulate it.
            localStorage.setItem('admin_users', JSON.stringify([{
                username: 'admin',
                passwordHash: this.hashPassword('admin123')
            }]));
        }
        if (!localStorage.getItem('banners')) {
            localStorage.setItem('banners', JSON.stringify([]));
        }
        if (!localStorage.getItem('brute_force_protection')) {
            localStorage.setItem('brute_force_protection', JSON.stringify({ attempts: 0, lockUntil: 0 }));
        }
    }

    hashPassword(password) {
        // Simple mock hash function for demonstration
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString();
    }

    async handleRequest(url, options) {
        console.log(`[MockAPI] HTTP ${options.method} ${url}`, options.body ? JSON.parse(options.body) : '');
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                try {
                    const response = this.routeRequest(url, options);
                    console.log(`[MockAPI] Response ${response.status}`, response.data);
                    resolve({
                        ok: response.status >= 200 && response.status < 300,
                        status: response.status,
                        json: async () => response.data
                    });
                } catch (e) {
                    console.error('[MockAPI] Error:', e);
                    resolve({
                        ok: false,
                        status: 500,
                        json: async () => ({ error: 'Internal Server Error' })
                    });
                }
            }, this.delay);
        });
    }

    routeRequest(url, options) {
        const method = options.method;
        const body = options.body ? JSON.parse(options.body) : null;
        const token = options.headers?.Authorization;

        // Mock headers for Security Hardening
        const securityHeaders = {
            'Content-Security-Policy': "default-src 'self'; script-src 'self'; frame-ancestors 'none'; x-xss-protection: 1; mode=block",
            'X-Content-Type-Options': 'nosniff',
            'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
        };

        // Public routes
        if (url === '/api/login' && method === 'POST') {
            const response = this.login(body.username, body.password);
            return { ...response, headers: securityHeaders };
        }

        // Protected routes
        if (!this.verifyToken(token)) {
            return { status: 401, data: { error: 'Unauthorized' } };
        }

        if (url === '/api/banners') {
            if (method === 'GET') return this.getBanners();
            if (method === 'POST') return this.createBanner(body);
        }
        
        if (url.match(/^\/api\/banners\/\d+$/)) {
            const id = parseInt(url.split('/').pop());
            if (method === 'DELETE') return this.deleteBanner(id);
            if (method === 'PUT') return this.updateBanner(id, body);
        }

        return { status: 404, data: { error: 'Not Found' } };
    }

    verifyToken(token) {
        if (!token) return false;
        // Mock token verification
        return token.includes('mock-jwt-token-');
    }

    login(username, password) {
        const protection = JSON.parse(localStorage.getItem('brute_force_protection'));
        if (Date.now() < protection.lockUntil) {
            return { status: 429, data: { error: 'Too many attempts. Try again later.' } };
        }

        const users = JSON.parse(localStorage.getItem('admin_users'));
        const user = users.find(u => u.username === username);

        if (user && user.passwordHash === this.hashPassword(password)) {
            // Success, reset attempts
            localStorage.setItem('brute_force_protection', JSON.stringify({ attempts: 0, lockUntil: 0 }));
            return { status: 200, data: { token: 'mock-jwt-token-' + Date.now(), user: { username } } };
        }

        // Failed attempt
        protection.attempts += 1;
        if (protection.attempts >= 3) {
            protection.lockUntil = Date.now() + 60000; // 1 minute lock
        }
        localStorage.setItem('brute_force_protection', JSON.stringify(protection));

        return { status: 401, data: { error: 'Invalid credentials' } };
    }

    getBanners() {
        return { status: 200, data: JSON.parse(localStorage.getItem('banners')) };
    }

    createBanner(data) {
        const banners = JSON.parse(localStorage.getItem('banners'));
        const newBanner = { ...data, id: Date.now() };
        banners.push(newBanner);
        // Sort by order
        banners.sort((a, b) => a.order - b.order);
        localStorage.setItem('banners', JSON.stringify(banners));
        return { status: 201, data: newBanner };
    }

    updateBanner(id, data) {
        const banners = JSON.parse(localStorage.getItem('banners'));
        const index = banners.findIndex(b => b.id === id);
        if (index !== -1) {
            banners[index] = { ...banners[index], ...data };
            banners.sort((a, b) => a.order - b.order);
            localStorage.setItem('banners', JSON.stringify(banners));
            return { status: 200, data: banners[index] };
        }
        return { status: 404, data: { error: 'Banner not found' } };
    }

    deleteBanner(id) {
        let banners = JSON.parse(localStorage.getItem('banners'));
        banners = banners.filter(b => b.id !== id);
        localStorage.setItem('banners', JSON.stringify(banners));
        return { status: 200, data: { success: true } };
    }
}

// Intercept fetch
const mockAPI = new MockAPI();
window.originalFetch = window.fetch;
window.fetch = async (url, options) => {
    if (url.startsWith('/api/')) {
        return mockAPI.handleRequest(url, options);
    }
    return window.originalFetch(url, options);
};
