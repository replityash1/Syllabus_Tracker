/**
 * js/storage.js — Dual persistence: localStorage (always) + Firestore (when signed in)
 */

// ---- Preferences ----
function loadLocalPreferences() {
  try {
    const pref = JSON.parse(localStorage.getItem('examprep_pref') || '{}');
    currentLang  = pref.lang       || 'en';
    activeExam   = ['ras','gk','sci'].includes(pref.activeExam)   ? pref.activeExam   : 'ras';
    activeFilter = ['all','pending','revision','bookmarked'].includes(pref.activeFilter) ? pref.activeFilter : 'all';
  } catch (_) {}
  updateLangButtonUI();
}

function saveLocalPreferences() {
  localStorage.setItem('examprep_pref', JSON.stringify({ lang: currentLang, activeExam, activeFilter }));
  // Sync prefs to Firestore
  if (!isGuestMode && currentUser) {
    firestoreWriteDebounced('preferences', { lang: currentLang, activeExam, activeFilter, theme: localStorage.getItem('examprep_theme') || 'dark' });
  }
}

// ---- User State (localStorage) ----
function normalizeTopicState(st) {
  if (!st || typeof st !== 'object') st = {};
  if (!Array.isArray(st.resources)) st.resources = [];
  // Migrate legacy single note string if present and not yet converted
  if (st.notes && typeof st.notes === 'string' && st.notes.trim() !== '') {
    const hasNotesItem = st.resources.some(r => r.type === 'note');
    if (!hasNotesItem) {
      st.resources.unshift({
        id: 'res_' + Date.now() + '_legacy',
        title: 'General Notes',
        type: 'note',
        content: st.notes,
        createdAt: new Date().toISOString()
      });
    }
  }
  return st;
}

function loadUserStateFromStorage() {
  ['ras','gk','sci'].forEach(key => {
    userState[key] = {};
    try {
      const parsed = JSON.parse(localStorage.getItem(`examprep_state_${key}`) || 'null');
      if (parsed && typeof parsed === 'object') {
        Object.keys(parsed).forEach(tid => {
          parsed[tid] = normalizeTopicState(parsed[tid]);
        });
        userState[key] = parsed;
      }
    } catch (_) {}
  });
}

function saveUserStateToStorage() {
  // Always save to localStorage (offline fallback)
  ['ras','gk','sci'].forEach(key =>
    localStorage.setItem(`examprep_state_${key}`, JSON.stringify(userState[key]))
  );
  // Sync to Firestore
  if (!isGuestMode && currentUser) {
    ['ras','gk','sci'].forEach(key => {
      firestoreWriteDebounced(`state_${key}`, userState[key]);
    });
  }
}

// ---- Activity Heatmap tracking ----
function recordActivityToday(count = 1) {
  const today = new Date().toISOString().slice(0, 10);
  const stored = JSON.parse(localStorage.getItem('examprep_activity') || '{}');
  stored[today] = (stored[today] || 0) + count;
  localStorage.setItem('examprep_activity', JSON.stringify(stored));
  // Sync to Firestore
  if (!isGuestMode && currentUser) {
    firestoreWriteDebounced('activity', stored);
  }
}

function getActivityData() {
  return JSON.parse(localStorage.getItem('examprep_activity') || '{}');
}

function seedActivityFromState() {
  const existing = getActivityData();
  if (Object.keys(existing).length > 0) return;
  let total = 0;
  ['ras','gk','sci'].forEach(ex => {
    Object.values(userState[ex]).forEach(st => { if (st && st.completed) total++; });
  });
  if (total > 0) {
    const today = new Date().toISOString().slice(0, 10);
    const stored = {};
    stored[today] = total;
    localStorage.setItem('examprep_activity', JSON.stringify(stored));
  }
}

// ---- Firestore Sync Layer ----

// Debounce map: prevents spamming Firestore on rapid changes
const _firestoreTimers = {};
function firestoreWriteDebounced(docName, data) {
  if (!currentUser) return;
  clearTimeout(_firestoreTimers[docName]);
  _firestoreTimers[docName] = setTimeout(() => {
    const uid = currentUser.uid;
    firebaseDb.collection('users').doc(uid).collection('data').doc(docName)
      .set(data, { merge: true })
      .catch(err => console.warn(`Firestore write failed (${docName}):`, err));
  }, 800); // 800ms debounce
}

/**
 * Load all user data from Firestore into localStorage + state.
 * Called once after sign-in.
 */
async function loadFromFirestore() {
  if (!currentUser) return false;
  const uid = currentUser.uid;
  try {
    const snapshot = await firebaseDb.collection('users').doc(uid).collection('data').get();
    if (snapshot.empty) return false; // No data in Firestore (first-time user)

    let loaded = false;
    snapshot.forEach(doc => {
      const id = doc.id;
      const d = doc.data();
      if (id === 'state_ras' && d) { Object.keys(d).forEach(k => d[k] = normalizeTopicState(d[k])); userState.ras = d; localStorage.setItem('examprep_state_ras', JSON.stringify(d)); loaded = true; }
      if (id === 'state_gk'  && d) { Object.keys(d).forEach(k => d[k] = normalizeTopicState(d[k])); userState.gk  = d; localStorage.setItem('examprep_state_gk',  JSON.stringify(d)); loaded = true; }
      if (id === 'state_sci' && d) { Object.keys(d).forEach(k => d[k] = normalizeTopicState(d[k])); userState.sci = d; localStorage.setItem('examprep_state_sci', JSON.stringify(d)); loaded = true; }
      if (id === 'activity'  && d) { localStorage.setItem('examprep_activity', JSON.stringify(d)); loaded = true; }
      if (id === 'preferences' && d) {
        if (d.lang) currentLang = d.lang;
        if (d.activeExam) activeExam = d.activeExam;
        if (d.activeFilter) activeFilter = d.activeFilter;
        if (d.theme) { localStorage.setItem('examprep_theme', d.theme); applyTheme(d.theme); }
        saveLocalPreferences();
        loaded = true;
      }
    });
    return loaded;
  } catch (err) {
    console.warn('Firestore load failed, using localStorage:', err);
    return false;
  }
}

/**
 * Upload all current localStorage data to Firestore.
 * Called when a user signs in for the first time and has local data.
 */
async function migrateLocalToFirestore() {
  if (!currentUser) return;
  const uid = currentUser.uid;
  const batch = firebaseDb.batch();
  const col = firebaseDb.collection('users').doc(uid).collection('data');

  ['ras','gk','sci'].forEach(key => {
    if (Object.keys(userState[key]).length > 0) {
      batch.set(col.doc(`state_${key}`), userState[key]);
    }
  });

  const activity = getActivityData();
  if (Object.keys(activity).length > 0) {
    batch.set(col.doc('activity'), activity);
  }

  batch.set(col.doc('preferences'), {
    lang: currentLang,
    activeExam,
    activeFilter,
    theme: localStorage.getItem('examprep_theme') || 'dark'
  });

  try {
    await batch.commit();
    console.log('Migrated localStorage → Firestore');
  } catch (err) {
    console.warn('Migration to Firestore failed:', err);
  }
}
