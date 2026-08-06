/**
 * js/ui.js — UI Events, theme toggle, Firebase Auth, tab switching
 */

// ---- Theme toggle ----
function initTheme() {
  const saved = localStorage.getItem('examprep_theme') || 'dark';
  applyTheme(saved);
}
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const moonIcon = document.getElementById('theme-icon-moon');
  const sunIcon  = document.getElementById('theme-icon-sun');
  if (moonIcon) moonIcon.classList.toggle('hidden', theme === 'light');
  if (sunIcon)  sunIcon.classList.toggle('hidden', theme === 'dark');
  localStorage.setItem('examprep_theme', theme);
}
function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'dark';
  applyTheme(current === 'dark' ? 'light' : 'dark');
  // Sync theme preference
  saveLocalPreferences();
}

// ---- Firebase Auth ----
function showAuthLoading(show) {
  document.getElementById('auth-loading')?.classList.toggle('hidden', !show);
  document.getElementById('auth-buttons')?.classList.toggle('hidden', show);
}

function showAuthError(msg) {
  const el = document.getElementById('auth-error');
  if (el) {
    el.textContent = msg;
    el.classList.toggle('hidden', !msg);
  }
}

async function handleGoogleSignIn() {
  showAuthError('');
  showAuthLoading(true);
  try {
    await firebaseAuth.signInWithPopup(googleProvider);
    // onAuthStateChanged will handle the rest
  } catch (err) {
    console.error('Google sign-in error:', err);
    showAuthLoading(false);
    if (err.code === 'auth/popup-closed-by-user') {
      showAuthError('Sign-in cancelled. Try again.');
    } else if (err.code === 'auth/unauthorized-domain') {
      showAuthError('Domain not authorized. Add localhost to Firebase Console → Auth → Settings → Authorized domains.');
    } else {
      showAuthError(err.message || 'Sign-in failed. Please try again.');
    }
  }
}

async function handleSignOut() {
  try {
    await firebaseAuth.signOut();
    currentUser = null;
    isGuestMode = false;
    document.getElementById('auth-overlay')?.classList.remove('hidden');
    document.getElementById('app')?.classList.add('hidden');
    showAuthLoading(false);
    showAuthError('');
  } catch (err) {
    console.error('Sign-out error:', err);
  }
}

function handleGuestMode() {
  isGuestMode = true;
  currentUser = null;
  document.getElementById('auth-overlay')?.classList.add('hidden');
  document.getElementById('app')?.classList.remove('hidden');
  loadLocalPreferences();
  loadUserStateFromStorage();
  loadAllSyllabusData().then(() => {
    seedActivityFromState();
    renderCurrentView();
  });
}

// ---- Main event wiring ----
function initUIEventListeners() {
  // Auth
  document.getElementById('google-signin-btn')?.addEventListener('click', handleGoogleSignIn);
  document.getElementById('skip-auth-btn')?.addEventListener('click', handleGuestMode);
  document.getElementById('signout-btn')?.addEventListener('click', handleSignOut);

  // Theme toggle
  document.getElementById('theme-toggle')?.addEventListener('click', toggleTheme);
  initTheme();

  // Tab nav
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      switchTab(btn.getAttribute('data-tab'));
    });
  });

  // Language toggle
  document.getElementById('lang-toggle')?.addEventListener('click', () => {
    currentLang = currentLang === 'en' ? 'hi' : 'en';
    updateLangButtonUI();
    saveLocalPreferences();
    renderCurrentView();
  });

  // Exam selector — reset filter to 'all' on switch
  document.querySelectorAll('.exam-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.exam-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeExam = btn.getAttribute('data-exam');
      activeFilter = 'all';
      document.querySelectorAll('.filter-btn').forEach(f => {
        f.classList.toggle('active', f.getAttribute('data-filter') === 'all');
      });
      saveLocalPreferences();
      renderTrackerView();
    });
  });

  // Filter buttons
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = btn.getAttribute('data-filter');
      saveLocalPreferences();
      renderTrackerView();
    });
  });

  // Search — debounced
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    let timer = null;
    searchInput.addEventListener('input', e => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        searchQuery = e.target.value.toLowerCase().trim();
        renderTrackerView();
      }, 280);
    });
  }

  // Breakdown exam select
  document.getElementById('breakdown-exam-select')?.addEventListener('change', function() {
    renderSubjectBreakdown(this.value);
  });

  // Notes modal
  document.getElementById('modal-close')?.addEventListener('click', closeNotesModal);
  document.getElementById('modal-backdrop')?.addEventListener('click', closeNotesModal);
  document.getElementById('btn-save-notes')?.addEventListener('click', saveCurrentTopicNotes);
}

function updateLangButtonUI() {
  const el = document.getElementById('lang-label');
  if (el) el.textContent = currentLang === 'en' ? 'हिं' : 'EN';
}

function switchTab(tab) {
  activeTab = tab;
  document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
  if (tab === 'tracker') {
    document.getElementById('view-tracker')?.classList.remove('hidden');
    renderTrackerView();
  } else if (tab === 'overlap') {
    document.getElementById('view-overlap')?.classList.remove('hidden');
    renderOverlapView();
  } else if (tab === 'analytics') {
    document.getElementById('view-analytics')?.classList.remove('hidden');
    renderAnalyticsView();
  }
}

function renderCurrentView() {
  if (activeTab === 'tracker') renderTrackerView();
  else if (activeTab === 'overlap') renderOverlapView();
  else if (activeTab === 'analytics') renderAnalyticsView();
}
