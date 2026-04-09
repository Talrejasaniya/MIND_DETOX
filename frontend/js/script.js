/* ============================================================
   MIND DETOX — script.js
   Sections: Config · Auth · Guest · Journal · Reflection ·
             Memories · Breathing · Mood · Stats · UI · Pages · Router
   ============================================================ */

/* ═══════════════════════════════════════════
   1. CONFIG & CORE HELPERS
═══════════════════════════════════════════ */

const API_BASE_URL = "https://mind-detox-so3j.onrender.com/api/v1";
let currentEditingJournalId = null;

function getAuthHeader() {
  const user = JSON.parse(localStorage.getItem('md_user'));
  return user && user.token ? { Authorization: `Bearer ${user.token}` } : {};
}

function showToast(message, type = 'default', duration = 3000) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.className = 'toast' + (type !== 'default' ? ' toast-' + type : '');
  requestAnimationFrame(() => toast.classList.add('show'));
  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => toast.classList.remove('show'), duration);
}

function getTodayString() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

/* ═══════════════════════════════════════════
   2. AUTH
═══════════════════════════════════════════ */

function isLoggedIn() {
  return !!localStorage.getItem('md_user');
}

function getCurrentUser() {
  try { return JSON.parse(localStorage.getItem('md_user')) || null; }
  catch { return null; }
}

function logout() {
  localStorage.removeItem('md_user');
  window.location.href = 'index.html';
}

function requireAuth() {
  if (!isLoggedIn()) window.location.href = 'login.html';
}

function redirectIfLoggedIn(dest = 'dashboard.html') {
  if (isLoggedIn()) window.location.href = dest;
}

function initPasswordToggles() {
  document.querySelectorAll('.toggle-pwd-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = btn.previousElementSibling;
      if (!input) return;
      const showing = input.type === 'text';
      input.type = showing ? 'password' : 'text';
      btn.textContent = showing ? '👁' : '🙈';
    });
  });
}

/* ═══════════════════════════════════════════
   3. GUEST USE COUNTER
═══════════════════════════════════════════ */

const GUEST_LIMIT = 2;

function getGuestUses(feature) {
  return parseInt(localStorage.getItem('md_guest_' + feature) || '0', 10);
}

function incrementGuestUses(feature) {
  const count = getGuestUses(feature) + 1;
  localStorage.setItem('md_guest_' + feature, count);
  return count;
}

function updateGuestUseBadges() {
  ['journal', 'reflection'].forEach(f => {
    const el = document.getElementById('uses-' + f);
    if (!el) return;
    const left = Math.max(0, GUEST_LIMIT - getGuestUses(f));
    el.textContent = left > 0
      ? `${left} free use${left !== 1 ? 's' : ''} remaining`
      : 'No free uses left — please sign up';
    if (left === 0) el.style.color = 'var(--rose)';
  });
}
function showCustomConfirm(message, onConfirm) {
  const modal = document.getElementById('confirm-modal');
  const msgEl = document.getElementById('confirm-msg');
  const okBtn = document.getElementById('confirm-ok');
  const cancelBtn = document.getElementById('confirm-cancel');

  msgEl.textContent = message;
  modal.style.display = 'flex';

  // Cleanup functions
  const close = () => { modal.style.display = 'none'; };
  
  okBtn.onclick = () => { close(); onConfirm(); };
  cancelBtn.onclick = close;
}
/* ═══════════════════════════════════════════
   4. JOURNAL
═══════════════════════════════════════════ */

