const Views = {
  // --- Properties ---
  currentView: 'mirror',
  currentReflection: null,
  currentJournal: null,
  journals: [],
  memories: [],

  // --- Core Functions ---

  /**
   * Application views ko initialize karta hai.
   * app.js isi function ko call karta hai.
   */
  init() {
    console.log("Views initialized");
    this.updateHeaderState();
    this.showView('mirror');
  },

  /**
   * Backend se journals fetch karta hai.
   */
 // views.js
async loadJournals() {
    try {
        const journals = await API.journal.getAll();
        this.journals = journals; // Ye line zaroori hai data store karne ke liye
        this.renderJournals();    // Parameter nikal dein kyunki render function 'this.journals' use karta hai
    } catch (error) {
        console.error("Failed to load journals:", error);
        const container = document.getElementById('journalList'); // ID check karein index.html mein
        if (container) container.innerHTML = `<p class="error">Please login to see your journals</p>`;
    }
},
  

 async loadMemories() {
    const memoriesList = document.getElementById('memoriesList');
    if (!memoriesList) return;

    try {
        const data = await API.memory.getAll();
        this.memories = data; // Data ko array mein save karein
        this.renderMemories(); // UI draw karein
    } catch (error) {
        console.error("Failed to load memories:", error);
    }
},

  // --- UI Update & Navigation ---

  updateHeaderState() {
    const guestActions = document.getElementById('guestActions');
    const authActions = document.getElementById('authActions');
    const headerNav = document.getElementById('headerNav');

    if (Auth.isAuthenticated) {
      if (guestActions) guestActions.style.display = 'none';
      if (authActions) authActions.style.display = 'flex';
      if (headerNav) headerNav.style.display = 'flex';
    } else {
      if (guestActions) guestActions.style.display = 'flex';
      if (authActions) authActions.style.display = 'none';
      if (headerNav) headerNav.style.display = 'none';
    }

    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.toggle('active', link.dataset.view === this.currentView);
    });
  },

  showView(viewName) {
    this.currentView = viewName;
    document.querySelectorAll('.view').forEach(view => view.style.display = 'none');

    if (viewName === 'mirror') {
      document.getElementById('mirrorView').style.display = 'block';
      this.updateMirrorView();
    } else if (viewName === 'journal') {
      document.getElementById('journalView').style.display = 'block';
      if (Auth.isAuthenticated) {
        document.getElementById('journalLocked').style.display = 'none';
        document.getElementById('journalList').style.display = 'block';
        this.loadJournals();
      } else {
        document.getElementById('journalLocked').style.display = 'block';
        document.getElementById('journalList').style.display = 'none';
        document.getElementById('journalEditor').style.display = 'none';
      }
    }
    this.updateHeaderState();
  },

  updateMirrorView() {
    const guestStatus = document.getElementById('guestStatus');
    const mirrorInput = document.getElementById('mirrorInput');
    const reflectBtn = document.getElementById('reflectBtn');
    const saveAsJournalBtn = document.getElementById('saveAsJournalBtn');

    if (Auth.isAuthenticated) {
      if (guestStatus) guestStatus.textContent = '';
      if (mirrorInput) mirrorInput.disabled = false;
      if (reflectBtn) reflectBtn.disabled = false;
      if (saveAsJournalBtn) saveAsJournalBtn.style.display = 'inline-block';
    } else {
      const usage = this.getGuestUsage();
      const remaining = 2 - usage;
      if (usage >= 2) {
        if (guestStatus) guestStatus.innerHTML = 'limit reached · <button class="link-button" onclick="App.openAuthModal(\'signup\')">sign up</button>';
        if (mirrorInput) mirrorInput.disabled = true;
        if (reflectBtn) reflectBtn.disabled = true;
      } else {
        if (guestStatus) guestStatus.textContent = `${remaining} reflections left as guest`;
      }
      if (saveAsJournalBtn) saveAsJournalBtn.style.display = 'none';
    }
  },incrementGuestUsage() {
    const usage = this.getGuestUsage() + 1;
    localStorage.setItem('mirrorUsage', usage.toString());
    this.updateMirrorView(); // UI update karne ke liye taaki 2 se 1 ho jaye
  },


  getGuestUsage() { 
    return parseInt(localStorage.getItem('mirrorUsage') || '0'); 
  },
  showMirrorError(message) {
    const errorDiv = document.getElementById('mirrorError');
    if (errorDiv) {
        const errorText = errorDiv.querySelector('.text-error');
        if (errorText) errorText.textContent = message;
        
        errorDiv.style.display = 'block'; // UI mein show karein
        document.getElementById('mirrorResponse').style.display = 'none'; // Purana response chhupayein
        
        // 5 second baad error apne aap gayab ho jaye (Optional)
        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 5000);
    }
},

  showReflection(reflection) {
    this.currentReflection = reflection;
    const textElem = document.getElementById('reflectionText');
    if (textElem) textElem.textContent = reflection.content;
    document.getElementById('mirrorResponse').style.display = 'block';
    document.getElementById('mirrorError').style.display = 'none';
  },

  renderJournals() {
    const journalList = document.getElementById('journalList');
    if (this.journals.length === 0) {
      journalList.innerHTML = '<div class="empty-state"><p>no entries yet</p></div>';
      return;
    }
    const entriesHTML = this.journals.map(j => `
      <div class="journal-card">
        <h3>${this.escapeHtml(j.title || 'Untitled')}</h3>
        <p class="journal-preview">${this.escapeHtml(j.content.substring(0, 100))}...</p>
        <div class="journal-meta">
          <span>${new Date(j.created_at).toLocaleDateString()}</span>
          <div class="journal-card-actions">
             <button class="btn-ghost" onclick="Views.deleteJournal('${j.id}')">delete</button>
          </div>
        </div>
      </div>`).join('');
    journalList.innerHTML = `<div class="journal-entries">${entriesHTML}</div>`;
  },

  renderMemories() {
    const memoriesList = document.getElementById('memoriesList');
    if (this.memories.length === 0) {
      memoriesList.innerHTML = '<div class="memories-empty"><p>no memories yet</p></div>';
      return;
    }
    memoriesList.innerHTML = this.memories.map(m => `
      <div class="memory-card" onclick="Views.toggleMemory('${m.id}')">
        <div class="memory-summary">
          <h4>${this.escapeHtml(m.title || 'Insight')}</h4>
          <span class="memory-date">${new Date(m.created_at).toLocaleDateString()}</span>
        </div>
        <div class="memory-detail" id="memory-detail-${m.id}" style="display: none;">
          <p>${this.escapeHtml(m.summary)}</p>
        </div>
      </div>`).join('');
  },

  toggleMemory(id) {
    const detail = document.getElementById(`memory-detail-${id}`);
    if (detail) {
      detail.style.display = detail.style.display === 'none' ? 'block' : 'none';
    }
  },

  toggleMemoriesPanel() {
    const panel = document.getElementById('memoriesPanel');
    const overlay = document.getElementById('memoriesOverlay');
    const btn = document.getElementById('toggleMemoriesBtn');

    if (panel.classList.contains('open')) {
      panel.classList.remove('open');
      overlay.style.display = 'none';
      btn.textContent = 'show memories';
    } else {
      panel.classList.add('open');
      overlay.style.display = 'block';
      btn.textContent = 'hide memories';
      this.loadMemories();
    }
  },
  closeMemories() {
    const panel = document.getElementById('memoriesPanel');
    const overlay = document.getElementById('memoriesOverlay');
    const btn = document.getElementById('toggleMemoriesBtn');

    if (panel) panel.classList.remove('open');
    if (overlay) overlay.style.display = 'none';
    if (btn) btn.textContent = 'show memories';
},

  showJournalEditor() {
    document.getElementById('journalEditor').style.display = 'block';
    document.getElementById('journalList').style.display = 'none';
  },

  hideJournalEditor() {
    document.getElementById('journalEditor').style.display = 'none';
    document.getElementById('journalList').style.display = 'block';
    this.currentJournal = null;
  },

  async deleteJournal(id) {
    if (!confirm('Are you sure you want to delete this entry?')) return;
    try {
      await API.journal.delete(id);
      this.loadJournals();
    } catch (error) {
      alert("Delete failed: " + error.message);
    }
  },

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
};

