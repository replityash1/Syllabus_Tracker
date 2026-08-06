/**
 * js/tracker.js — Syllabus Tracker View
 * Renders subject cards, topic tree, handles all checkbox/revision/bookmark events.
 */

// ---- Main render ----

function renderTrackerView() {
  const container = document.getElementById('subjects-container');
  if (!container) return;

  let examData = rawData[activeExam];
  if (!examData && window.SYLLABUS_DATA && window.SYLLABUS_DATA[activeExam]) {
    rawData[activeExam] = window.SYLLABUS_DATA[activeExam];
    examData = rawData[activeExam];
  }

  if (!examData) {
    showShimmer(container);
    return;
  }

  const stats = calculateExamStats(activeExam);
  updateDashboardStatsUI(stats);
  updateContextBar(activeExam, stats.pct);

  container.innerHTML = '';
  if (!examData.subjects || examData.subjects.length === 0) {
    container.innerHTML = '<div class="empty-state"><p>No subjects found for this exam.</p></div>';
    return;
  }

  let totalVisible = 0;
  examData.subjects.forEach((subject, subjIdx) => {
    const subjectStats = calculateSubjectStats(subject, activeExam);
    const treeResult   = renderTopicTreeHTML(subject.topics || [], activeExam, 0);
    if (treeResult.visibleCount === 0 && searchQuery !== '') return;

    totalVisible += treeResult.visibleCount;
    const isOpen = openSubjects[activeExam].has(subjIdx);
    const pct = subjectStats.total > 0 ? Math.round((subjectStats.completed / subjectStats.total) * 100) : 0;
    const strokeDash = 138 - (138 * pct / 100);
    const titleText = currentLang === 'hi'
      ? (subject.title_hi || subject.title_en)
      : (subject.title_en  || subject.title_hi);

    const subjColor = `var(--subj-${subjIdx % 12})`;
    const card = document.createElement('div');
    card.className = `subject-card ${isOpen ? 'open' : ''} ${pct === 100 ? 'all-complete' : ''}`;
    card.setAttribute('data-subj-idx', subjIdx);
    card.style.setProperty('--i', subjIdx);
    card.style.setProperty('--subj-color', subjColor);

    card.innerHTML = `
      <div class="subject-header">
        <div class="subject-ring-wrap">
          <svg viewBox="0 0 52 52">
            <circle class="subj-ring-bg" cx="26" cy="26" r="22"/>
            <circle class="subj-ring-fill" cx="26" cy="26" r="22" style="stroke-dashoffset:${strokeDash}"/>
          </svg>
          <div class="subject-ring-pct">${pct}%</div>
        </div>
        <div class="subject-info">
          <div class="subject-title" title="${escapeHTML(titleText)}">${titleText}</div>
          <div class="subject-meta">
            <span class="subj-completed-count">${subjectStats.completed}</span> of
            <span class="subj-total-count">${subjectStats.total}</span> topics &nbsp;·&nbsp; ${pct}% done
          </div>
        </div>
        <div class="subject-progress-bar-wrap">
          <div class="subject-progress-bar">
            <div class="subject-progress-fill" style="width:${pct}%"></div>
          </div>
        </div>
        <div class="subject-chevron">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
      </div>
      <div class="topics-body">
        <div class="topics-list">${treeResult.html}</div>
      </div>
    `;

    card.querySelector('.subject-header').addEventListener('click', () => {
      const nowOpen = card.classList.toggle('open');
      nowOpen ? openSubjects[activeExam].add(subjIdx) : openSubjects[activeExam].delete(subjIdx);
    });

    container.appendChild(card);
  });

  if (totalVisible === 0 && searchQuery !== '') {
    container.innerHTML = `<div class="no-results">No topics matching "<strong>${escapeHTML(searchQuery)}</strong>"</div>`;
  }

  attachTopicEventListeners();
}

// ---- Shimmer skeleton while loading ----

function showShimmer(container) {
  container.innerHTML = Array.from({ length: 4 }, () => `
    <div class="shimmer-card">
      <div class="shimmer-row">
        <div class="shimmer shimmer-ring"></div>
        <div class="shimmer-lines">
          <div class="shimmer shimmer-line long"></div>
          <div class="shimmer shimmer-line short"></div>
        </div>
      </div>
    </div>
  `).join('');
}

// ---- Topic tree HTML builder ----

