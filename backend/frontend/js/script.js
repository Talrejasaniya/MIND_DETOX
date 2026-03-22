const API_BASE_URL = "http://127.0.0.1:8000/api/v1";
let currentEditingJournalId = null;
const getAuthHeader = () => {
    const user = JSON.parse(localStorage.getItem('md_user'));
    console.log("USER:", user); 
    return user && user.token ? { 'Authorization': `Bearer ${user.token}` } : {};
};
/**
 * Show a toast notification
 * @param {string} message
 * @param {string} type  'default' | 'rose' | 'lavender'
 * @param {number} duration ms
 */
function showToast(message, type = 'default', duration = 3000) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.className = 'toast' + (type !== 'default' ? ' toast-' + type : '');
  requestAnimationFrame(() => {
    toast.classList.add('show');
  });
  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => {
    toast.classList.remove('show');
  }, duration);
}

/** Format today's date nicely */
function getTodayString() {
  const d = new Date();
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/** Get greeting based on hour */
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

/* ────────────────────────────────────────────
   AUTH HELPERS
──────────────────────────────────────────── */

function isLoggedIn() {
  return !!localStorage.getItem('md_user');
}

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem('md_user')) || null;
  } catch { return null; }
}

function logout() {
  localStorage.removeItem('md_user');
  window.location.href = 'index.html';
}

/** Guard pages that require login */
function requireAuth() {
  if (!isLoggedIn()) {
    window.location.href = 'login.html';
  }
}

/** Redirect if already logged in */
function redirectIfLoggedIn(dest = 'dashboard.html') {
  if (isLoggedIn()) {
    window.location.href = dest;
  }
}

/* ────────────────────────────────────────────
   GUEST USE COUNTER
──────────────────────────────────────────── */

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
    const used = getGuestUses(f);
    const left = Math.max(0, GUEST_LIMIT - used);
    el.textContent = left > 0
      ? `${left} free use${left !== 1 ? 's' : ''} remaining`
      : 'No free uses left — please sign up';
    if (left === 0) el.style.color = 'var(--rose)';
  });
}

/* ────────────────────────────────────────────
   PASSWORD VISIBILITY TOGGLE
──────────────────────────────────────────── */

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

/* ────────────────────────────────────────────
   INDEX PAGE
──────────────────────────────────────────── */

function initIndexPage() {
  // Nav links conditional on login state
  const navLinks = document.querySelector('.nav-links');
  if (navLinks && isLoggedIn()) {
    navLinks.innerHTML = `
      <a href="dashboard.html" class="btn btn-primary btn-sm">My Dashboard</a>
    `;
  }

  updateGuestUseBadges();

  // ── Guest Journal ──
  const journalBtn = document.getElementById('try-journal-btn');
  const journalInput = document.getElementById('try-journal-input');
  const journalResp = document.getElementById('try-journal-resp');

  if (journalBtn) {
    journalBtn.addEventListener('click', () => {
      const text = journalInput ? journalInput.value.trim() : '';
      if (!text) {
        showToast('Please write something first 🌿', 'lavender');
        return;
      }
      const used = getGuestUses('journal');
      if (used >= GUEST_LIMIT) {
        showToast('You\'ve used your free tries. Sign up to continue! 🌸', 'rose');
        return;
      }
      incrementGuestUses('journal');
      updateGuestUseBadges();

      if (journalResp) {
        journalResp.textContent = '✨ Your thoughts are safely held. Sign up to save your journal entries and revisit them anytime.';
        journalResp.classList.add('visible');
      }
      showToast('Journal saved temporarily! 🌿');
    });
  }

  // ── Guest AI Reflection ──
  // ── Guest AI Reflection (Real API Connection) ──
const reflectBtn = document.getElementById('try-reflect-btn');
const reflectInput = document.getElementById('try-reflect-input');
const reflectResp = document.getElementById('try-reflect-resp');

if (reflectBtn) {
  // Event listener ko 'async' banana mandatory hai await use karne ke liye
  reflectBtn.addEventListener('click', async () => { 
    const text = reflectInput ? reflectInput.value.trim() : '';
    
    if (!text) {
      showToast('Share a thought to reflect on 🌿', 'lavender');
      return;
    }

    // Guest Limit Check
    const used = getGuestUses('reflection');
    if (used >= GUEST_LIMIT) {
      showToast('Sign up to unlock unlimited AI reflections 🌸', 'rose');
      return;
    }

    reflectBtn.disabled = true;
    reflectBtn.textContent = 'Reflecting…';

    try {
      // Asli API Call - FastAPI backend se connect ho raha hai
      const res = await fetch(`${API_BASE_URL}/ai/mirror`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json' 
          // Note: Guest ke liye hum token nahi bhej rahe hain
        },
        body: JSON.stringify({ content: text }) // Swagger schema matching
      });

      if (!res.ok) throw new Error("API Connection Failed");

      const data = await res.json();
      const reflection = data.reflection; // Backend se aaya hua real AI response

      // Logic tabhi badhega jab API success hogi
      incrementGuestUses('reflection');
      updateGuestUseBadges();

      if (reflectResp) {
        reflectResp.textContent = reflection;
        reflectResp.classList.add('visible');
      }
      showToast('Reflection ready 🌿');

    } catch (err) {
      console.error("Connection Error:", err);
      showToast('The mirror is currently foggy. Try again later. 🌫️', 'rose');
      if (reflectResp) {
        reflectResp.textContent = "Error: Could not connect to the AI engine.";
        reflectResp.classList.add('visible');
      }
    } finally {
      reflectBtn.disabled = false;
      reflectBtn.textContent = 'Get Reflection';
    }
  });
}
}

