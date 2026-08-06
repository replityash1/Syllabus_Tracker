/**
 * js/ui.js — UI Events, theme toggle, Firebase Auth, Study Hub & Clean Slate Reader
 */

let activeSelectedResId = null;
let editingResId = null;
let currentResType = 'note';

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
  } catch (err) {
    console.error('Google sign-in error:', err);
    showAuthLoading(false);
    if (err.code === 'auth/popup-closed-by-user') {
      showAuthError('Sign-in cancelled. Try again.');
    } else if (err.code === 'auth/unauthorized-domain') {
      showAuthError('Domain not authorized. Add domain to Firebase Console → Auth → Settings → Authorized domains.');
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

// ---- Study Hub & Clean Slate Reader Modal ----

function openStudyHubModal(topicId, title, selectResId = null) {
  activeNotesTopicId = topicId;
  if (!userState[activeExam][topicId]) userState[activeExam][topicId] = {};
  const st = normalizeTopicState(userState[activeExam][topicId]);

  const modal = document.getElementById('notes-modal');
  const titleEl = document.getElementById('modal-topic-title');
  const breadcrumbEl = document.getElementById('hub-breadcrumb');

  const examLabel = EXAMS[activeExam]?.label || activeExam.toUpperCase();
  if (breadcrumbEl) breadcrumbEl.textContent = `${examLabel} > Topic Content`;
  if (titleEl) titleEl.textContent = title || 'Topic Content Hub';

  if (modal) modal.classList.remove('hidden');

  // Render sidebar
  renderHubSidebar(st.resources, selectResId);

  // Select initial item or show form if empty
  if (st.resources.length > 0) {
    const targetId = selectResId || st.resources[0].id;
    const targetItem = st.resources.find(r => r.id === targetId) || st.resources[0];
    selectResourceItem(targetItem.id);
  } else {
    showResourceEditor(null);
  }

  wireToolbarButtonsOnce();
}

function renderHubSidebar(resources, activeResId = null) {
  const container = document.getElementById('hub-items-list');
  if (!container) return;

  if (resources.length === 0) {
    container.innerHTML = `<div style="font-size:11px;color:var(--text-muted);padding:12px;text-align:center">No content attached yet.<br/>Click <strong>+ Add Content</strong> above.</div>`;
    return;
  }

  const icons = { note: '📝', video: '🎥', image: '🖼️', pdf: '📄', link: '🔗' };
  container.innerHTML = resources.map(r => {
    let visualIcon = `<span class="hub-item-icon">${icons[r.type] || '📄'}</span>`;
    if (r.type === 'video') {
      const ytThumb = getYouTubeThumbnail(r.url);
      if (ytThumb) {
        visualIcon = `<img src="${ytThumb}" class="hub-item-thumb" alt="video thumbnail" />`;
      }
    } else if (r.type === 'image' && r.url) {
      visualIcon = `<img src="${escapeHTML(r.url)}" class="hub-item-thumb" alt="image thumbnail" />`;
    }

    return `
      <div class="hub-item-card ${r.id === activeResId ? 'active' : ''}" data-res-id="${r.id}">
        ${visualIcon}
        <div class="hub-item-info">
          <div class="hub-item-title">${escapeHTML(r.title || 'Untitled')}</div>
          <div class="hub-item-type">${r.type}</div>
        </div>
      </div>
    `;
  }).join('');

  // Attach click listener
  container.querySelectorAll('.hub-item-card').forEach(card => {
    card.addEventListener('click', () => {
      selectResourceItem(card.getAttribute('data-res-id'));
    });
  });
}

function selectResourceItem(resId) {
  activeSelectedResId = resId;
  const st = userState[activeExam][activeNotesTopicId];
  if (!st || !st.resources) return;
  const resItem = st.resources.find(r => r.id === resId);
  if (!resItem) return;

  // Highlight in sidebar
  document.querySelectorAll('.hub-item-card').forEach(card => {
    card.classList.toggle('active', card.getAttribute('data-res-id') === resId);
  });

  // Switch to reader mode view
  document.getElementById('hub-reader-mode')?.classList.remove('hidden');
  document.getElementById('hub-editor-mode')?.classList.add('hidden');

  // Populate reader mode header
  const badge = document.getElementById('reader-item-badge');
  const title = document.getElementById('reader-item-title');
  if (badge) badge.textContent = resItem.type.toUpperCase();
  if (title) title.textContent = resItem.title || 'Untitled';

  // Render Clean Slate Viewing Surface
  renderCleanSlateBody(resItem);
}

function renderMarkdownOrHtml(content) {
  if (!content || !content.trim()) return '<p style="color:var(--text-muted);font-style:italic">Empty note.</p>';
  if (typeof window.marked !== 'undefined' && typeof window.marked.parse === 'function') {
    try {
      return window.marked.parse(content);
    } catch (_) {}
  }
  return content;
}

function parseTimeToSeconds(input) {
  if (!input) return 0;
  if (typeof input === 'number') return input;
  const str = input.toString().trim().toLowerCase();
  if (!str) return 0;

  // Format 1: 1h 25m 23s or 1h25m23s or 25m23s or 45s
  let totalSec = 0;
  const hMatch = str.match(/(\d+)\s*h/);
  const mMatch = str.match(/(\d+)\s*m/);
  const sMatch = str.match(/(\d+)\s*s/);
  if (hMatch || mMatch || sMatch) {
    if (hMatch) totalSec += parseInt(hMatch[1], 10) * 3600;
    if (mMatch) totalSec += parseInt(mMatch[1], 10) * 60;
    if (sMatch) totalSec += parseInt(sMatch[1], 10);
    return totalSec;
  }

  // Format 2: 1:25:23 or 25:23
  if (str.includes(':')) {
    const parts = str.split(':').map(p => parseInt(p, 10) || 0);
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
  }

  // Format 3: pure number (e.g. 5123)
  const num = parseInt(str, 10);
  return isNaN(num) ? 0 : num;
}

function dataUrlToBlob(dataUrl) {
  try {
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  } catch (err) {
    return null;
  }
}

function getSafeViewableUrl(url) {
  if (!url) return '';
  if (url.startsWith('data:')) {
    const blob = dataUrlToBlob(url);
    if (blob) return URL.createObjectURL(blob);
  }
  return url;
}

function renderCleanSlateBody(resItem) {
  const container = document.getElementById('clean-slate-body');
  if (!container) return;

  if (resItem.type === 'note') {
    container.innerHTML = `<div class="clean-slate-rich-text">${renderMarkdownOrHtml(resItem.content)}</div>`;
  } else if (resItem.type === 'video') {
    const embedUrl = parseYouTubeEmbedUrl(resItem.url, resItem.startTime);
    if (embedUrl) {
      container.innerHTML = `
        <div class="media-embed-video">
          <iframe src="${embedUrl}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
        </div>
        ${resItem.content ? `<div class="clean-slate-rich-text" style="margin-top:16px">${renderMarkdownOrHtml(resItem.content)}</div>` : ''}
      `;
    } else {
      container.innerHTML = `
        <div class="media-embed-card">
          <span class="card-icon">🎥</span>
          <div class="card-details">
            <div class="card-title">${escapeHTML(resItem.title)}</div>
            <a href="${escapeHTML(resItem.url)}" target="_blank" rel="noopener" class="card-url">${escapeHTML(resItem.url)} ↗</a>
          </div>
        </div>
        ${resItem.content ? `<div class="clean-slate-rich-text">${renderMarkdownOrHtml(resItem.content)}</div>` : ''}
      `;
    }
  } else if (resItem.type === 'image') {
    const safeUrl = getSafeViewableUrl(resItem.url);
    container.innerHTML = `
      <div class="media-embed-image">
        <a href="${escapeHTML(safeUrl)}" target="_blank" rel="noopener">
          <img src="${escapeHTML(resItem.url)}" alt="${escapeHTML(resItem.title)}" onerror="this.src='https://placehold.co/600x400?text=Image+Load+Failed'" />
        </a>
      </div>
      ${resItem.content ? `<div class="clean-slate-rich-text" style="margin-top:16px">${renderMarkdownOrHtml(resItem.content)}</div>` : ''}
    `;
  } else if (resItem.type === 'pdf') {
    const safeUrl = getSafeViewableUrl(resItem.url);
    container.innerHTML = `
      <div class="media-embed-card">
        <span class="card-icon">📄</span>
        <div class="card-details">
          <div class="card-title">${escapeHTML(resItem.title)}</div>
          <a href="${escapeHTML(safeUrl)}" target="_blank" rel="noopener" class="card-url">Open / Download PDF Document ↗</a>
        </div>
      </div>
      ${resItem.url ? `<object data="${escapeHTML(safeUrl)}" type="application/pdf" class="media-embed-pdf-object"><iframe src="${escapeHTML(safeUrl)}" style="width:100%;height:100%;border:none"></iframe></object>` : ''}
      ${resItem.content ? `<div class="clean-slate-rich-text">${renderMarkdownOrHtml(resItem.content)}</div>` : ''}
    `;
  } else { // link
    container.innerHTML = `
      <div class="media-embed-card">
        <span class="card-icon">🔗</span>
        <div class="card-details">
          <div class="card-title">${escapeHTML(resItem.title)}</div>
          <a href="${escapeHTML(resItem.url)}" target="_blank" rel="noopener" class="card-url">${escapeHTML(resItem.url)} ↗</a>
        </div>
      </div>
      ${resItem.content ? `<div class="clean-slate-rich-text">${renderMarkdownOrHtml(resItem.content)}</div>` : ''}
    `;
  }
}

function showResourceEditor(resToEdit = null) {
  editingResId = resToEdit ? resToEdit.id : null;
  document.getElementById('hub-reader-mode')?.classList.add('hidden');
  document.getElementById('hub-editor-mode')?.classList.remove('hidden');

  const heading = document.getElementById('editor-mode-heading');
  const titleInput = document.getElementById('res-title-input');
  const urlInput = document.getElementById('res-url-input');
  const timeInput = document.getElementById('res-time-input');
  const editor = document.getElementById('notes-editor');

  // Reset file upload info display
  const fileDisplay = document.getElementById('file-name-display');
  if (fileDisplay) {
    fileDisplay.textContent = '';
    fileDisplay.classList.add('hidden');
  }
  const fileInput = document.getElementById('res-file-input');
  if (fileInput) fileInput.value = '';

  if (heading) heading.textContent = resToEdit ? 'Edit Content' : 'Add New Content';
  if (titleInput) titleInput.value = resToEdit ? resToEdit.title : '';
  if (urlInput) urlInput.value = resToEdit ? (resToEdit.url || '') : '';
  if (timeInput) timeInput.value = resToEdit ? (resToEdit.startTime || '') : '';
  if (editor) editor.innerHTML = resToEdit ? (resToEdit.content || '') : '';

  // Set type
  setResourceType(resToEdit ? resToEdit.type : 'note');
}

function setResourceType(type) {
  currentResType = type;
  document.querySelectorAll('.type-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-type') === type);
  });

  const urlGroup = document.getElementById('res-url-group');
  const timeGroup = document.getElementById('res-time-group');
  const noteGroup = document.getElementById('res-note-group');
  const urlLabel = document.getElementById('res-url-label');
  const urlInput = document.getElementById('res-url-input');
  const urlHint = document.getElementById('res-url-hint');
  const fileOpt = document.getElementById('file-upload-option');

  if (type === 'note') {
    urlGroup?.classList.add('hidden');
    timeGroup?.classList.add('hidden');
    noteGroup?.classList.remove('hidden');
  } else {
    urlGroup?.classList.remove('hidden');
    noteGroup?.classList.remove('hidden');

    if (type === 'video') {
      timeGroup?.classList.remove('hidden');
      if (fileOpt) fileOpt.classList.add('hidden');
      if (urlLabel) urlLabel.textContent = 'YouTube Video URL';
      if (urlInput) urlInput.placeholder = 'https://www.youtube.com/watch?v=...';
      if (urlHint) urlHint.textContent = 'Paste a YouTube video link to play it directly in the app';
    } else {
      timeGroup?.classList.add('hidden');
      if (fileOpt) fileOpt.classList.remove('hidden');

      if (type === 'image') {
        if (urlLabel) urlLabel.textContent = 'Image URL or Upload File';
        if (urlInput) urlInput.placeholder = 'https://example.com/image.jpg or click Browse Local File';
        if (urlHint) urlHint.textContent = 'Paste an image URL or click Browse Local File';
      } else if (type === 'pdf') {
        if (urlLabel) urlLabel.textContent = 'PDF Document / Upload File';
        if (urlInput) urlInput.placeholder = 'https://example.com/doc.pdf or click Browse Local File';
        if (urlHint) urlHint.textContent = 'Paste a PDF link or click Browse Local File';
      } else {
        if (urlLabel) urlLabel.textContent = 'Web Link';
        if (urlInput) urlInput.placeholder = 'https://example.com';
        if (urlHint) urlHint.textContent = 'Paste any web link or reference article';
      }
    }
  }
}

