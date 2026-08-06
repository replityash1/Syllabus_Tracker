/**
 * js/analytics.js — Analytics Dashboard View
 */

function renderAnalyticsView() {
  seedActivityFromState();
  renderAnalyticsHero();
  renderProgressSparkline();
  renderExamArcs();
  const sel = document.getElementById('breakdown-exam-select');
  renderSubjectBreakdown(sel ? sel.value : 'ras');
  renderCompletionBars();
  renderRevisionDistribution();
  renderStudyStreak();
  renderHeatmap();
  renderVelocity();
  renderEstimatedCompletion();
  renderBookmarkNotes();
}

// ---- Hero Metrics ----
function renderAnalyticsHero() {
  const grid = document.getElementById('analytics-hero-grid');
  if (!grid) return;

  const all = { ras: calculateExamStats('ras'), gk: calculateExamStats('gk'), sci: calculateExamStats('sci') };
  const totalAll = all.ras.total + all.gk.total + all.sci.total;
  const doneAll  = all.ras.completed + all.gk.completed + all.sci.completed;
  const overallPct = totalAll > 0 ? Math.round((doneAll / totalAll) * 100) : 0;

  let r1=0,r2=0,r3=0,bmAll=0,notesAll=0;
  ['ras','gk','sci'].forEach(ex => {
    Object.values(userState[ex]).forEach(st => {
      if (!st) return;
      const rr = getRevRound(st);
      if (rr===1) r1++; else if (rr===2) r2++; else if (rr>=3) r3++;
      if (st.bookmarked) bmAll++;
      if (st.notes?.trim()) notesAll++;
    });
  });

  const revScore = totalAll > 0 ? Math.round(((r1*0.3+r2*0.6+r3)/Math.max(totalAll,1))*100) : 0;
  const readiness = Math.min(100, Math.round(overallPct*0.7 + revScore*0.3));
  const readyOffset = 213.6 - (213.6 * readiness / 100);

  grid.innerHTML = `
    <div class="hero-metric-card card-completion">
      <div class="hero-icon ic-completion">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
      </div>
      <div class="hero-val">${overallPct}%</div>
      <div class="hero-lbl">Overall Completion</div>
      <div class="hero-sub">${doneAll} of ${totalAll} topics</div>
    </div>
    <div class="hero-metric-card card-revision">
      <div class="hero-icon ic-revision">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg>
      </div>
      <div class="hero-val">${r1+r2+r3}</div>
      <div class="hero-lbl">Topics Revised</div>
      <div class="hero-sub">R1:${r1} · R2:${r2} · R3:${r3}</div>
    </div>
    <div class="hero-metric-card card-readiness">
      <div class="hero-readiness-ring">
        <svg viewBox="0 0 80 80">
          <circle class="readiness-ring-bg" cx="40" cy="40" r="34"/>
          <circle class="readiness-ring-fill" cx="40" cy="40" r="34" style="stroke-dashoffset:${readyOffset}"/>
        </svg>
        <span class="readiness-ring-pct">${readiness}%</span>
      </div>
      <div class="hero-lbl">Exam Readiness</div>
      <div class="hero-sub">${r3} mastered topics</div>
    </div>
    <div class="hero-metric-card card-bookmarks">
      <div class="hero-icon ic-bookmarks">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>
      </div>
      <div class="hero-val amber">${bmAll}</div>
      <div class="hero-lbl">Bookmarks</div>
      <div class="hero-sub">${notesAll} with notes</div>
    </div>
  `;
}