/* ────────────────────────────────────────────
   LOGIN PAGE
──────────────────────────────────────────── */

async function initLoginPage() {
  const form = document.getElementById('login-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = form.querySelector('[name="email"]').value;
    const password = form.querySelector('[name="password"]').value;

    try {
      const res = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          username: email,
          password: password
        })
      });

      const data = await res.json();
      console.log("LOGIN RESPONSE:", data);

      if (!res.ok) {
        throw new Error(data.detail || 'Login failed');
      }

      localStorage.setItem("access_token", data.access_token);

      console.log("TOKEN AFTER LOGIN:", localStorage.getItem("access_token"));

      localStorage.setItem('md_user', JSON.stringify({
        name: "User",
        token: data.access_token
      }));

      window.location.href = 'dashboard.html';

    } catch (err) {
      showToast(err.message, 'rose');
    }
  });
}

/* ────────────────────────────────────────────
   SIGNUP PAGE
──────────────────────────────────────────── */

async function initSignupPage() { // Added 'async'
  const form = document.getElementById('signup-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
      const res = await fetch(`${API_BASE_URL}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      if (!res.ok) throw new Error("Signup failed");
      showToast('Account created! Sign in now 🌸');
      window.location.href = 'login.html';
    } catch (err) { showToast(err.message, 'rose'); }
  });
}

    
/* ────────────────────────────────────────────
   DASHBOARD PAGE
──────────────────────────────────────────── */

function initDashboard() {
  requireAuth();

  const user = getCurrentUser();
  const nameEl = document.getElementById('user-name');
  const avatarEl = document.getElementById('user-avatar');
  const greetingEl = document.getElementById('dash-greeting');
  const dateEl = document.getElementById('dash-date');

  if (nameEl) nameEl.textContent = user ? user.name : 'Friend';
  if (avatarEl && user) avatarEl.textContent = user.name.charAt(0).toUpperCase();
  if (greetingEl) greetingEl.textContent = getGreeting() + ',';
  if (dateEl) dateEl.textContent = getTodayString();

  // Logout button
  document.querySelectorAll('[data-action="logout"]').forEach(el => {
    el.addEventListener('click', logout);
  });

  initMoodCheckin();
  initJournal();
  initAIReflection();
  initMemories();
  initBreathing();
  initDashStats();
  initJournalList();
}

/* ── MOOD CHECK-IN ── */
function initMoodCheckin() {
  const moodBtns = document.querySelectorAll('.mood-btn');
  const savedMsg = document.getElementById('mood-saved-msg');
  const saved = localStorage.getItem('md_mood_today');

  if (saved) {
    const match = document.querySelector(`.mood-btn[data-mood="${saved}"]`);
    if (match) {
      match.classList.add('selected');
      if (savedMsg) {
        savedMsg.textContent = `Today's mood: ${saved}`;
        savedMsg.classList.add('visible');
      }
    }
  }

  moodBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      moodBtns.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      const mood = btn.dataset.mood;
      localStorage.setItem('md_mood_today', mood);

      if (savedMsg) {
        savedMsg.textContent = `Mood saved: ${mood} ✓`;
        savedMsg.classList.add('visible');
      }
      showToast('Mood recorded 🌿');
    });
  });
}