function renderTopicTreeHTML(topics, examKey, depth) {
  if (!topics || topics.length === 0) return { html: '', visibleCount: 0 };
  let html = '', visibleCount = 0;

  topics.forEach(topic => {
    const st = userState[examKey][topic.id] || {};
    let passesFilter = true;

    if (activeFilter === 'pending'    && st.completed)                      passesFilter = false;
    if (activeFilter === 'revision'   && getRevRound(st) === 0)             passesFilter = false;
    if (activeFilter === 'bookmarked' && !st.bookmarked)                    passesFilter = false;

    const titleHi = (topic.title_hi || '').toLowerCase();
    const titleEn = (topic.title_en || '').toLowerCase();
    if (searchQuery && !titleHi.includes(searchQuery) && !titleEn.includes(searchQuery)) {
      passesFilter = false;
    }

    const hasChildren  = topic.children && topic.children.length > 0;
    const childResult  = hasChildren ? renderTopicTreeHTML(topic.children, examKey, depth + 1) : { html: '', visibleCount: 0 };

    if (searchQuery && childResult.visibleCount > 0) passesFilter = true;
    if (!passesFilter && childResult.visibleCount === 0) return;

    visibleCount++;
    let displayTitle = currentLang === 'hi' ? (topic.title_hi || topic.title_en) : (topic.title_en || topic.title_hi);
    displayTitle = displayTitle.replace(/^\[(Sr\. Sec|Graduation|10\+2|स्नातक)\]\s*/, '');

    const revRound = getRevRound(st);
    const isExpanded = expandedTopics[examKey].has(topic.id);

    let levelBadge = '';
    if (topic.level === 'sr_sec') levelBadge = `<span class="level-badge sr-sec">10+2</span>`;
    else if (topic.level === 'grad') levelBadge = `<span class="level-badge grad">B.Sc</span>`;

    let revBadge = '';
    if (revRound === 1) revBadge = `<span class="rev-pill r1">R1</span>`;
    else if (revRound === 2) revBadge = `<span class="rev-pill r2">R2</span>`;
    else if (revRound === 3) revBadge = `<span class="rev-pill r3">R3 ✓</span>`;

    let childCountBadge = '';
    if (hasChildren) {
      let cdone = 0;
      topic.children.forEach(c => { if (userState[examKey][c.id]?.completed) cdone++; });
      const allDone = cdone === topic.children.length && topic.children.length > 0;
      childCountBadge = `<span class="subtopic-count-badge ${allDone ? 'all-done' : ''}">${cdone}/${topic.children.length}</span>`;
    }

    const revSvg = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg>`;
    const bkFill = st.bookmarked ? 'currentColor' : 'none';
    const bkSvg  = `<svg width="13" height="13" viewBox="0 0 24 24" fill="${bkFill}" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>`;
    const resCount = (st.resources && st.resources.length) || (st.notes?.trim() ? 1 : 0);
    const hasNotes = resCount > 0;
    const noteSvg = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>`;

    html += `
      <div class="topic-row ${st.completed ? 'completed' : ''} ${hasNotes ? 'has-notes' : ''} depth-${depth} ${hasChildren ? 'is-parent' : 'is-leaf'} ${isExpanded ? 'expanded' : ''}" data-depth="${depth}" data-id="${topic.id}">
        <div class="topic-row-header">
          ${hasChildren
            ? `<button class="expand-btn-badge" title="Expand"><span class="arrow">▶</span></button>`
            : `<span class="leaf-dot"></span>`
          }
          <input type="checkbox" class="topic-checkbox" data-id="${topic.id}" ${st.completed ? 'checked' : ''} />
          ${levelBadge}
          <span class="topic-title">${displayTitle}</span>
          ${revBadge}
          ${childCountBadge}
          <span class="has-notes-dot" title="Has notes"></span>
          <div class="topic-actions">
            <button class="action-btn action-revision ${revRound > 0 ? 'active-revision' : ''}" data-id="${topic.id}" title="Cycle revision round">
              ${revRound > 0 ? `<span style="font-size:10px;font-weight:700">R${revRound}</span>` : revSvg}
            </button>
            <button class="action-btn action-bookmark ${st.bookmarked ? 'active-bookmark' : ''}" data-id="${topic.id}" title="Bookmark">${bkSvg}</button>
            <button class="action-btn action-notes ${hasNotes ? 'has-content' : ''}" data-id="${topic.id}" data-title="${escapeHTML(displayTitle)}" title="Content Hub & Notes">
              ${noteSvg}
              ${hasNotes ? `<span class="res-count-badge">${resCount}</span>` : ''}
            </button>
          </div>
        </div>
        ${hasChildren ? `<div class="topic-children ${isExpanded ? '' : 'hidden'}">${childResult.html}</div>` : ''}
      </div>
    `;
  });

  return { html, visibleCount };
}