// ---- Exam Arc Rings ----
function renderExamArcs() {
  const row = document.getElementById('exam-arcs-row');
  if (!row) return;

  const exams = [
    { key:'ras', label:'RAS Pre 2026',     badge:'RAS', arcCls:'ras-arc', barCls:'ras-bar' },
    { key:'gk',  label:'2nd Grade GK',     badge:'GK',  arcCls:'gk-arc',  barCls:'gk-bar' },
    { key:'sci', label:'2nd Grade Science', badge:'SC',  arcCls:'sci-arc', barCls:'sci-bar' }
  ];

  row.innerHTML = exams.map(ex => {
    const s = calculateExamStats(ex.key);
    const circ = 298;
    const offset = circ - (circ * s.pct / 100);
    let r1=0,r2=0,r3=0;
    Object.values(userState[ex.key]).forEach(st => {
      if (!st) return;
      const rr = getRevRound(st);
      if (rr===1) r1++; else if (rr===2) r2++; else if (rr>=3) r3++;
    });
    const revScore = s.total > 0 ? Math.round(((r1*0.3+r2*0.6+r3)/Math.max(s.total,1))*100) : 0;
    const readiness = Math.min(100, Math.round(s.pct*0.7+revScore*0.3));

    return `
      <div class="exam-arc-card">
        <div class="arc-ring-wrap">
          <svg viewBox="0 0 110 110">
            <circle class="arc-ring-bg" cx="55" cy="55" r="47.5"/>
            <circle class="arc-ring-fill ${ex.arcCls}" cx="55" cy="55" r="47.5" style="stroke-dashoffset:${offset}"/>
          </svg>
          <div class="arc-center"><span class="arc-pct">${s.pct}%</span></div>
        </div>
        <div class="arc-label-below"><span class="exam-badge ${ex.key}">${ex.badge}</span> ${ex.label}</div>
        <div class="arc-sublabel">${s.completed} / ${s.total} topics</div>
        <div class="arc-readiness-bar-wrap" title="Readiness ${readiness}%">
          <div class="arc-readiness-bar-fill ${ex.barCls}" style="width:${readiness}%"></div>
        </div>
        <div class="arc-sublabel">Readiness: ${readiness}%</div>
      </div>
    `;
  }).join('');
}

// ---- Subject Breakdown Bars ----
function renderSubjectBreakdown(examKey) {
  const container = document.getElementById('subject-breakdown-container');
  if (!container) return;
  const data = rawData[examKey];
  if (!data?.subjects) {
    container.innerHTML = '<p class="empty-muted">No data loaded yet.</p>';
    return;
  }
  const colors = { ras:'var(--ras)', gk:'var(--gk)', sci:'var(--sci)' };
  container.innerHTML = data.subjects.map((subj, i) => {
    const st = calculateSubjectStats(subj, examKey);
    const pct = st.total > 0 ? Math.round((st.completed/st.total)*100) : 0;
    const title = currentLang==='hi' ? (subj.title_hi||subj.title_en) : (subj.title_en||subj.title_hi);
    return `
      <div class="subject-breakdown-row" style="animation-delay:${i*60}ms">
        <div class="sbr-info">
          <span class="sbr-title">${title}</span>
          <span class="sbr-stats">${st.completed}/${st.total} · ${pct}%</span>
        </div>
        <div class="sbr-bar-bg">
          <div class="sbr-bar-fill" style="width:${pct}%;background:${colors[examKey]}"></div>
        </div>
      </div>
    `;
  }).join('');
}