function saveResourceItem() {
  if (!activeNotesTopicId) return;
  const titleInput = document.getElementById('res-title-input');
  const urlInput = document.getElementById('res-url-input');
  const timeInput = document.getElementById('res-time-input');
  const editor = document.getElementById('notes-editor');

  const title = titleInput?.value.trim() || (currentResType === 'note' ? 'General Notes' : 'Resource Link');
  const url = urlInput?.value.trim() || '';
  const startTime = timeInput?.value.trim() || '';
  const content = editor?.innerHTML || '';

  const st = userState[activeExam][activeNotesTopicId] || {};
  if (!Array.isArray(st.resources)) st.resources = [];

  if (editingResId) {
    const idx = st.resources.findIndex(r => r.id === editingResId);
    if (idx !== -1) {
      st.resources[idx] = { ...st.resources[idx], title, type: currentResType, url, startTime, content };
    }
  } else {
    const newItem = {
      id: 'res_' + Date.now(),
      title,
      type: currentResType,
      url,
      startTime,
      content,
      createdAt: new Date().toISOString()
    };
    st.resources.push(newItem);
    editingResId = newItem.id;
  }

  // Backwards compatibility sync for st.notes
  if (st.resources.length > 0) {
    const firstNote = st.resources.find(r => r.type === 'note');
    st.notes = firstNote ? firstNote.content : '';
  }

  saveUserStateToStorage();
  showToast('Content saved!');

  // Refresh modal UI
  renderHubSidebar(st.resources, editingResId || activeSelectedResId);
  selectResourceItem(editingResId || activeSelectedResId);

  // Update topic row badge in DOM
  updateTopicRowResourceBadgeDOM(activeNotesTopicId, st.resources.length);
}

