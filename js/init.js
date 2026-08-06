/**
 * js/init.js — Bootstrap (loaded last)
 * Auth-aware: waits for Firebase auth state before loading data
 */

document.addEventListener('DOMContentLoaded', () => {
  initUIEventListeners();
  initTheme();

  // Listen for Firebase auth state changes
  firebaseAuth.onAuthStateChanged(async (user) => {
    if (user) {
      // Signed in with Google
      currentUser = user;
      isGuestMode = false;

      // Load preferences from localStorage first (fast)
      loadLocalPreferences();
      loadUserStateFromStorage();

      // Try loading from Firestore
      const hadFirestoreData = await loadFromFirestore();

      if (!hadFirestoreData) {
        // First-time user OR Firestore empty — migrate local data up
        await loadAllSyllabusData();
        seedActivityFromState();
        await migrateLocalToFirestore();
      } else {
        // Loaded from Firestore — hydrate syllabus
        await loadAllSyllabusData();
        seedActivityFromState();
      }

      // Show app
      document.getElementById('auth-overlay')?.classList.add('hidden');
      document.getElementById('app')?.classList.remove('hidden');
      showAuthLoading(false);

      // Update header with user info
      updateUserDisplay(user);

      renderCurrentView();
      showToast(`Welcome, ${user.displayName || 'Aspirant'}!`, 'success');
    } else {
      // Not signed in — show auth overlay
      // Don't do anything if guest mode is active
      if (!isGuestMode) {
        document.getElementById('auth-overlay')?.classList.remove('hidden');
        document.getElementById('app')?.classList.add('hidden');
      }
    }
  });
});

function updateUserDisplay(user) {
  // Could show user name/photo in header if desired
  if (user?.displayName) {
    document.title = `ExamPrep — ${user.displayName}`;
  }
}

async function loadAllSyllabusData() {
  try {
    if (window.SYLLABUS_DATA?.ras && window.SYLLABUS_DATA?.gk && window.SYLLABUS_DATA?.sci) {
      rawData.ras = window.SYLLABUS_DATA.ras;
      rawData.gk  = window.SYLLABUS_DATA.gk;
      rawData.sci = window.SYLLABUS_DATA.sci;
    } else {
      const [r, g, s] = await Promise.all([
        fetch('RAS_Pre_Syllabus.json'), fetch('2nd_Grade_GK_Syllabus.json'), fetch('2nd_Grade_Science_Syllabus.json')
      ]);
      rawData.ras = await r.json();
      rawData.gk  = await g.json();
      rawData.sci = await s.json();
    }
  } catch (err) {
    console.error('Error loading syllabus data:', err);
    if (window.SYLLABUS_DATA) {
      rawData.ras = window.SYLLABUS_DATA.ras || rawData.ras;
      rawData.gk  = window.SYLLABUS_DATA.gk  || rawData.gk;
      rawData.sci = window.SYLLABUS_DATA.sci || rawData.sci;
    }
  }

  // Hydrate default state
  ['ras','gk','sci'].forEach(examKey => {
    if (!userState[examKey] || typeof userState[examKey] !== 'object') userState[examKey] = {};
    if (rawData[examKey]?.subjects) {
      rawData[examKey].subjects.forEach(subj => {
        traverseTopics(subj.topics || [], topic => {
          if (topic?.id && !userState[examKey][topic.id]) {
            userState[examKey][topic.id] = {
              completed: topic.completed || false,
              revision: topic.revision || false,
              revisionRound: topic.revisionRound || 0,
              bookmarked: topic.bookmarked || false,
              notes: topic.notes || ''
            };
          }
        });
      });
    }
  });
}