// ---- Revision Distribution ----
function renderRevisionDistribution() {
  const grid = document.getElementById('revision-distribution-grid');
  if (!grid) return;
  let r1=0,r2=0,r3=0,total=0;
  ['ras','gk','sci'].forEach(ex => {
    Object.values(userState[ex]).forEach(st => {
      if (!st) return; total++;
      const rr = getRevRound(st);
      if (rr===1) r1++; else if (rr===2) r2++; else if (rr>=3) r3++;
    });
  });
  const p = (v) => total > 0 ? Math.round((v/total)*100) : 0;
  grid.innerHTML = `
    <div class="rev-dist-card r1-dist">
      <div class="dist-header"><span class="rev-badge r1">R1</span> 1st Round</div>
      <div class="dist-val">${r1}</div>
      <div class="dist-sub">${p(r1)}% of all topics</div>
      <div class="dist-bar-wrap"><div class="dist-bar-fill" style="width:${p(r1)}%"></div></div>
    </div>
    <div class="rev-dist-card r2-dist">
      <div class="dist-header"><span class="rev-badge r2">R2</span> 2nd Round</div>
      <div class="dist-val">${r2}</div>
      <div class="dist-sub">${p(r2)}% of all topics</div>
      <div class="dist-bar-wrap"><div class="dist-bar-fill" style="width:${p(r2)}%"></div></div>
    </div>
    <div class="rev-dist-card r3-dist">
      <div class="dist-header"><span class="rev-badge r3">R3</span> Mastered</div>
      <div class="dist-val">${r3}</div>
      <div class="dist-sub">${p(r3)}% of all topics</div>
      <div class="dist-bar-wrap"><div class="dist-bar-fill" style="width:${p(r3)}%"></div></div>
    </div>
  `;
}

// ---- Heatmap ----
function renderHeatmap() {
  const grid = document.getElementById('heatmap-grid');
  if (!grid) return;
  const activity = getActivityData();
  const today = new Date();
  const hasAny = Object.keys(activity).length > 0;

  if (!hasAny) {
    grid.innerHTML = '<div class="heatmap-empty">Complete topics to build your study heatmap</div>';
    return;
  }

  let cells = '';
  for (let i = 27; i >= 0; i--) {
    const d = new Date(today); d.setDate(today.getDate() - i);
    const key = d.toISOString().slice(0,10);
    const count = activity[key] || 0;
    let lvl = 0;
    if (count>=1) lvl=1; if (count>=4) lvl=2; if (count>=8) lvl=3; if (count>=15) lvl=4;
    const dayLabel = d.toLocaleDateString('en',{weekday:'short',month:'short',day:'numeric'});
    cells += `<div class="heatmap-cell level-${lvl}" title="${dayLabel}: ${count} topics"></div>`;
  }
  grid.innerHTML = cells;
}

// ---- Velocity ----
function renderVelocity() {
  const vGrid = document.getElementById('velocity-grid');
  if (!vGrid) return;
  const activity = getActivityData();
  const today = new Date();

  function sumDays(from,count) {
    let s=0;
    for (let i=0;i<count;i++) {
      const d=new Date(today); d.setDate(today.getDate()-from-i);
      s += activity[d.toISOString().slice(0,10)] || 0;
    }
    return s;
  }

  const todayCount = activity[today.toISOString().slice(0,10)] || 0;
  const thisWeek = sumDays(0,7), lastWeek = sumDays(7,7), thisMonth = sumDays(0,28);

  function delta(cur,prev) {
    if (cur>prev) return `<span class="velocity-delta up">+${cur-prev}</span>`;
    if (cur<prev) return `<span class="velocity-delta down">-${prev-cur}</span>`;
    return '<span class="velocity-delta same">—</span>';
  }

  vGrid.innerHTML = `
    <div class="velocity-card"><div class="velocity-label">Today</div><div class="velocity-val">${todayCount}</div></div>
    <div class="velocity-card"><div class="velocity-label">This Week</div><div class="velocity-val">${thisWeek}</div>${delta(thisWeek,lastWeek)}</div>
    <div class="velocity-card"><div class="velocity-label">Last 28 Days</div><div class="velocity-val">${thisMonth}</div></div>
  `;
}

