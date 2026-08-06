/**
 * js/utils.js — Shared utility functions
 */

/** Recursively traverse all topic nodes in a subjects array */
function traverseTopics(items, callback) {
  if (!items) return;
  items.forEach(item => {
    if (!item) return;
    callback(item);
    if (item.children && item.children.length > 0) traverseTopics(item.children, callback);
  });
}

/** Safe HTML attribute escaping */
function escapeHTML(str) {
  return String(str || '').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/** Get normalised revision round (handles legacy .revision bool) */
function getRevRound(st) {
  if (!st) return 0;
  return st.revisionRound || (st.revision ? 1 : 0);
}

// ---- Stats helpers ----

function calculateExamStats(examKey) {
  let total = 0, completed = 0, revision = 0, bookmarked = 0;
  const data = rawData[examKey];
  if (!data || !data.subjects) return { total, completed, revision, bookmarked, pct: 0 };

  data.subjects.forEach(subj => {
    traverseTopics(subj.topics || [], topic => {
      total++;
      const st = userState[examKey][topic.id];
      if (st) {
        if (st.completed) completed++;
        if (getRevRound(st) > 0) revision++;
        if (st.bookmarked) bookmarked++;
      }
    });
  });

  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  return { total, completed, revision, bookmarked, pct };
}

function calculateSubjectStats(subject, examKey) {
  let total = 0, completed = 0;
  traverseTopics(subject.topics || [], topic => {
    total++;
    const st = userState[examKey][topic.id];
    if (st && st.completed) completed++;
  });
  return { total, completed };
}

// ---- Toast notification ----

function showToast(message, type = 'success') {
  let tc = document.getElementById('toast-container');
  if (!tc) {
    tc = document.createElement('div');
    tc.id = 'toast-container';
    tc.className = 'toast-container';
    document.body.appendChild(tc);
  }
  const toast = document.createElement('div');
  toast.className = `toast-message toast-${type}`;
  toast.innerHTML = message;
  tc.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 350);
  }, 3500);
}