async function initJournalList() {
  const container = document.getElementById('journal-list');
  if (!container) return;

  container.innerHTML = '<p class="list-loading">Loading entries…</p>';

  try {
    const res = await fetch(`${API_BASE_URL}/journals/`, {
      headers: getAuthHeader()
    });

    if (!res.ok) {
      container.innerHTML = '<p class="list-empty">Could not load entries.</p>';
      return;
    }

    const journals = await res.json();

    if (!journals.length) {
      container.innerHTML = `
        <div class="list-empty">
          <span class="list-empty-icon">📓</span>
          <p>No entries yet. Write something above to get started.</p>
        </div>`;
      return;
    }

// initJournalList ke andar map function ko update karein
container.innerHTML = journals.map(j => `
  <div class="journal-item" id="journal-${j.id}"> <div class="journal-item-body">
      <p class="journal-item-text">${escapeHtml(j.content)}</p>
      <span class="journal-item-date">${new Date(j.created_at).toLocaleDateString()}</span>
    </div>
    <div class="item-menu-wrap">
      <button class="dots-btn" onclick="toggleMenu(event, '${j.id}')">⋮</button>
      <div id="menu-${j.id}" class="dropdown-menu">
        <button class="dropdown-item" onclick="prepareEdit('${j.id}')">
          <span class="di-icon">✏️</span> Edit
        </button>
        <button class="dropdown-item dropdown-item--danger" onclick="handleDeleteJournal('${j.id}')">
          <span class="di-icon">🗑️</span> Delete
        </button>
        <button class="dropdown-item dropdown-item--memory" onclick="saveMemory('${j.id}')">
          <span class="di-icon">🌸</span> Save to Memory
        </button>
      </div>
    </div>
  </div>
`).join('');

  } catch (err) {
    console.error('Journal list fetch failed:', err);
    container.innerHTML = '<p class="list-empty">Failed to load entries.</p>';
  }
}

function initJournalEditor() {
  const textarea  = document.getElementById('journal-textarea');
  const saveBtn   = document.getElementById('journal-save');
  const cancelBtn = document.getElementById('journal-cancel');
  const charCount = document.getElementById('journal-char-count');

  if (!textarea || !saveBtn) return;

  // Character count
  textarea.addEventListener('input', () => {
    const len = textarea.value.length;
    if (charCount) charCount.textContent = len ? `${len} characters` : '';
  });

  // Save / Update
  saveBtn.addEventListener('click', async () => {
    const text = textarea.value.trim();
    if (!text) { showToast('Write something first 🌿', 'lavender'); return; }

    saveBtn.disabled = true;
    saveBtn.textContent = currentEditingJournalId ? 'Updating…' : 'Saving…';

    if (currentEditingJournalId) {
      await completeJournalUpdate(currentEditingJournalId, text);
    } else {
      await completeJournalCreate(text);
    }

    saveBtn.disabled = false;
    saveBtn.textContent = currentEditingJournalId ? 'Update Entry' : 'Save Entry';
  });

  // Cancel edit
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      resetJournalArea();
      showToast('Edit cancelled');
    });
  }
}

async function completeJournalCreate(text) {
  try {
    const res = await fetch(`${API_BASE_URL}/journals/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ content: text})
    });
    if (!res.ok) throw new Error('Save failed');
    showToast('Journal saved 🌿');
    resetJournalArea();
    initJournalList();
  } catch (err) { showToast(err.message, 'rose'); }
}
async function completeJournalUpdate(id, content) {
  const savedMood = localStorage.getItem('md_mood_today') || 'Neutral'; 

  try {
    const res = await fetch(`${API_BASE_URL}/journals/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      // Content ke saath mood bhi bhej rahe hain
      body: JSON.stringify({ 
        content: content,
      })
    });
    if (!res.ok) throw new Error('Update failed');
    showToast('Journal updated 🌿');
    resetJournalArea();
    initJournalList();
  } catch (err) {
    showToast(err.message, 'rose');
  }
}