// ---- Bookmarks & Notes ----
function renderBookmarkNotes() {
  const grid = document.getElementById('bm-notes-grid');
  if (!grid) return;
  let bmR=0,bmG=0,bmS=0,nR=0,nG=0,nS=0;
  Object.values(userState.ras).forEach(s => { if (s?.bookmarked) bmR++; if (s?.notes?.trim()) nR++; });
  Object.values(userState.gk).forEach(s  => { if (s?.bookmarked) bmG++; if (s?.notes?.trim()) nG++; });
  Object.values(userState.sci).forEach(s => { if (s?.bookmarked) bmS++; if (s?.notes?.trim()) nS++; });
  const bm=bmR+bmG+bmS, notes=nR+nG+nS;

  let synced = 0;
  CROSS_EXAM_ID_MAP.forEach(m => {
    const rDone = (m.ras||[]).some(id => userState.ras[id]?.completed);
    const gDone = [...(m.gk||[]),...(m.sci||[])].some(id => (userState.gk[id]?.completed)||(userState.sci[id]?.completed));
    if (rDone && gDone) synced++;
  });

  grid.innerHTML = `
    <div class="bm-card">
      <div class="bm-icon ic-bm"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg></div>
      <div class="bm-val">${bm}</div>
      <div class="bm-lbl">Bookmarks</div>
      <div class="dist-sub">RAS:${bmR} · GK:${bmG} · Sci:${bmS}</div>
    </div>
    <div class="bm-card">
      <div class="bm-icon ic-note"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg></div>
      <div class="bm-val">${notes}</div>
      <div class="bm-lbl">Notes</div>
      <div class="dist-sub">RAS:${nR} · GK:${nG} · Sci:${nS}</div>
    </div>
    <div class="bm-card">
      <div class="bm-icon ic-sync"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="1 4 1 10 7 10"/><polyline points="23 20 23 14 17 14"/><path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15"/></svg></div>
      <div class="bm-val">${synced}</div>
      <div class="bm-lbl">Cross-Exam Synced</div>
      <div class="dist-sub">topics done in both exams</div>
    </div>
  `;
}

// ---- Completion Comparison Bars (side-by-side per exam) ----
function renderCompletionBars() {
  const container = document.getElementById('completion-bars-container');
  if (!container) return;

  const exams = [
    { key:'ras', label:'RAS Pre', color:'var(--ras)', bg:'#6366f120' },
    { key:'gk',  label:'2nd Grade GK', color:'var(--gk)', bg:'#10b98120' },
    { key:'sci', label:'2nd Grade Sci', color:'var(--sci)', bg:'#f59e0b20' }
  ];

  let rows = '';
  exams.forEach(ex => {
    const s = calculateExamStats(ex.key);
    const pct = s.pct;
    // Count per-status
    let pending=0, revised=0, mastered=0;
    Object.values(userState[ex.key]).forEach(st => {
      if (!st) return;
      if (!st.completed) { pending++; return; }
      const rr = getRevRound(st);
      if (rr >= 3) mastered++;
      else if (rr >= 1) revised++;
    });
    const completedNoRev = s.completed - revised - mastered;

    rows += `
      <div class="comp-bar-row">
        <div class="comp-bar-label">
          <span class="exam-badge ${ex.key}">${ex.label}</span>
          <span class="comp-bar-pct">${pct}%</span>
        </div>
        <div class="comp-bar-track">
          <div class="comp-bar-seg seg-mastered" style="width:${s.total>0?Math.round(mastered/s.total*100):0}%" title="${mastered} mastered"></div>
          <div class="comp-bar-seg seg-revised" style="width:${s.total>0?Math.round(revised/s.total*100):0}%" title="${revised} revised"></div>
          <div class="comp-bar-seg seg-done" style="width:${s.total>0?Math.round(Math.max(0,completedNoRev)/s.total*100):0}%" title="${Math.max(0,completedNoRev)} done"></div>
        </div>
        <div class="comp-bar-legend">
          <span class="legend-item"><span class="leg-dot leg-mastered"></span>${mastered} mastered</span>
          <span class="legend-item"><span class="leg-dot leg-revised"></span>${revised} revised</span>
          <span class="legend-item"><span class="leg-dot leg-done"></span>${Math.max(0,completedNoRev)} done</span>
          <span class="legend-item"><span class="leg-dot leg-pending"></span>${s.total - s.completed} pending</span>
        </div>
      </div>
    `;
  });

  container.innerHTML = rows;
}