/* ── JOURNAL ── */
async function initJournal() {
  const saveBtn = document.getElementById('journal-save');

  saveBtn.addEventListener('click', async () => {
    const text = document.getElementById('journal-textarea').value;

    if (!text) return showToast("Nothing to save! 🌿");

    try {
      const res = await fetch(`${API_BASE_URL}/journals/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify({ content: text })
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error("Journal error:", errText);
        return showToast("Save failed ❌", 'rose');
      }

      const data = await res.json();

      showToast("Journal saved 🌿");
      initJournalList();
      document.getElementById('journal-textarea').value = "";

      // optional (only if exists)
      if (typeof initJournalList === "function") {
        initJournalList();
      }

    } catch (err) {
      console.error("Fetch error:", err);
      showToast("Something broke ⚠️", 'rose');
    }
  });
}
async function initJournalList() {
  const container = document.getElementById("journal-list");
  if (!container) return;

  try {
    const res = await fetch(`${API_BASE_URL}/journals/`, {
      headers: getAuthHeader()
    });

    if (!res.ok) {
      console.error("Journal list error:", await res.text());
      return;
    }

    const journals = await res.json();

container.innerHTML = journals.map(j => `
  <div class="journal-item">
    <div class="journal-content">
      <p>${j.content}</p>
      <span class="journal-date">${new Date(j.created_at).toLocaleDateString()}</span>
    </div>

    <div class="menu-container">
      <button class="dots-btn" onclick="toggleMenu(event, '${j.id}')">⋮</button>
      
      <div id="menu-${j.id}" class="dropdown-menu">
        <button onclick="handleEditStart('${j.id}', \`${j.content.replace(/`/g, '\\`')}\`)">✏️ Edit</button>
        <button onclick="handleDeleteJournal('${j.id}')" class="text-rose">🗑️ Delete</button>
        <button onclick="saveMemory('${j.id}')">🌸 Save to Memory</button>
      </div>
    </div>
  </div>
`).join('');

  } catch (err) {
    console.error("Journal list fetch failed:", err);
  }
}
// Menu kholne aur band karne ke liye
function toggleMenu(event, id) {
    event.stopPropagation(); // Card click event ko rokne ke liye
    
    // Pehle saare purane open menus band karo
    document.querySelectorAll('.dropdown-menu').forEach(m => {
        if (m.id !== `menu-${id}`) m.classList.remove('show');
    });

    const menu = document.getElementById(`menu-${id}`);
    menu.classList.toggle('show');
}
// 1. Jab user menu mein 'Edit' dabbae
function handleEditStart(id, content) {
    currentEditingJournalId = id; // ID save karo
    
    const textarea = document.getElementById('journal-textarea');
    textarea.value = content; // Content textarea mein dalo
    textarea.focus();
    
    const saveBtn = document.getElementById('journal-save');
    saveBtn.textContent = "Update Entry"; // Button ka naam badlo
    saveBtn.classList.add('btn-sage-dark'); // Optional color change

    // Scroll top automatically taaki user textarea dekh sake
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// 2. Ab 'journal-save' button ka listener update karein (Critical Fix)
const saveBtn = document.getElementById('journal-save');

if (saveBtn) { // Sirf tabhi listener lagao jab button page par ho
    saveBtn.addEventListener('click', async () => {
        const textarea = document.getElementById('journal-textarea');
        const text = textarea.value.trim();

        if (!text) return showToast("Journal is empty!", "lavender");

        if (currentEditingJournalId) {
            await completeJournalUpdate(currentEditingJournalId, text);
        } else {
            await completeJournalCreate(text);
        }
    });
}

// 3. API call for Updating (PUT)
async function completeJournalUpdate(id, newContent) {
    try {
        const res = await fetch(`${API_BASE_URL}/journals/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
            body: JSON.stringify({ content: newContent }) // Swagger schema matching
        });

        if (!res.ok) throw new Error("Update failed");

        showToast("Journal updated! 🌿");
        resetJournalArea(); // Sab kuch reset karo
        initJournalList(); // Refresh list

    } catch (err) { showToast(err.message, "rose"); }
}

// 4. Helper to reset everything back to "Create" mode
function resetJournalArea() {
    currentEditingJournalId = null; // ID clear karo
    document.getElementById('journal-textarea').value = "";
    const saveBtn = document.getElementById('journal-save');
    saveBtn.textContent = "Save Entry";
    saveBtn.classList.remove('btn-sage-dark');
}

// 5. Delete Logic for Journal (Bonus)
async function handleDeleteJournal(id) {
    if (!confirm("Are you sure? This thought will be gone forever. 🌿")) return;
    try {
        const res = await fetch(`${API_BASE_URL}/journals/${id}`, {
            method: 'DELETE',
            headers: getAuthHeader()
        });
        if (!res.ok) throw new Error("Could not delete");
        showToast("Deleted successfully", "rose");
        initJournalList();
    } catch (err) { showToast(err.message, "rose"); }
}

// Kahin bhi bahar click karne par menu band ho jaye (Blind Spot Fix)
document.addEventListener('click', () => {
    document.querySelectorAll('.dropdown-menu').forEach(m => m.classList.remove('show'));
});
function editJournal(id, content) {
    const textarea = document.getElementById('journal-textarea');
    textarea.value = content; // Purana content dalo
    textarea.focus(); // Focus wahan le jao
    
    // Change "Save Entry" button to "Update"
    const saveBtn = document.getElementById('journal-save');
    saveBtn.textContent = "Update Entry";
    saveBtn.onclick = () => updateJournal(id); // Naya function call karo
    
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Upar scroll karo
}
async function saveMemory(journalId) {
  try {
    console.log("TOKEN:", localStorage.getItem("access_token"));

    const res = await fetch(`${API_BASE_URL}/ai/save-memory?journal_id=${journalId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader()
      }
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Save memory error:", err);
      return showToast("Login required ⚠️", "rose");
    }

    showToast("Saved to memories 🌿");
    initMemories();

  } catch (err) {
    console.error(err);
    showToast("Error saving memory", "rose");
  }
}    
/* ── AI REFLECTION ── */
async function initAIReflection() {
  const reflectBtn = document.getElementById('reflect-btn');
  reflectBtn.addEventListener('click', async () => {
    const prompt = document.getElementById('reflect-prompt').value;
    
    // Guest Limit Check (2 times)
    if (!isLoggedIn()) {
      const used = getGuestUses('reflection');
      if (used >= GUEST_LIMIT) return showToast('Guest limit reached! Sign up 🌸', 'rose');
      incrementGuestUses('reflection');
    }

    try {
      const res = await fetch(`${API_BASE_URL}/ai/mirror`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ content: prompt })
      });
      const data = await res.json();
      document.getElementById('reflect-display').textContent = data.reflection;
    } catch (err) { showToast("Mirror is foggy 🌿", 'rose'); }
  });
}

/* ── MEMORIES ── */
async function initMemories() {
  const list = document.getElementById('memories-list');
  if (!list) return;

  try {
    console.log("Auth header:", getAuthHeader());

    const res = await fetch(`${API_BASE_URL}/ai/all-memories`, {
      headers: getAuthHeader()
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Memory API error:", err);
      list.innerHTML = "Login required ⚠️";
      return;
    }

    const memories = await res.json();

    if (memories.length === 0) {
      list.innerHTML = `<div class="memories-placeholder">
        Start journaling to see memories! 🌿
      </div>`;
      return;
    }

   // script.js (initMemories loop update)
list.innerHTML = memories.map(m => `
  <div class="memory-item animate-fade-up">
    <p>${m.summary}</p>
    <span class="memory-date">
      ${m.created_at ? new Date(m.created_at).toLocaleDateString() : ""}
    </span>
    <button class="delete-mem-btn" onclick="handleDeleteMemory('${m.id}')" title="Delete Memory">
      🗑️
    </button>
  </div>
`).join('');

// Handler function for Memory Delete

  } catch (err) {
    console.error("Memory fetch failed:", err);
    list.innerHTML = "Error loading memories.";
  }
}
async function handleDeleteMemory(id) {
    if (!confirm("Remove this summary from Memories? ✨")) return;

    try {
        const res = await fetch(`${API_BASE_URL}/ai/memories/${id}`, {
            method: 'DELETE',
            headers: getAuthHeader()
        });

        if (!res.ok) {
            const err = await res.text();
            throw new Error(err || "Delete failed");
        }

        showToast("Memory removed ✨");
        initMemories(); // Refresh the history list

    } catch (err) {
        console.error("Memory delete error:", err);
        showToast("Could not remove memory.", "rose");
    }
}

/* ── BREATHING EXERCISE ── */
function initBreathing() {
  const startBtn = document.getElementById('breathing-start');
  const stopBtn = document.getElementById('breathing-stop');
  const circle = document.getElementById('breathing-circle');
  const phaseEl = document.getElementById('breathing-phase');
  const timerEl = document.getElementById('breathing-timer');
  const instrEl = document.getElementById('breathing-instr');
  const progressDots = document.querySelectorAll('.bp-dot');

  if (!startBtn) return;

  const phases = [
    { name: 'Inhale',  label: 'Breathe in',  secs: 4, instr: 'Slowly breathe in through your nose',  cls: 'inhale'  },
    { name: 'Hold',    label: 'Hold',         secs: 4, instr: 'Hold your breath gently',              cls: 'hold'    },
    { name: 'Exhale',  label: 'Breathe out',  secs: 4, instr: 'Slowly exhale through your mouth',    cls: 'exhale'  },
  ];

  let active = false;
  let phaseIdx = 0;
  let secondsLeft = 0;
  let cycleCount = 0;
  let intervalId = null;

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
      if (phaseIdx === 0) {
        cycleCount++;
        showToast(`Cycle ${cycleCount} complete 🌿`);
      }
      setPhase(phaseIdx);
    }
  }

  function startBreathing() {
    active = true;
    phaseIdx = 0;
    cycleCount = 0;
    startBtn.style.display = 'none';
    if (stopBtn) stopBtn.style.display = 'inline-flex';
    setPhase(0);
    tick();
    intervalId = setInterval(tick, 1000);
  }

  function stopBreathing() {
    active = false;
    clearInterval(intervalId);
    startBtn.style.display = 'inline-flex';
    if (stopBtn) stopBtn.style.display = 'none';
    circle.className = 'breathing-circle';
    circle.innerHTML = '🌿';
    if (phaseEl) phaseEl.textContent = 'Ready';
    if (timerEl) timerEl.textContent = '';
    if (instrEl) instrEl.textContent = 'Press start when you\'re ready';
    progressDots.forEach(d => d.classList.remove('active', 'done'));
  }

  startBtn.addEventListener('click', startBreathing);
  if (stopBtn) stopBtn.addEventListener('click', stopBreathing);
}

/* ── DASHBOARD STATS ── */
function initDashStats() {
  const entries = JSON.parse(localStorage.getItem('md_journal_entries') || '[]');
  const streak = parseInt(localStorage.getItem('md_streak') || '1', 10);

  const journalCountEl = document.getElementById('stat-journals');
  const streakEl = document.getElementById('stat-streak');
  const sessionsEl = document.getElementById('stat-sessions');

  if (journalCountEl) journalCountEl.textContent = entries.length;
  if (streakEl) streakEl.textContent = streak;
  if (sessionsEl) {
    const sessions = parseInt(localStorage.getItem('md_sessions') || '0', 10) + 1;
    localStorage.setItem('md_sessions', sessions);
    sessionsEl.textContent = sessions;
  }
}

/* ────────────────────────────────────────────
   PAGE ROUTER
──────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', () => {
  const page = document.body.dataset.page;

  switch (page) {
    case 'index':     initIndexPage();  break;
    case 'login':     initLoginPage();  break;
    case 'signup':    initSignupPage(); break;
    case 'dashboard': initDashboard();  break;
  }

  // Animate cards on scroll (IntersectionObserver)
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.feat-card, .try-card, .stat-card').forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'opacity 0.5s ease, transform 0.5s ease, box-shadow 0.3s ease';
    observer.observe(card);
  });
});