function showConfirmDialog(title, message, confirmText = 'Delete') {
  return new Promise((resolve) => {
    const modal = document.getElementById('confirm-modal');
    const titleEl = document.getElementById('confirm-title');
    const msgEl = document.getElementById('confirm-message');
    const okBtn = document.getElementById('confirm-btn-ok');
    const cancelBtn = document.getElementById('confirm-btn-cancel');
    const backdrop = document.getElementById('confirm-backdrop');

    if (titleEl) titleEl.textContent = title || 'Confirm Delete';
    if (msgEl) msgEl.textContent = message || 'Are you sure you want to delete this item?';
    if (okBtn) okBtn.textContent = confirmText;

    if (modal) modal.classList.remove('hidden');

    const cleanup = (result) => {
      if (modal) modal.classList.add('hidden');
      okBtn?.removeEventListener('click', onOk);
      cancelBtn?.removeEventListener('click', onCancel);
      backdrop?.removeEventListener('click', onCancel);
      resolve(result);
    };

    const onOk = () => cleanup(true);
    const onCancel = () => cleanup(false);

    okBtn?.addEventListener('click', onOk);
    cancelBtn?.addEventListener('click', onCancel);
    backdrop?.addEventListener('click', onCancel);
  });
}

async function deleteResourceItem() {
  if (!activeNotesTopicId || !activeSelectedResId) return;
  const st = userState[activeExam][activeNotesTopicId];
  if (!st || !st.resources) return;

  const itemToDelete = st.resources.find(r => r.id === activeSelectedResId);
  const itemTitle = itemToDelete ? `"${itemToDelete.title || 'this item'}"` : 'this item';

  const confirmed = await showConfirmDialog('Delete Content?', `Are you sure you want to delete ${itemTitle}? This action cannot be undone.`, 'Delete');
  if (!confirmed) return;

  st.resources = st.resources.filter(r => r.id !== activeSelectedResId);
  
  // Sync legacy notes
  const firstNote = st.resources.find(r => r.type === 'note');
  st.notes = firstNote ? firstNote.content : '';

  saveUserStateToStorage();
  showToast('Item deleted.');

  updateTopicRowResourceBadgeDOM(activeNotesTopicId, st.resources.length);

  if (st.resources.length > 0) {
    renderHubSidebar(st.resources, st.resources[0].id);
    selectResourceItem(st.resources[0].id);
  } else {
    renderHubSidebar([]);
    showResourceEditor(null);
  }
}

