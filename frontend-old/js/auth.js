const Auth = {
  currentUser: null,
  isAuthenticated: false,
  isLoginMode: true, // Track if modal is in login or signup mode
async init() {
    const token = this.getToken();
    if (token) {
        // Sirf token check karein, getMe() agar backend mein nahi hai toh ise skip karein
        this.isAuthenticated = true; 
        this.updateUI(true);
        return true;
    }
    this.updateUI(false);
    return false;
},

 // auth.js
   // auth.js snippet
async handleAuth(email, password) {
    const isSignup = App.authMode === 'signup';
    // API call based on mode
    const response = isSignup 
        ? await API.auth.signup(email, password) 
        : await API.auth.login(email, password);

    if (isSignup) {
        // Signup success, par token nahi mila (kyunki login zaroori hai)
        return { success: true, isSignup: true };
    }

    // Login success: Token save karein
    if (response && response.access_token) {
        localStorage.setItem('authToken', response.access_token);
        this.isAuthenticated = true; // State update karein
        return { success: true, isSignup: false };
    }
    
    throw new Error("Invalid credentials or server error");
},


  logout() {
    this.removeToken();
    this.currentUser = null;
    this.isAuthenticated = false;
    window.location.reload(); // Refresh to reset all views
  },

  setUser(userData) {
    this.currentUser = userData;
    this.isAuthenticated = true;
  },

  // UI Sync Logic for index.html
  updateUI(isAuthenticated) {
    const guestActions = document.getElementById('guestActions');
    const authActions = document.getElementById('authActions');
    const headerNav = document.getElementById('headerNav');
    const journalLocked = document.getElementById('journalLocked');
    const journalList = document.getElementById('journalList');

    if (isAuthenticated) {
      if (guestActions) guestActions.style.display = 'none';
      if (authActions) authActions.style.display = 'block';
      if (headerNav) headerNav.style.display = 'flex';
      if (journalLocked) journalLocked.style.display = 'none';
      if (journalList) journalList.style.display = 'block';
    } else {
      if (guestActions) guestActions.style.display = 'block';
      if (authActions) authActions.style.display = 'none';
      if (headerNav) headerNav.style.display = 'none';
      if (journalLocked) journalLocked.style.display = 'block';
      if (journalList) journalList.style.display = 'none';
    }
  },

  getToken() { return localStorage.getItem('authToken'); },
  setToken(token) { localStorage.setItem('authToken', token); },
  removeToken() { localStorage.removeItem('authToken'); },
};