// ---- Event listeners for topic rows ----

function attachTopicEventListeners() {
  // Checkbox
  document.querySelectorAll('.topic-checkbox').forEach(cb => {
    cb.addEventListener('change', e => {
      e.stopPropagation();
      const topicId = cb.getAttribute('data-id');
      const isChecked = cb.checked;
      if (isChecked) recordActivityToday();

      setTopicCompletionState(activeExam, topicId, isChecked);

      // Propagate to children if parent
      const row = cb.closest('.topic-row');
      if (row && row.classList.contains('is-parent')) {
        row.querySelectorAll('.topic-children .topic-checkbox').forEach(childCb => {
          childCb.checked = isChecked;
          setTopicCompletionState(activeExam, childCb.getAttribute('data-id'), isChecked);
          childCb.closest('.topic-row')?.classList.toggle('completed', isChecked);
        });
      }
      if (row) row.classList.toggle('completed', isChecked);

      // Propagate UP
      let parentRow = row?.parentElement?.closest('.topic-row');
      while (parentRow) {
        updateParentCompletionFromChildren(parentRow);
        parentRow = parentRow.parentElement?.closest('.topic-row');
      }

      triggerSmartCrossExamSync(activeExam, topicId, isChecked);
      saveUserStateToStorage();

      updateSubjectCardInDOM(row?.closest('.subject-card'));
      updateDashboardStatsUI(calculateExamStats(activeExam));
    });
  });

  // Expand/collapse children
  document.querySelectorAll('.topic-row-header').forEach(header => {
    header.addEventListener('click', e => {
      if (e.target.tagName === 'INPUT' || e.target.closest('.action-btn')) return;
      const row = header.closest('.topic-row');
      const topicId = row.getAttribute('data-id');
      const children = row.querySelector('.topic-children');
      if (!children) return;
      const hidden = children.classList.toggle('hidden');
      row.classList.toggle('expanded', !hidden);
      hidden ? expandedTopics[activeExam].delete(topicId) : expandedTopics[activeExam].add(topicId);

      // Handle expand-btn-badge arrow
      const badge = row.querySelector(':scope > .topic-row-header .expand-btn-badge .arrow');
      if (badge) badge.style.transform = hidden ? '' : 'rotate(90deg)';
    });
  });

  // Revision cycle — in-place, no full rerender
  document.querySelectorAll('.action-revision').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      if (!userState[activeExam][id]) userState[activeExam][id] = {};
      let round = getRevRound(userState[activeExam][id]);
      round = (round + 1) % 4;
      userState[activeExam][id].revisionRound = round;
      userState[activeExam][id].revision = round > 0;

      // In-place: update button icon
      const revSvg = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg>`;
      btn.innerHTML = round > 0 ? `<span style="font-size:10px;font-weight:700">R${round}</span>` : revSvg;
      btn.classList.toggle('active-revision', round > 0);

      // Update rev pill in the same row in-place
      const row = btn.closest('.topic-row');
      if (row) {
        let pill = row.querySelector(':scope > .topic-row-header .rev-pill');
        if (pill) pill.remove();
        if (round > 0) {
          const titles = ['','R1','R2','R3 ✓'];
          const cls    = ['','r1','r2','r3'];
          const newPill = document.createElement('span');
          newPill.className = `rev-pill ${cls[round]}`;
          newPill.textContent = titles[round];
          const titleEl = row.querySelector(':scope > .topic-row-header .topic-title');
          if (titleEl) titleEl.after(newPill);
        }
      }

      saveUserStateToStorage();
    });
  });

  // Bookmark — in-place icon fill update
  document.querySelectorAll('.action-bookmark').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      if (!userState[activeExam][id]) userState[activeExam][id] = {};
      const isBkm = !userState[activeExam][id].bookmarked;
      userState[activeExam][id].bookmarked = isBkm;
      btn.classList.toggle('active-bookmark', isBkm);
      const svg = btn.querySelector('svg');
      if (svg) svg.setAttribute('fill', isBkm ? 'currentColor' : 'none');
      saveUserStateToStorage();
      updateDashboardStatsUI(calculateExamStats(activeExam));
    });
  });

  // Notes modal
  document.querySelectorAll('.action-notes').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      openNotesModal(btn.getAttribute('data-id'), btn.getAttribute('data-title'));
    });
  });
}

// ---- In-place subject card update ----

function updateSubjectCardInDOM(card) {
  if (!card) return;
  const subjIdx = parseInt(card.getAttribute('data-subj-idx'), 10);
  const data = rawData[activeExam];
  if (!data?.subjects?.[subjIdx]) return;

  const s = calculateSubjectStats(data.subjects[subjIdx], activeExam);
  const pct = s.total > 0 ? Math.round((s.completed / s.total) * 100) : 0;
  const strokeDash = 138 - (138 * pct / 100);

  const ring = card.querySelector('.subj-ring-fill');
  if (ring) ring.style.strokeDashoffset = strokeDash;
  const ringPct = card.querySelector('.subject-ring-pct');
  if (ringPct) ringPct.textContent = `${pct}%`;
  const cc = card.querySelector('.subj-completed-count');
  if (cc) cc.textContent = s.completed;
  const fill = card.querySelector('.subject-progress-fill');
  if (fill) fill.style.width = `${pct}%`;
}

// ---- State helpers ----

function setTopicCompletionState(examKey, topicId, completed) {
  if (!userState[examKey][topicId]) userState[examKey][topicId] = {};
  userState[examKey][topicId].completed = completed;
}

function updateParentCompletionFromChildren(parentRow) {
  const parentId  = parentRow.getAttribute('data-id');
  const parentCb  = parentRow.querySelector(':scope > .topic-row-header > .topic-checkbox');
  const childCbs  = parentRow.querySelectorAll(':scope > .topic-children > .topic-row > .topic-row-header > .topic-checkbox');
  if (!childCbs.length) return;

  const total = childCbs.length;
  let done = 0;
  childCbs.forEach(c => { if (c.checked) done++; });
  const allDone = done === total;

  if (parentCb) parentCb.checked = allDone;
  setTopicCompletionState(activeExam, parentId, allDone);
  parentRow.classList.toggle('completed', allDone);

  const badge = parentRow.querySelector(':scope > .topic-row-header > .subtopic-count-badge');
  if (badge) {
    badge.textContent = `${done}/${total}`;
    badge.classList.toggle('all-done', allDone);
  }
}

function triggerSmartCrossExamSync(sourceExam, topicId, completed) {
  const synced = new Set();
  CROSS_EXAM_ID_MAP.forEach(mapping => {
    const inRas = mapping.ras?.includes(topicId);
    const inGk  = mapping.gk?.includes(topicId);
    const inSci = mapping.sci?.includes(topicId);
    const isSource = (sourceExam === 'ras' && inRas) || (sourceExam === 'gk' && inGk) || (sourceExam === 'sci' && inSci);
    if (!isSource) return;

    [{ exam:'ras', ids: mapping.ras }, { exam:'gk', ids: mapping.gk }, { exam:'sci', ids: mapping.sci }]
      .forEach(t => {
        if (t.exam !== sourceExam && t.ids) {
          t.ids.forEach(tid => {
            setTopicCompletionState(t.exam, tid, completed);
            synced.add(EXAMS[t.exam].label);
          });
        }
      });
  });
  if (synced.size > 0 && completed) {
    showToast(`Smart Sync: Completed in ${Array.from(synced).join(', ')}!`);
  }
}

// ---- Dashboard stats UI ----

function updateDashboardStatsUI(stats) {
  const el = id => document.getElementById(id);
  if (el('stat-total-val'))    el('stat-total-val').textContent    = stats.total;
  if (el('stat-done-val'))     el('stat-done-val').textContent     = stats.completed;
  if (el('stat-revision-val')) el('stat-revision-val').textContent = stats.revision;
  if (el('stat-bookmarked-val')) el('stat-bookmarked-val').textContent = stats.bookmarked;
  if (el('overall-pct'))       el('overall-pct').textContent       = `${stats.pct}%`;

  const ring = el('overall-ring');
  if (ring) ring.style.strokeDashoffset = 213.6 - (213.6 * stats.pct / 100);
}

// ---- Context bar below header ----

function updateContextBar(examKey, pct) {
  const bar = document.getElementById('context-bar');
  if (!bar) return;
  const exam = EXAMS[examKey];
  bar.innerHTML = `
    <span class="ctx-badge exam-badge ${exam.badgeClass}">${exam.badgeClass.toUpperCase()}</span>
    <span class="ctx-label">${exam.label}</span>
    <span class="ctx-sep">·</span>
    <span class="ctx-pct" style="color:${exam.color}">${pct}% complete</span>
  `;
}

// ---- Notes & Study Hub Modal ----

function openNotesModal(topicId, title, selectResId = null) {
  openStudyHubModal(topicId, title, selectResId);
}

function closeNotesModal() {
  activeNotesTopicId = null;
  document.getElementById('notes-modal')?.classList.add('hidden');
}
