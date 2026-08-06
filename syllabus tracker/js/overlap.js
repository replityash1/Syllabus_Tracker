/**
 * js/overlap.js — Overlap Finder View
 * Renders cross-exam overlap cards with live completion stats.
 */

const OVERLAP_MAPPINGS = [
  {
    category: 'Rajasthan Geography (राजस्थान का भूगोल)',
    items: [
      { rasId: 'location_extent_physical_divisions_rajasthan', gkId: 'physical_features_rajasthan_2g', ras: 'Physical divisions of Rajasthan', tg: 'Physical features (भौतिक स्वरूप)', common: 'Physical Features & Divisions of Rajasthan' },
      { rasId: 'rivers_lakes_rajasthan', gkId: 'drainage_rajasthan_2g', ras: 'Rivers and lakes of Rajasthan', tg: 'Drainage (अपवाह)', common: 'Rivers, Lakes & Drainage System' },
      { rasId: 'climate_characteristics_rajasthan', gkId: 'climate_rajasthan_2g', ras: 'Characteristics of climate', tg: 'Climate (जलवायु)', common: 'Climate & Weather Patterns' },
      { rasId: 'natural_vegetation_biodiversity_conservation_rajasthan', gkId: 'natural_vegetation_rajasthan_2g', ras: 'Natural vegetation & conservation', tg: 'Natural Vegetation', common: 'Vegetation & Wildlife Conservation' },
      { rasId: 'agriculture_rajasthan', gkId: 'agriculture_rajasthan_2g', ras: 'Agriculture of Rajasthan', tg: 'Agriculture (कृषि)', common: 'Agriculture & Major Crops' },
      { rasId: 'livestock_rajasthan', gkId: 'livestock_rajasthan_2g', ras: 'Livestock of Rajasthan', tg: 'Livestock & Dairy Development', common: 'Livestock & Dairy Development' },
      { rasId: 'population_growth_density_literacy_sexratio', gkId: 'demographic_characteristics_rajasthan_2g', ras: 'Population – growth, density, literacy', tg: 'Demographic Characteristics', common: 'Demography, Literacy & Sex Ratio' },
      { rasId: 'tribes_rajasthan', gkId: 'tribes_rajasthan_2g', ras: 'Tribes of Rajasthan', tg: 'Tribes (जनजातियाँ)', common: 'Tribes & Tribal Welfare' },
      { rasId: 'minerals_metallic_nonmetallic_rajasthan', gkId: 'industries_rajasthan_2g', ras: 'Minerals – metallic and non-metallic', tg: 'Industries & Minerals', common: 'Metallic & Non-Metallic Minerals' },
      { rasId: 'tourism_rajasthan', gkId: 'tourism_major_centres_rajasthan_2g', ras: 'Tourism in Rajasthan', tg: 'Tourism & Tourist Centres', common: 'Tourism & Major Tourist Circuits' }
    ]
  },
  {
    category: 'Rajasthan History & Freedom Movement (इतिहास)',
    items: [
      { rasId: 'prehistoric_sites_rajasthan', gkId: 'ancient_culture_civilization_rajasthan_2g', ras: 'Prehistoric sites', tg: 'Ancient Culture & Civilization', common: 'Prehistoric Sites & Ancient Civilizations' },
      { rasId: 'major_dynasties_political_cultural_achievements', gkId: 'rajput_dynasties_rajasthan_2g', ras: 'Achievements of major dynasties', tg: 'Rajput dynasties', common: 'Major Rajput Dynasties & Rulers' },
      { rasId: 'cooperation_resistance_central_power', gkId: 'relations_delhi_sultanate_2g', ras: 'Cooperation & resistance with central power', tg: 'Relations with Delhi Sultanate & Mughals', common: 'Relations with Delhi Sultanate & Mughals' },
      { rasId: 'praja_mandal_movement_awakening', gkId: 'prajamandal_movements_2g', ras: 'Revolt of 1857 & Praja Mandal', tg: '1857 & Prajamandal', common: '1857 Revolt & Prajamandal Movements' },
      { rasId: 'peasant_tribal_movements_20th_century', gkId: 'peasants_tribal_movements_2g', ras: 'Peasant & tribal movements', tg: 'Peasants and Tribal Movements', common: 'Peasant & Tribal Agitations' },
      { rasId: 'integration_of_rajasthan', gkId: 'integration_of_rajasthan_2g', ras: 'Integration of Rajasthan', tg: 'Integration (एकीकरण)', common: '7 Stages of Rajasthan Integration' }
    ]
  },
  {
    category: 'Culture, Art & Heritage (कला एवं संस्कृति)',
    items: [
      { rasId: 'architectural_traditions_rajasthan', gkId: 'architecture_temples_forts_palaces_monuments_2g', ras: 'Temples, Forts, Palaces', tg: 'Architecture – Temples, Forts', common: 'Forts, Palaces & Architectural Heritage' },
      { rasId: 'painting_handicraft_styles', gkId: 'paintings_various_schools_2g', ras: 'Painting & handicraft styles', tg: 'Paintings & Handicrafts', common: 'Rajasthani Painting Schools & Handicrafts' },
      { rasId: 'performing_arts_rajasthan', gkId: 'folk_music_dance_performing_art_2g', ras: 'Folk dance, drama & music', tg: 'Folk Music, Dance', common: 'Folk Dances, Dramas & Instruments' },
      { rasId: 'saints_and_sects', gkId: 'saints_of_rajasthan_2g', ras: 'Saints, sects & folk deities', tg: 'Lok Devta & Saints', common: 'Lok Devtas & Saints of Rajasthan' },
      { rasId: 'fairs_and_festivals', gkId: 'fairs_festivals_2g', ras: 'Fairs, festivals, costumes', tg: 'Fairs, Festivals, Customs', common: 'Fairs, Festivals & Traditional Costumes' },
      { rasId: 'language_literature_rajasthan', gkId: 'language_literature_2g', ras: 'Rajasthani Dialects & Literature', tg: 'Language and Literature', common: 'Rajasthani Dialects & Literature' },
      { rasId: 'eminent_personalities_rajasthan', gkId: 'leading_personalities_rajasthan_2g', ras: 'Eminent personalities', tg: 'Leading Personalities', common: 'Prominent Personalities of Rajasthan' }
    ]
  },
  {
    category: 'Polity & Administration (प्रशासनिक व्यवस्था)',
    items: [
      { rasId: 'governor_rajasthan', gkId: 'governor_cm_council_ministers_2g', ras: 'Governor, CM & Cabinet', tg: 'Governor, CM & Cabinet', common: 'Governor, CM & State Cabinet' },
      { rasId: 'rajasthan_legislative_assembly', gkId: 'state_legislative_assembly_2g', ras: 'Legislative Assembly', tg: 'State Legislative Assembly', common: 'Rajasthan Legislative Assembly' },
      { rasId: 'rajasthan_high_court', gkId: 'high_court_subordinate_courts_2g', ras: 'High Court & Courts', tg: 'High Court & Subordinate Courts', common: 'High Court & Subordinate Judiciary' },
      { rasId: 'chief_secretary', gkId: 'state_secretariat_divisional_commissioner_district_admin_2g', ras: 'State Secretariat & DC', tg: 'State Secretariat & District Admin', common: 'State Secretariat & District Administration' },
      { rasId: 'rpsc', gkId: 'rpsc_2g', ras: 'RPSC, SEC & Lokayukta', tg: 'RPSC & Lokayukta', common: 'Constitutional & Statutory Commissions' },
      { rasId: 'panchayati_raj_rajasthan', gkId: 'panchayati_raj_system_administration_2g', ras: 'Panchayati Raj', tg: 'Panchayati Raj System', common: 'Panchayati Raj in Rajasthan' }
    ]
  },
  {
    category: 'Indian Polity & Constitution (भारतीय संविधान)',
    items: [
      { rasId: 'constitution_making', gkId: 'constitutional_development_constituent_assembly_ambedkar_2g', ras: 'Making of Constitution & Preamble', tg: 'Constitutional Development', common: 'Constituent Assembly & Preamble' },
      { rasId: 'fundamental_rights', gkId: 'citizenship_fundamental_rights_dpsp_duties_2g', ras: 'Fundamental Rights, DPSP & Duties', tg: 'Rights, DPSP & Duties', common: 'Fundamental Rights, DPSP & Duties' },
      { rasId: 'executive_union', gkId: 'president_vp_pm_council_ministers_2g', ras: 'President, VP, PM & Cabinet', tg: 'President, VP, PM & Cabinet', common: 'Union Executive' },
      { rasId: 'legislature_union', gkId: 'parliament_supreme_court_election_commission_2g', ras: 'Parliament & Supreme Court', tg: 'Parliament & Supreme Court', common: 'Parliament & Supreme Court' }
    ]
  },
  {
    category: 'Science & Technology (विज्ञान)',
    items: [
      { rasId: 'biotechnology', sciId: 'p1_biotech_recombinant_dna_tools', ras: 'Biotechnology & Genetic Engineering', tg: 'Biotechnology & Recombinant DNA', common: 'Biotechnology & Genetic Engineering' },
      { rasId: 'human_health_care', sciId: 'p1_gen_blood_groups_disorders', ras: 'Human Health & Nutrition', tg: 'Cell Biology & Human Diseases', common: 'Human Health & Communicable Diseases' }
    ]
  },
  {
    category: 'Current Affairs & Schemes (समसामयिक)',
    items: [
      { rasId: 'welfare_development_new_schemes_programs_initiatives', gkId: 'new_schemes_initiatives_welfare_development_2g', ras: 'Welfare Schemes', tg: 'New Schemes & Initiatives', common: 'Rajasthan Flagship Welfare Schemes' },
      { rasId: 'sports_achievements', gkId: 'sports_and_games_2g', ras: 'Sports & Awards', tg: 'Sports, Games & Awards', common: 'Sports Awards & Achievements' }
    ]
  }
];