// Purana confirm() hata kar ye wala logic use karo
function handleDeleteJournal(id) {
  showCustomConfirm('Remove this entry? This cannot be undone.', async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/journals/${id}`, {
        method: 'DELETE',
        headers: getAuthHeader()
      });
      if (!res.ok) throw new Error('Could not delete');
      showToast('Entry deleted', 'rose');
      initJournalList();
    } catch (err) {
      showToast(err.message, 'rose');
    }
  });
}

function handleEditStart(id, content) {
  currentEditingJournalId = id;

  const textarea  = document.getElementById('journal-textarea');
  const saveBtn   = document.getElementById('journal-save');
  const cancelBtn = document.getElementById('journal-cancel');

  if (textarea) { textarea.value = content; textarea.focus(); }
  if (saveBtn)  { saveBtn.textContent = 'Update Entry'; saveBtn.classList.add('btn--updating'); }
  if (cancelBtn) cancelBtn.style.display = 'inline-flex';

  // Scroll the editor into view
  const editorCard = document.getElementById('journal-editor-card');
  if (editorCard) editorCard.scrollIntoView({ behavior: 'smooth', block: 'start' });

  closeAllMenus();
  showToast('Editing entry…', 'lavender');
}

function resetJournalArea() {
  currentEditingJournalId = null;

  const textarea  = document.getElementById('journal-textarea');
  const saveBtn   = document.getElementById('journal-save');
  const cancelBtn = document.getElementById('journal-cancel');
  const charCount = document.getElementById('journal-char-count');

  if (textarea)  { textarea.value = ''; }
  if (saveBtn)   { saveBtn.textContent = 'Save Entry'; saveBtn.classList.remove('btn--updating'); saveBtn.disabled = false; }
  if (cancelBtn) { cancelBtn.style.display = 'none'; }
  if (charCount) { charCount.textContent = ''; }
}

async function saveMemory(journalId) {
  try {
    const res = await fetch(`${API_BASE_URL}/ai/save-memory?journal_id=${journalId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() }
    });
    if (!res.ok) {
      const err = await res.text();
      console.error('Save memory error:', err);
      return showToast('Login required ⚠️', 'rose');
    }
    showToast('Saved to memories 🌸', 'lavender');
    closeAllMenus();
  } catch (err) {
    console.error(err);
    showToast('Error saving memory', 'rose');
  }
}
// Ye function DOM se text nikal kar handleEditStart ko dega
function prepareEdit(id) {
  const item = document.getElementById(`journal-${id}`);
  if (!item) return;
  
  const text = item.querySelector('.journal-item-text').textContent;
  handleEditStart(id, text); 
}

/* ═══════════════════════════════════════════
   5. AI REFLECTION
═══════════════════════════════════════════ */

function initAIReflection() {
  const reflectBtn     = document.getElementById('reflect-btn');
  const reflectPrompt  = document.getElementById('reflect-prompt');
  const reflectDisplay = document.getElementById('reflect-display');
  const thinkingEl     = document.getElementById('reflect-thinking');

  if (!reflectBtn) return;

  reflectBtn.addEventListener('click', async () => {
    const prompt = reflectPrompt ? reflectPrompt.value.trim() : '';
    if (!prompt) { showToast('Share a thought first 🌿', 'lavender'); return; }

    reflectBtn.disabled = true;
    reflectBtn.textContent = 'Reflecting…';
    if (thinkingEl) thinkingEl.classList.add('show');
    if (reflectDisplay) reflectDisplay.textContent = '';

    try {
      const res = await fetch(`${API_BASE_URL}/ai/mirror`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ content: prompt })
      });
      if (!res.ok) throw new Error('Mirror is foggy right now');
      const data = await res.json();
      if (reflectDisplay) {
        reflectDisplay.textContent = data.reflection;
        reflectDisplay.classList.add('has-content');
      }
    } catch (err) {
      showToast(err.message, 'rose');
    } finally {
      reflectBtn.disabled = false;
      reflectBtn.textContent = '✨ Get Reflection';
      if (thinkingEl) thinkingEl.classList.remove('show');
    }
  });
}

/* ═══════════════════════════════════════════
   6. MEMORIES
═══════════════════════════════════════════ */

async function initMemories() {
  const list = document.getElementById('memories-list');
  if (!list) return;

  list.innerHTML = '<p class="list-loading">Loading memories…</p>';

  try {
    const res = await fetch(`${API_BASE_URL}/ai/all-memories`, {
      headers: getAuthHeader()
    });

    if (!res.ok) {
      list.innerHTML = '<p class="list-empty">Could not load memories. Please log in.</p>';
      return;
    }

    const memories = await res.json();

    if (!memories.length) {
      list.innerHTML = `
        <div class="list-empty">
          <span class="list-empty-icon">🌸</span>
          <p>No memories yet. Save a journal entry to memory to see it here.</p>
        </div>`;
      return;
    }

    list.innerHTML = memories.map(m => `
      <div class="memory-card">
        <div class="memory-card-body">
          <p class="memory-text">${escapeHtml(m.summary)}</p>
          <span class="memory-date">${m.created_at ? new Date(m.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}</span>
        </div>
        <button class="btn-icon btn-icon--danger" onclick="handleDeleteMemory('${m.id}')" title="Delete memory">🗑️</button>
      </div>
    `).join('');

  } catch (err) {
    console.error('Memory fetch failed:', err);
    list.innerHTML = '<p class="list-empty">Error loading memories.</p>';
  }
}

