const API_BASE_URL = 'http://127.0.0.1:8000';

const API = {
    async request(endpoint, options = {}) {
        const token = localStorage.getItem('authToken');
        const headers = { ...options.headers };

        if (options.body && !(options.body instanceof URLSearchParams)) {
            headers['Content-Type'] = 'application/json';
        }
        if (token) headers['Authorization'] = `Bearer ${token}`;

        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });

            // Handle 204 No Content (e.g., Delete success)
            if (response.status === 204) return null;

            const data = await response.json().catch(() => ({ detail: "System Error: Invalid Response" }));

            if (!response.ok) {
                const errorMsg = typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail);
                throw new Error(errorMsg || 'Request failed');
            }
            return data;
        } catch (error) {
            console.error('API Error:', error.message);
            throw error;
        }
    },

    auth: {
        async login(email, password) {
    const formData = new URLSearchParams();
    formData.append('username', email); // OAuth2 backend 'username' key mangta hai
    formData.append('password', password);
    return await API.request('/login', { 
        method: 'POST', 
        body: formData,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
},
async signup(email, password) {
        return await API.request('/signup', { 
            method: 'POST', 
            body: JSON.stringify({ email, password }),
            headers: { 'Content-Type': 'application/json' }
        });
    },

    async getMe() {
        return await API.request('/users/me');
    }
},

    journal: {
        async getAll() { return await API.request('/journals/'); },
        async create(title, content) {
            return await API.request('/journals/', {
                method: 'POST',
                body: JSON.stringify({ title, content })
            });
        },
        async delete(id) { return await API.request(`/journals/${id}`, { method: 'DELETE' }); }
    },

    memory: {
        async getAll() { return await API.request('/ai/memories'); }
    },

    mirror: {
        async reflect(content) { 
            return await API.request('/ai/mirror', { method: 'POST', body: JSON.stringify({ content }) }); 
        }
    }
}