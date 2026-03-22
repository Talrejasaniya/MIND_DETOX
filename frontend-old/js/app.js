const App = {
    authMode: 'login',

    async init() {
        await Auth.init();
        Views.init();
        this.setupEventListeners();
        console.log('Mind Detox initialized');
    },

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => Views.showView(e.target.dataset.view));
        });

        // Auth UI
        document.getElementById('loginBtn').addEventListener('click', () => this.openAuthModal('login'));
        document.getElementById('signupBtn').addEventListener('click', () => this.openAuthModal('signup'));
        document.getElementById('logoutBtn').addEventListener('click', () => this.handleLogout());
        document.getElementById('switchAuthModeBtn').addEventListener('click', () => this.switchAuthMode());
        document.getElementById('closeAuthBtn').addEventListener('click', () => this.closeAuthModal());
        
        const authForm = document.getElementById('authForm');
        if (authForm) {
            authForm.addEventListener('submit', (e) => this.handleAuthSubmit(e));
        }

        // AI Mirror
        const mirrorForm = document.getElementById('mirrorForm');
        if (mirrorForm) {
            mirrorForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleMirrorSubmit();
            });
        }

        // Journal Actions
        document.getElementById('saveJournalBtn').addEventListener('click', () => this.handleSaveJournal());
        document.getElementById('newEntryBtn').addEventListener('click', () => Views.showJournalEditor());
        document.getElementById('cancelEditBtn').addEventListener('click', () => Views.hideJournalEditor());

        // Memories Panel
        document.getElementById('toggleMemoriesBtn').addEventListener('click', () => Views.toggleMemoriesPanel());
        const closeMemBtn = document.getElementById('closeMemoriesBtn');
        if (closeMemBtn) closeMemBtn.addEventListener('click', () => Views.closeMemories());
    },

    async handleSaveJournal() {
        const title = document.getElementById('journalTitle').value.trim();
        const content = document.getElementById('journalContent').value.trim();
        const saveBtn = document.getElementById('saveJournalBtn');

        if (!title || !content) return;

        saveBtn.disabled = true;
        saveBtn.textContent = 'saving...';

        try {
            await API.journal.create(title, content);
            
            // Clean UI
            document.getElementById('journalTitle').value = '';
            document.getElementById('journalContent').value = '';
            Views.hideJournalEditor();
            
            // Force Reload Data
            await Views.loadJournals(); 
            await Views.loadMemories(); 
            
            alert("Journal and Reflection saved!");
        } catch (error) {
            alert("Save failed: " + error.message);
        } finally {
            saveBtn.disabled = false;
            saveBtn.textContent = 'save';
        }
    },

    async handleMirrorSubmit() {
        const input = document.getElementById('mirrorInput');
        const submitBtn = document.getElementById('reflectBtn');
        const content = input.value.trim();

        if (!content) return;
        submitBtn.disabled = true;

        try {
            const response = await API.mirror.reflect(content);
            Views.showReflection({
                id: Date.now(),
                content: response.reflection 
            });
            input.value = '';
        } catch (error) {
            Views.showMirrorError(error.message);
        } finally {
            submitBtn.disabled = false;
        }
    },

   async handleAuthSubmit(e) {
    if (e) e.preventDefault();
    
    const email = document.getElementById('authEmail').value;
    const password = document.getElementById('authPassword').value;
    const errorMsg = document.getElementById('authError');

    try {
        // Auth.handleAuth sirf data processing karega
        const result = await Auth.handleAuth(email, password);
        
        if (result.success) {
            if (this.authMode === 'signup') {
                // SUCCESS: Ab page change nahi hoga, sirf modal switch hoga
                alert("Account created! Now please Sign In with the same credentials.");
                this.authMode = 'login';
                this.updateAuthModal(); // Modal ko 'login' mode mein convert karega
                document.getElementById('authForm').reset();
            } else {
                // LOGIN SUCCESS: Ab page reload hoga taaki naya token detect ho
                this.closeAuthModal();
                window.location.reload(); 
            }
        }
    } catch (err) {
        if (errorMsg) {
            errorMsg.textContent = err.message;
            errorMsg.style.display = 'block';
        }
    }
},

    openAuthModal(mode) {
        this.authMode = mode;
        document.getElementById('authModal').style.display = 'flex';
        this.updateAuthModal();
    },

    closeAuthModal() {
        document.getElementById('authModal').style.display = 'none';
    },

    switchAuthMode() {
        this.authMode = this.authMode === 'login' ? 'signup' : 'login';
        this.updateAuthModal();
    },

    updateAuthModal() {
        const title = document.getElementById('authTitle');
        const submitBtn = document.getElementById('authSubmitBtn');
        const switchBtn = document.getElementById('switchAuthModeBtn');
        if (this.authMode === 'login') {
            title.textContent = 'welcome back';
            submitBtn.textContent = 'sign in';
            switchBtn.textContent = "don't have an account? sign up";
        } else {
            title.textContent = 'create account';
            submitBtn.textContent = 'sign up';
            switchBtn.textContent = 'already have an account? sign in';
        }
    },

    handleLogout() {
        Auth.logout();
        window.location.reload();
    }
};

// Start App
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => App.init());
} else {
    App.init();
}