function prepareDeleteMemory(id) {
  // Humne journal fix mein showCustomConfirm function pehle hi bana liya hai (Step 3 JS helper)
  // Ise wahi logic reuse karenge
  showCustomConfirm('Remove this memory? This cannot be undone.', async () => {
    // Ye delete callback tab chalega jab user 'Yes, Delete' par click karega
    await handleDeleteMemory(id); 
  });
}

// Ye aapka purana delete function ho sakta hai, use 'await' ke liye async banayein
async function handleDeleteMemory(id) {
  try {
    const res = await fetch(`${API_BASE_URL}/ai/memories/${id}`, {
      method: 'DELETE',
      headers: getAuthHeader()
    });
    
    if (!res.ok) throw new Error('Could not delete memory');
    
    showToast('Memory deleted', 'rose');

    // ❌ Ise badaliye (Purana naam):
    // initMemoryList(); 

    // ✅ Isse (Asli naam jo aapke script.js mein hai):
    initMemories(); 
    
  } catch (err) {
    showToast(err.message, 'rose');
  }
}

/* ═══════════════════════════════════════════
   7. BREATHING EXERCISE
═══════════════════════════════════════════ */

function initBreathing() {
  const startBtn     = document.getElementById('breathing-start');
  const stopBtn      = document.getElementById('breathing-stop');
  const circle       = document.getElementById('breathing-circle');
  const phaseEl      = document.getElementById('breathing-phase');
  const timerEl      = document.getElementById('breathing-timer');
  const instrEl      = document.getElementById('breathing-instr');
  const progressDots = document.querySelectorAll('.bp-dot');

  if (!startBtn) return;

  const phases = [
    { name: 'Inhale',  label: 'Breathe in',   secs: 4, instr: 'Slowly breathe in through your nose',  cls: 'inhale' },
    { name: 'Hold',    label: 'Hold',          secs: 4, instr: 'Hold your breath gently',              cls: 'hold'   },
    { name: 'Exhale',  label: 'Breathe out',   secs: 4, instr: 'Slowly exhale through your mouth',    cls: 'exhale' }
  ];

  let phaseIdx = 0, secondsLeft = 0, cycleCount = 0, intervalId = null;

  function updateDots(idx) {
    progressDots.forEach((dot, i) => {
      dot.classList.remove('active', 'done');
      if (i === idx) dot.classList.add('active');
      else if (i < idx) dot.classList.add('done');
    });
  }

  function setPhase(idx) {
    const p = phases[idx];
    secondsLeft = p.secs;
    circle.className = 'breathing-circle ' + p.cls;
    circle.innerHTML = `<span>${p.label}</span><span class="bc-label">${p.secs}s</span>`;
    if (phaseEl) phaseEl.textContent = p.name;
    if (instrEl) instrEl.textContent = p.instr;
    updateDots(idx);
  }

  function tick() {
    if (timerEl) timerEl.textContent = secondsLeft;
    secondsLeft--;
    if (secondsLeft < 0) {
      phaseIdx = (phaseIdx + 1) % phases.length;
      if (phaseIdx === 0) { cycleCount++; showToast(`Cycle ${cycleCount} complete 🌿`); }
      setPhase(phaseIdx);
    }
  }

  function startBreathing() {
    phaseIdx = 0; cycleCount = 0;
    startBtn.style.display = 'none';
    if (stopBtn) stopBtn.style.display = 'inline-flex';
    setPhase(0); tick();
    intervalId = setInterval(tick, 1000);
  }

  function stopBreathing() {
    clearInterval(intervalId);
    startBtn.style.display = 'inline-flex';
    if (stopBtn) stopBtn.style.display = 'none';
    circle.className = 'breathing-circle';
    circle.innerHTML = '🌿';
    if (phaseEl) phaseEl.textContent = 'Ready';
    if (timerEl) timerEl.textContent = '';
    if (instrEl) instrEl.textContent = "Press start when you're ready";
    progressDots.forEach(d => d.classList.remove('active', 'done'));
  }

  startBtn.addEventListener('click', startBreathing);
  if (stopBtn) stopBtn.addEventListener('click', stopBreathing);
}