// ---- Study Streak ----
function renderStudyStreak() {
  const container = document.getElementById('study-streak-container');
  if (!container) return;
  const activity = getActivityData();
  const today = new Date();

  // Calculate current streak
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const d = new Date(today); d.setDate(today.getDate() - i);
    const key = d.toISOString().slice(0,10);
    if (activity[key] && activity[key] > 0) {
      streak++;
    } else if (i === 0) {
      continue; // Today might not have started yet
    } else {
      break;
    }
  }

  // Best streak
  const dates = Object.keys(activity).sort();
  let bestStreak = 0, currentRun = 0;
  for (let i = 0; i < dates.length; i++) {
    if (i === 0) { currentRun = 1; }
    else {
      const prev = new Date(dates[i-1]);
      const curr = new Date(dates[i]);
      const diff = Math.round((curr - prev) / 86400000);
      if (diff === 1) currentRun++;
      else currentRun = 1;
    }
    if (currentRun > bestStreak) bestStreak = currentRun;
  }

  // Total active days
  const activeDays = Object.keys(activity).filter(k => activity[k] > 0).length;

  // Last 7 days mini calendar
  let miniCal = '';
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today); d.setDate(today.getDate() - i);
    const key = d.toISOString().slice(0,10);
    const active = activity[key] && activity[key] > 0;
    const dayName = d.toLocaleDateString('en', {weekday:'short'}).slice(0,2);
    miniCal += `<div class="streak-day ${active ? 'active' : ''}">
      <span class="streak-day-label">${dayName}</span>
      <span class="streak-day-dot">${active ? '✓' : ''}</span>
    </div>`;
  }

  container.innerHTML = `
    <div class="streak-stats">
      <div class="streak-stat-card current-streak">
        <div class="streak-big-num">${streak}</div>
        <div class="streak-stat-label">Current Streak</div>
        <div class="streak-stat-sub">days in a row</div>
      </div>
      <div class="streak-stat-card best-streak">
        <div class="streak-big-num">${bestStreak}</div>
        <div class="streak-stat-label">Best Streak</div>
        <div class="streak-stat-sub">personal record</div>
      </div>
      <div class="streak-stat-card total-days">
        <div class="streak-big-num">${activeDays}</div>
        <div class="streak-stat-label">Active Days</div>
        <div class="streak-stat-sub">total study days</div>
      </div>
    </div>
    <div class="streak-week-row">
      <div class="streak-week-label">This Week</div>
      <div class="streak-week-grid">${miniCal}</div>
    </div>
  `;
}

// ---- Estimated Completion ----
function renderEstimatedCompletion() {
  const container = document.getElementById('est-completion-container');
  if (!container) return;
  const activity = getActivityData();
  const today = new Date();

  // Calculate avg topics/day over last 14 days
  let totalRecent = 0;
  for (let i = 0; i < 14; i++) {
    const d = new Date(today); d.setDate(today.getDate() - i);
    totalRecent += activity[d.toISOString().slice(0,10)] || 0;
  }
  const avgPerDay = totalRecent / 14;

  const exams = [
    { key:'ras', label:'RAS Pre 2026', color:'var(--ras)' },
    { key:'gk',  label:'2nd Grade GK', color:'var(--gk)' },
    { key:'sci', label:'2nd Grade Science', color:'var(--sci)' }
  ];

  let cards = '';
  exams.forEach(ex => {
    const s = calculateExamStats(ex.key);
    const remaining = s.total - s.completed;
    const daysNeeded = avgPerDay > 0 ? Math.ceil(remaining / avgPerDay) : remaining > 0 ? 999 : 0;
    const estDate = new Date(today);
    estDate.setDate(today.getDate() + daysNeeded);
    const dateStr = daysNeeded < 999 ? estDate.toLocaleDateString('en', {month:'short', day:'numeric', year:'numeric'}) : '—';

    cards += `
      <div class="est-card">
        <div class="est-header"><span class="exam-badge ${ex.key}">${ex.label}</span></div>
        <div class="est-remaining">${remaining} <span>topics left</span></div>
        <div class="est-timeline-bar">
          <div class="est-timeline-fill" style="width:${s.pct}%;background:${ex.color}"></div>
        </div>
        <div class="est-info-row">
          <span class="est-days">${daysNeeded < 999 ? daysNeeded + ' days' : 'Not started'}</span>
          <span class="est-date">${dateStr}</span>
        </div>
      </div>
    `;
  });

  const overallAvgLabel = avgPerDay > 0 ? avgPerDay.toFixed(1) : '0';

  container.innerHTML = `
    <div class="est-avg-card">
      <div class="est-avg-val">${overallAvgLabel}</div>
      <div class="est-avg-label">topics/day avg (14d)</div>
    </div>
    <div class="est-cards-grid">${cards}</div>
  `;
}