function updateTopicRowResourceBadgeDOM(topicId, count) {
  const row = document.querySelector(`.topic-row[data-id="${topicId}"]`);
  if (!row) return;
  row.classList.toggle('has-notes', count > 0);
  const btn = row.querySelector('.action-notes');
  if (btn) {
    btn.classList.toggle('has-content', count > 0);
    let badge = btn.querySelector('.res-count-badge');
    if (count > 0) {
      if (!badge) { badge = document.createElement('span'); badge.className = 'res-count-badge'; btn.appendChild(badge); }
      badge.textContent = count;
    } else if (badge) {
      badge.remove();
    }
  }
}

function getYouTubeVideoId(url) {
  if (!url) return null;
  const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts|live)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regExp);
  return match ? match[1] : null;
}

function parseYouTubeEmbedUrl(url, startTime = 0) {
  const id = getYouTubeVideoId(url);
  if (!id) return null;
  const seconds = parseTimeToSeconds(startTime);
  const startParam = seconds > 0 ? `&start=${seconds}` : '';
  return `https://www.youtube.com/embed/${id}?autohide=1&modestbranding=1&rel=0&enablejsapi=1${startParam}`;
}

function getYouTubeThumbnail(url) {
  const id = getYouTubeVideoId(url);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
}

function wireToolbarButtonsOnce() {
  const modal = document.getElementById('notes-modal');
  if (!modal || modal._toolbarWired) return;
  modal._toolbarWired = true;

  modal.querySelectorAll('.toolbar-btn').forEach(btn => {
    btn.addEventListener('mousedown', e => {
      e.preventDefault();
      const cmd = btn.getAttribute('data-cmd');
      const val = btn.getAttribute('data-val') || null;
      document.execCommand(cmd, false, val);
    });
  });

  // Local File Upload Listener (Images & PDFs)
  const fileInput = document.getElementById('res-file-input');
  const browseBtn = document.getElementById('btn-browse-file');
  if (browseBtn && fileInput) {
    browseBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) return;

      if (file.size > 3.5 * 1024 * 1024) {
        showToast('File size must be under 3.5 MB for database sync', 'warning');
        e.target.value = '';
        return;
      }

      const display = document.getElementById('file-name-display');
      if (display) {
        display.textContent = `Attached: ${file.name} (${(file.size / 1024).toFixed(0)} KB)`;
        display.classList.remove('hidden');
      }

      const reader = new FileReader();
      reader.onload = ev => {
        const dataUrl = ev.target.result;
        const urlInput = document.getElementById('res-url-input');
        if (urlInput) urlInput.value = dataUrl;

        const titleInput = document.getElementById('res-title-input');
        if (titleInput && !titleInput.value) {
          titleInput.value = file.name.replace(/\.[^/.]+$/, "");
        }

        // Auto set type if image or pdf
        if (file.type.startsWith('image/')) setResourceType('image');
        else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) setResourceType('pdf');
      };
      reader.readAsDataURL(file);
    });
  }

  const headingSelect = document.getElementById('heading-select');
  if (headingSelect) {
    headingSelect.addEventListener('change', e => {
      const val = e.target.value;
      document.execCommand('formatBlock', false, val || 'DIV');
      e.target.value = '';
      document.getElementById('notes-editor')?.focus();
    });
  }

  // Type selector buttons
  modal.querySelectorAll('.type-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      setResourceType(btn.getAttribute('data-type'));
    });
  });

  // Hub Header actions
  document.getElementById('btn-add-resource')?.addEventListener('click', () => showResourceEditor(null));
  document.getElementById('btn-edit-item')?.addEventListener('click', () => {
    const st = userState[activeExam][activeNotesTopicId];
    const resItem = st?.resources?.find(r => r.id === activeSelectedResId);
    if (resItem) showResourceEditor(resItem);
  });
  document.getElementById('btn-delete-item')?.addEventListener('click', deleteResourceItem);
  document.getElementById('btn-cancel-editor')?.addEventListener('click', () => {
    const st = userState[activeExam][activeNotesTopicId];
    if (st?.resources?.length > 0) {
      selectResourceItem(activeSelectedResId || st.resources[0].id);
    } else {
      closeNotesModal();
    }
  });
  document.getElementById('btn-save-resource')?.addEventListener('click', saveResourceItem);
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

  // Notes / Study Hub modal close
  document.getElementById('modal-close')?.addEventListener('click', closeNotesModal);
  document.getElementById('modal-backdrop')?.addEventListener('click', closeNotesModal);
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