/* ═══════════════════════════════════════════
   8. MOOD CHECK-IN
═══════════════════════════════════════════ */
function initMoodCheckin() {
    const moodBtns = document.querySelectorAll('.mood-btn');
    const modal = document.getElementById('mood-modal');
    const saveBtn = document.getElementById('save-mood-btn');
    const input = document.getElementById('mood-why-input');

    moodBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const mood = btn.dataset.mood;
            const emoji = btn.innerText.split('\n')[0]; // Emoji nikalne ke liye
            localStorage.setItem('md_mood_today', mood);

            // Modal dikhao
            document.getElementById('selected-emoji').innerText = emoji;
            modal.style.display = 'flex';
            input.value = ''; // Input clear karo
        });
    });

    saveBtn.onclick = async () => {
    const mood = localStorage.getItem('md_mood_today'); // Emoji wala mood
    const why = input.value.trim() || 'General';       // Popup wala "Why"

    try {
        await fetch(`${API_BASE_URL}/journals/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
            body: JSON.stringify({ 
                content: "Quick Mood Log", // 👈 Isse pehchan hogi ki ye sirf Mood tracking hai
                mood_tag: mood,
                trigger_category: why 
            })
        });
        modal.style.display = 'none';
        showToast("Mood tracked successfully! 📈");
        
        // Agar aap Analysis page par hain, toh charts refresh karo
        if (typeof initAnalysis === "function") initAnalysis(); 
    } catch (err) {
        console.error("Quick log failed", err);
    }
};
}

/* ═══════════════════════════════════════════
   9. DASHBOARD STATS
═══════════════════════════════════════════ */

function initDashStats() {
  const streak   = parseInt(localStorage.getItem('md_streak')   || '1', 10);
  const sessions = parseInt(localStorage.getItem('md_sessions') || '0', 10) + 1;
  localStorage.setItem('md_sessions', sessions);

  const streakEl   = document.getElementById('stat-streak');
  const sessionsEl = document.getElementById('stat-sessions');
  if (streakEl)   streakEl.textContent   = streak;
  if (sessionsEl) sessionsEl.textContent = sessions;
}

/* ═══════════════════════════════════════════
   10. SIDEBAR & UI HELPERS
═══════════════════════════════════════════ */

function initSidebar() {
  const sidebar = document.getElementById('sidebar');
  const toggleBtn = document.getElementById('sidebar-toggle');
  const overlay = document.getElementById('sidebar-overlay');

  if (!sidebar || !toggleBtn || !overlay) return;
const toggleSidebar = () => {
    const isOpen = sidebar.classList.toggle('open');
    overlay.classList.toggle('active', isOpen); // CSS class 'active' use karo
  };

  toggleBtn.onclick = (e) => { e.stopPropagation(); toggleSidebar(); };
  overlay.onclick = toggleSidebar;

  // Menu links par click karte hi band ho jaye (Mobile ke liye zaroori)
  sidebar.querySelectorAll('.sidebar-link').forEach(link => {
    link.onclick = () => {
      sidebar.classList.remove('open');
      overlay.classList.remove('active');
    };
  });
}
 // toggleBtn.addEventListener('click', () => {
  //  sidebar.classList.toggle('open');
   // overlay.style.display = sidebar.classList.contains('open') ? 'block' : 'none';
 // });

  //overlay.addEventListener('click', () => {
   // sidebar.classList.remove('open');
   // overlay.style.display = 'none';
 // });
//}

async function deleteAccount() {
    // ⚠️ Blind Spot Check: Bina confirmation ke delete mat karna!
    if (!confirm("Are you sure? Your account and all journals will be DELETED forever. 🚨")) return;

    try {
        const res = await fetch(`${API_BASE_URL}/users/me`, { // Check if your backend has this endpoint
            method: 'DELETE',
            headers: getAuthHeader()
        });

        if (res.ok) {
            showToast("Account deleted successfully", "rose");
            localStorage.removeItem('md_user'); // Local data saaf karo
            window.location.href = 'signup.html'; // Wapas signup par bhejo
        } else {
            const err = await res.json();
            showToast(err.detail || "Could not delete account", "rose");
        }
    } catch (err) {
        showToast("Server error. Try again later.", "rose");
    }
}

// 2. initTopbar function ko update karein
function initTopbar() {
    const user = getCurrentUser();
    const nameEl = document.getElementById('user-name');
    const avatarEl = document.getElementById('user-avatar');

    if (nameEl) nameEl.textContent = user ? user.name : 'Friend';
    if (avatarEl) avatarEl.textContent = user ? user.name.charAt(0).toUpperCase() : '?';

    // Topbar waale "Delete" button ke liye alag listener
    const deleteBtn = document.querySelector('[data-action="delete-account"]');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', deleteAccount);
    }

    // Sidebar waale "Logout" button ke liye (standard logout)
    document.querySelectorAll('[data-action="logout"]').forEach(el => {
        el.addEventListener('click', logout);
    });
}

function toggleMenu(event, id) {
  event.stopPropagation();
  document.querySelectorAll('.dropdown-menu').forEach(m => {
    if (m.id !== `menu-${id}`) m.classList.remove('show');
  });
  const menu = document.getElementById(`menu-${id}`);
  if (menu) menu.classList.toggle('show');
}

function closeAllMenus() {
  document.querySelectorAll('.dropdown-menu').forEach(m => m.classList.remove('show'));
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/* ═══════════════════════════════════════════
   11. PAGE INIT FUNCTIONS
═══════════════════════════════════════════ */

/* ── Dashboard ── */
function initDashboard() {
  requireAuth();
  initTopbar();
  initSidebar();

  const greetingEl = document.getElementById('dash-greeting');
  const dateEl     = document.getElementById('dash-date');
  const user       = getCurrentUser();

  if (greetingEl) greetingEl.textContent = `${getGreeting()}, ${user ? user.name : 'Friend'} 👋`;
  if (dateEl)     dateEl.textContent     = getTodayString();

  initMoodCheckin();
  initJournalEditor();
  initJournalList();
  initDashStats();
}

/* ── Reflection Page ── */
function initReflectionPage() {
  requireAuth();
  initTopbar();
  initSidebar();
  initAIReflection();
  initBreathing();
}

/* ── Memories Page ── */
function initMemoriesPage() {
  requireAuth();
  initTopbar();
  initSidebar();
  initMemories();
}

/* ── Index / Landing ── */
function initIndexPage() {
  const navLinks = document.querySelector('.nav-links');
  if (navLinks && isLoggedIn()) {
    navLinks.innerHTML = `<a href="dashboard.html" class="btn btn-primary btn-sm">My Dashboard</a>`;
  }

  updateGuestUseBadges();

  // Guest journal demo
  const journalBtn   = document.getElementById('try-journal-btn');
  const journalInput = document.getElementById('try-journal-input');
  const journalResp  = document.getElementById('try-journal-resp');

  if (journalBtn) {
    journalBtn.addEventListener('click', () => {
      const text = journalInput ? journalInput.value.trim() : '';
      if (!text) { showToast('Please write something first 🌿', 'lavender'); return; }
      if (getGuestUses('journal') >= GUEST_LIMIT) {
        showToast("You've used your free tries. Sign up to continue! 🌸", 'rose'); return;
      }
      incrementGuestUses('journal');
      updateGuestUseBadges();
      if (journalResp) {
        journalResp.textContent = '✨ Your thoughts are safely held. Sign up to save them permanently.';
        journalResp.classList.add('visible');
      }
      showToast('Journal saved temporarily! 🌿');
    });
  }

  // Guest AI reflection demo
  const reflectBtn   = document.getElementById('try-reflect-btn');
  const reflectInput = document.getElementById('try-reflect-input');
  const reflectResp  = document.getElementById('try-reflect-resp');

  if (reflectBtn) {
    reflectBtn.addEventListener('click', async () => {
      const text = reflectInput ? reflectInput.value.trim() : '';
      if (!text) { showToast('Share a thought to reflect on 🌿', 'lavender'); return; }
      if (getGuestUses('reflection') >= GUEST_LIMIT) {
        showToast('Sign up to unlock unlimited AI reflections 🌸', 'rose'); return;
      }
      reflectBtn.disabled = true;
      reflectBtn.textContent = 'Reflecting…';
      try {
        const res = await fetch(`${API_BASE_URL}/ai/mirror`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: text })
        });
        if (!res.ok) throw new Error('API Connection Failed');
        const data = await res.json();
        incrementGuestUses('reflection');
        updateGuestUseBadges();
        if (reflectResp) { reflectResp.textContent = data.reflection; reflectResp.classList.add('visible'); }
        showToast('Reflection ready 🌿');
      } catch (err) {
        showToast('The mirror is currently foggy. Try again later.', 'rose');
      } finally {
        reflectBtn.disabled = false;
        reflectBtn.textContent = 'Get Reflection';
      }
    });
  }
}

/* ── Login ── */
async function initLoginPage() {
  redirectIfLoggedIn();
  initPasswordToggles();

  const form = document.getElementById('login-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn      = form.querySelector('[type="submit"]');
    const email    = form.querySelector('[name="email"]').value;
    const password = form.querySelector('[name="password"]').value;

    btn.disabled = true; btn.textContent = 'Signing in…';

    try {
      const res = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ username: email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Login failed');

// initLoginPage ke andar, 'data' aane ke baad
const nameFromEmail = email.split('@')[0]; // 'saniya@gmail.com' -> 'saniya'
const capitalizedName = nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1);

localStorage.setItem('md_user', JSON.stringify({ 
    name: capitalizedName, 
    token: data.access_token 
}));     
 window.location.href = 'dashboard.html';
    } catch (err) {
      showToast(err.message, 'rose');
      btn.disabled = false; btn.textContent = 'Sign In';
    }
  });
}

/* ── Signup ── */
async function initSignupPage() {
  redirectIfLoggedIn();
  initPasswordToggles();

  const form = document.getElementById('signup-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn      = form.querySelector('[type="submit"]');
    const username     = document.getElementById('name').value;
    const email    = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    btn.disabled = true; btn.textContent = 'Creating account…';

    try {
      const res = await fetch(`${API_BASE_URL}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
      });
      if (!res.ok) throw new Error('Signup failed');
      showToast('Account created! Sign in now 🌸');
      window.location.href = 'login.html';
    } catch (err) {
      showToast(err.message, 'rose');
      btn.disabled = false; btn.textContent = 'Create Account';
    }
  });
}
document.querySelectorAll('.sidebar a').forEach(link => {
  link.addEventListener('click', () => {
    sidebar.classList.remove('open');
    overlay.classList.remove('active');
  });
});
/* ═══════════════════════════════════════════
   12. PAGE ROUTER
═══════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  // Close all dropdowns on any outside click
  document.addEventListener('click', closeAllMenus);

  const page = document.body.dataset.page;

  switch (page) {
    case 'index':      initIndexPage();       break;
    case 'login':      initLoginPage();       break;
    case 'signup':     initSignupPage();      break;
    case 'dashboard':  initDashboard();       break;
    case 'reflection': initReflectionPage();  break;
    case 'memories':   initMemoriesPage();    break; 
    case 'mood_analysis':
        // 1. Sidebar aur Topbar initialize karo (Global)
        initSidebar();
        initTopbar();
        // 2. Phir alag JS ka main function call karo
        if (typeof initAnalysis === "function") {
            initAnalysis(); 
        }
        break;  

  }
});