function renderOverlapView() {
  const catFilter = document.getElementById('overlap-cat-filter');
  if (!catFilter) return;

  catFilter.innerHTML = `<button class="cat-btn active" data-cat="all">All Categories</button>`;
  OVERLAP_MAPPINGS.forEach((cat, idx) => {
    const btn = document.createElement('button');
    btn.className = 'cat-btn';
    btn.setAttribute('data-cat', idx);
    btn.textContent = cat.category.split('(')[0].trim();
    btn.addEventListener('click', () => {
      document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderOverlapCards([OVERLAP_MAPPINGS[idx]]);
    });
    catFilter.appendChild(btn);
  });

  document.querySelector('.cat-btn[data-cat="all"]')?.addEventListener('click', e => {
    document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    renderOverlapCards(OVERLAP_MAPPINGS);
  });

  renderOverlapCards(OVERLAP_MAPPINGS);
}

function renderOverlapCards(categories) {
  const container = document.getElementById('overlap-grid');
  if (!container) return;
  container.innerHTML = '';

  let totalOverlap = 0, completedOverlap = 0;

  categories.forEach(cat => {
    const group = document.createElement('div');
    group.className = 'overlap-category-block';
    group.innerHTML = `<h3 class="overlap-cat-title">${cat.category}</h3>`;
    const wrap = document.createElement('div');
    wrap.className = 'overlap-cards-wrapper';

    cat.items.forEach(item => {
      totalOverlap++;
      const rasDone = item.rasId && userState.ras[item.rasId]?.completed;
      const gkDone  = item.gkId  && userState.gk[item.gkId]?.completed;
      const sciDone = item.sciId && userState.sci[item.sciId]?.completed;
      const isTgDone = gkDone || sciDone;
      const bothDone = rasDone && isTgDone;
      if (bothDone) completedOverlap++;

      const linkSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>`;

      const card = document.createElement('div');
      card.className = `overlap-card ${bothDone ? 'both-done' : rasDone || isTgDone ? 'partial-done' : ''}`;
      card.innerHTML = `
        <div class="overlap-card-header">
          <div class="overlap-common-badge">
            <span class="icon">${linkSvg}</span>
            <span class="common-title">${item.common}</span>
          </div>
          <div class="overlap-status-pills">
            <span class="status-pill ${rasDone ? 'done' : 'pending'}"><span class="badge ras">RAS</span> ${rasDone ? '✓' : '—'}</span>
            <span class="status-pill ${isTgDone ? 'done' : 'pending'}"><span class="badge gk">2G</span> ${isTgDone ? '✓' : '—'}</span>
            ${bothDone ? '<span class="status-pill mastered">✓ Both</span>' : ''}
          </div>
        </div>
        <div class="overlap-card-split">
          <div class="split-side ras-side ${rasDone ? 'done' : ''}">
            <div class="side-header">
              <span class="exam-badge ras">RAS Pre</span>
              <label class="overlap-check-label">
                <input type="checkbox" class="overlap-checkbox" data-exam="ras" data-id="${item.rasId || ''}" ${rasDone ? 'checked' : ''} ${!item.rasId ? 'disabled' : ''} />
                Done
              </label>
            </div>
            <div class="side-topic-title">${item.ras}</div>
          </div>
          <div class="split-divider">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="2" stroke-linecap="round"><path d="M13 17l5-5-5-5M6 17l5-5-5-5"/></svg>
          </div>
          <div class="split-side tg-side ${isTgDone ? 'done' : ''}">
            <div class="side-header">
              <span class="exam-badge gk">2nd Grade</span>
              <label class="overlap-check-label">
                <input type="checkbox" class="overlap-checkbox" data-exam="${item.sciId ? 'sci' : 'gk'}" data-id="${item.gkId || item.sciId || ''}" ${isTgDone ? 'checked' : ''} ${(!item.gkId && !item.sciId) ? 'disabled' : ''} />
                Done
              </label>
            </div>
            <div class="side-topic-title">${item.tg}</div>
          </div>
        </div>
      `;

      card.querySelectorAll('.overlap-checkbox').forEach(cb => {
        cb.addEventListener('change', () => {
          const ex = cb.getAttribute('data-exam');
          const id = cb.getAttribute('data-id');
          if (!ex || !id) return;
          setTopicCompletionState(ex, id, cb.checked);
          if (cb.checked) recordActivityToday();
          triggerSmartCrossExamSync(ex, id, cb.checked);
          saveUserStateToStorage();
          renderOverlapCards(categories);
        });
      });

      wrap.appendChild(card);
    });

    group.appendChild(wrap);
    container.appendChild(group);
  });

  // Update stats bar with real data
  const rasStats = calculateExamStats('ras');
  const gkStats  = calculateExamStats('gk');

  const countEl  = document.getElementById('ov-count');
  const rasUEl   = document.getElementById('ov-ras-unique');
  const tgUEl    = document.getElementById('ov-2g-unique');
  const savingEl = document.getElementById('ov-saving');
  const doneEl   = document.getElementById('ov-completed');

  if (countEl)  countEl.textContent  = totalOverlap;
  if (rasUEl)   rasUEl.textContent   = Math.max(0, rasStats.total - totalOverlap);
  if (tgUEl)    tgUEl.textContent    = Math.max(0, gkStats.total - totalOverlap);
  if (doneEl)   doneEl.textContent   = completedOverlap;

  const combined = rasStats.total + gkStats.total;
  const eff = combined > 0 ? Math.round((totalOverlap * 2 / combined) * 100) : 38;
  if (savingEl) savingEl.textContent = `${eff}%`;
}