// ---- Progress Sparkline (14-day daily activity chart) ----
function renderProgressSparkline() {
  const container = document.getElementById('sparkline-container');
  if (!container) return;
  const activity = getActivityData();
  const today = new Date();
  const days = 14;

  // Gather daily values
  const values = [];
  const labels = [];
  let maxVal = 1;
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today); d.setDate(today.getDate() - i);
    const key = d.toISOString().slice(0,10);
    const val = activity[key] || 0;
    values.push(val);
    labels.push(d.toLocaleDateString('en', { weekday: 'short' }).slice(0,2));
    if (val > maxVal) maxVal = val;
  }

  // Build SVG sparkline
  const w = 360, h = 80, pad = 8;
  const usableW = w - pad * 2;
  const usableH = h - pad * 2;
  const stepX = usableW / (days - 1);

  let pathD = '';
  let areaD = '';
  const points = values.map((v, i) => {
    const x = pad + i * stepX;
    const y = pad + usableH - (v / maxVal) * usableH;
    return { x, y };
  });

  points.forEach((p, i) => {
    if (i === 0) { pathD += `M${p.x},${p.y}`; areaD += `M${p.x},${h - pad}`; areaD += ` L${p.x},${p.y}`; }
    else { pathD += ` L${p.x},${p.y}`; areaD += ` L${p.x},${p.y}`; }
  });
  areaD += ` L${points[points.length-1].x},${h - pad} Z`;

  // Build day labels
  let dayLabelsHtml = '';
  for (let i = 0; i < days; i++) {
    if (i % 2 === 0 || i === days - 1) {
      const x = pad + i * stepX;
      dayLabelsHtml += `<text x="${x}" y="${h + 4}" text-anchor="middle" fill="var(--text-muted)" font-size="8" font-family="Inter,sans-serif">${labels[i]}</text>`;
    }
  }

  // Dots for each day
  let dotsHtml = '';
  points.forEach((p, i) => {
    const val = values[i];
    if (val > 0) {
      dotsHtml += `<circle cx="${p.x}" cy="${p.y}" r="3" fill="var(--ras)" stroke="var(--bg-card)" stroke-width="1.5"/>`;
    } else {
      dotsHtml += `<circle cx="${p.x}" cy="${p.y}" r="2" fill="var(--text-muted)" opacity=".4"/>`;
    }
  });

  // Today's value highlight
  const todayVal = values[values.length - 1];
  const totalPeriod = values.reduce((a,b) => a+b, 0);

  container.innerHTML = `
    <div class="sparkline-card">
      <div class="sparkline-header">
        <div>
          <span class="sparkline-today-val">${todayVal}</span>
          <span class="sparkline-today-label">topics today</span>
        </div>
        <div class="sparkline-total">
          <span class="sparkline-total-val">${totalPeriod}</span>
          <span class="sparkline-total-label">last ${days} days</span>
        </div>
      </div>
      <svg class="sparkline-svg" viewBox="0 0 ${w} ${h + 10}" preserveAspectRatio="none">
        <defs>
          <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="var(--ras)" stop-opacity=".3"/>
            <stop offset="100%" stop-color="var(--ras)" stop-opacity=".02"/>
          </linearGradient>
        </defs>
        <path d="${areaD}" fill="url(#sparkGrad)"/>
        <path d="${pathD}" fill="none" stroke="var(--ras)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        ${dotsHtml}
        ${dayLabelsHtml}
      </svg>
    </div>
  `;
}

// ---- Bookmarks & Study Hub Explorer ----
function renderBookmarkNotes() {
  const container = document.getElementById('bm-notes-grid');
  if (!container) return;

  const items = [];
  const icons = { note: '📝', video: '🎥', image: '🖼️', pdf: '📄', link: '🔗' };

  ['ras','gk','sci'].forEach(examKey => {
    const data = rawData[examKey];
    if (!data?.subjects) return;

    data.subjects.forEach(subj => {
      traverseTopics(subj.topics || [], topic => {
        const st = userState[examKey]?.[topic.id];
        if (!st) return;

        const topicTitle = currentLang === 'hi' ? (topic.title_hi || topic.title_en) : (topic.title_en || topic.title_hi);
        const normSt = normalizeTopicState(st);

        // Add resources
        if (normSt.resources && normSt.resources.length > 0) {
          normSt.resources.forEach(res => {
            items.push({
              examKey,
              topicId: topic.id,
              topicTitle,
              subjTitle: subj.title_en || subj.title_hi,
              resId: res.id,
              title: res.title || 'Untitled',
              type: res.type || 'note',
              icon: icons[res.type] || '📄',
              isBookmark: false
            });
          });
        }

        // Add bookmarks
        if (normSt.bookmarked) {
          items.push({
            examKey,
            topicId: topic.id,
            topicTitle,
            subjTitle: subj.title_en || subj.title_hi,
            resId: null,
            title: topicTitle,
            type: 'bookmark',
            icon: '🔖',
            isBookmark: true
          });
        }
      });
    });
  });

  if (items.length === 0) {
    container.innerHTML = `
      <div class="bm-empty-card" style="grid-column:1/-1;padding:24px;text-align:center;background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text-muted)">
        No content resources or bookmarks saved yet.<br/>
        <span style="font-size:12px">Click the 📎 icon on any topic in the Tracker to attach notes, videos, or PDFs.</span>
      </div>
    `;
    return;
  }

  container.innerHTML = items.map(item => `
    <div class="bm-card ${item.isBookmark ? 'bm-type-bookmark' : 'bm-type-resource'}" data-exam="${item.examKey}" data-topic-id="${item.topicId}" data-res-id="${item.resId || ''}" data-title="${escapeHTML(item.topicTitle)}">
      <div class="bm-card-header">
        <span class="bm-icon">${item.icon}</span>
        <span class="exam-badge ${item.examKey}">${item.examKey.toUpperCase()}</span>
      </div>
      <div class="bm-card-title">${escapeHTML(item.title)}</div>
      <div class="bm-card-sub">${escapeHTML(item.topicTitle)}</div>
    </div>
  `).join('');

  // Click card to open in Clean Slate Reader
  container.querySelectorAll('.bm-card').forEach(card => {
    card.addEventListener('click', () => {
      const examKey = card.getAttribute('data-exam');
      const topicId = card.getAttribute('data-topic-id');
      const resId = card.getAttribute('data-res-id');
      const title = card.getAttribute('data-title');

      if (examKey !== activeExam) {
        activeExam = examKey;
        document.querySelectorAll('.exam-btn').forEach(b => b.classList.toggle('active', b.getAttribute('data-exam') === examKey));
      }

      openStudyHubModal(topicId, title, resId || null);
    });
  });
}

