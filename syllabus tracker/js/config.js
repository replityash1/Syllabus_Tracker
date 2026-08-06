/**
 * js/config.js — Constants & Cross-Exam Mapping
 * Loaded first. All other modules depend on these globals.
 */

const EXAMS = {
  ras: { key: 'ras', file: 'RAS_Pre_Syllabus.json', label: 'RAS Pre 2026',       badgeClass: 'ras', color: '#6366f1' },
  gk:  { key: 'gk',  file: '2nd_Grade_GK_Syllabus.json', label: '2nd Grade GK',  badgeClass: 'gk',  color: '#10b981' },
  sci: { key: 'sci', file: '2nd_Grade_Science_Syllabus.json', label: '2nd Grade Science', badgeClass: 'sci', color: '#f59e0b' }
};

const CROSS_EXAM_ID_MAP = [
  // Rajasthan Geo
  { ras: ['location_extent_physical_divisions_rajasthan', 'physical_divisions_world'], gk: ['physical_features_rajasthan_2g'] },
  { ras: ['rivers_lakes_rajasthan'], gk: ['drainage_rajasthan_2g'] },
  { ras: ['climate_characteristics_rajasthan'], gk: ['climate_rajasthan_2g'] },
  { ras: ['natural_vegetation_biodiversity_conservation_rajasthan'], gk: ['natural_vegetation_rajasthan_2g'] },
  { ras: ['agriculture_rajasthan'], gk: ['agriculture_rajasthan_2g'] },
  { ras: ['livestock_rajasthan'], gk: ['livestock_rajasthan_2g', 'dairy_development_rajasthan_2g'] },
  { ras: ['population_growth_density_literacy_sexratio'], gk: ['demographic_characteristics_rajasthan_2g', 'population_distribution_migration_2g'] },
  { ras: ['tribes_rajasthan'], gk: ['tribes_rajasthan_2g'] },
  { ras: ['minerals_metallic_nonmetallic_rajasthan'], gk: ['industries_rajasthan_2g'] },
  { ras: ['tourism_rajasthan'], gk: ['tourism_major_centres_rajasthan_2g'] },
  // History & Culture
  { ras: ['prehistoric_sites_rajasthan'], gk: ['ancient_culture_civilization_rajasthan_2g'] },
  { ras: ['major_dynasties_political_cultural_achievements'], gk: ['rajput_dynasties_rajasthan_2g'] },
  { ras: ['cooperation_resistance_central_power'], gk: ['relations_delhi_sultanate_2g', 'rajasthan_and_mughals_2g'] },
  { ras: ['peasant_tribal_movements_20th_century'], gk: ['peasants_tribal_movements_2g'] },
  { ras: ['praja_mandal_movement_awakening', 'revolt_of_1857'], gk: ['prajamandal_movements_2g', 'revolution_1857_2g', 'political_awakening_2g'] },
  { ras: ['integration_of_rajasthan'], gk: ['integration_of_rajasthan_2g'] },
  { ras: ['architectural_traditions_rajasthan', 'temples_rajasthan', 'forts_rajasthan', 'palaces_rajasthan', 'monuments_rajasthan'], gk: ['architecture_temples_forts_palaces_monuments_2g'] },
  { ras: ['painting_handicraft_styles'], gk: ['paintings_various_schools_2g', 'customs_dresses_ornaments_handicrafts_2g'] },
  { ras: ['performing_arts_rajasthan', 'folk_dance_drama', 'music_classical_folk', 'musical_instruments_rajasthan'], gk: ['folk_music_dance_performing_art_2g'] },
  { ras: ['saints_and_sects', 'folk_deities_religious_practices'], gk: ['lok_devta_deviyan_2g', 'saints_of_rajasthan_2g'] },
  { ras: ['fairs_and_festivals', 'social_customs_traditions', 'costumes_and_ornaments'], gk: ['fairs_festivals_2g', 'customs_dresses_ornaments_handicrafts_2g'] },
  { ras: ['language_literature_rajasthan', 'dialects_of_rajasthani', 'rajasthani_literature_folk_literature'], gk: ['language_literature_2g'] },
  { ras: ['eminent_personalities_rajasthan'], gk: ['leading_personalities_rajasthan_2g'] },
  // Admin & Polity
  { ras: ['governor_rajasthan', 'cm_council_of_ministers'], gk: ['governor_cm_council_ministers_2g'] },
  { ras: ['rajasthan_legislative_assembly'], gk: ['state_legislative_assembly_2g'] },
  { ras: ['rajasthan_high_court', 'subordinate_courts_judicial_bodies'], gk: ['high_court_subordinate_courts_2g'] },
  { ras: ['chief_secretary', 'state_secretariat', 'divisional_commissioner', 'district_collector_magistrate'], gk: ['state_secretariat_divisional_commissioner_district_admin_2g'] },
  { ras: ['rpsc', 'state_election_commission_rajasthan', 'lokayukta'], gk: ['rpsc_2g', 'rajasthan_state_election_commission_2g', 'lokayukta_2g'] },
  { ras: ['panchayati_raj_rajasthan', 'municipal_administration_rajasthan'], gk: ['panchayati_raj_system_administration_2g', 'urban_local_self_government_administration_2g'] },
  // Indian Constitution
  { ras: ['constitution_making', 'preamble'], gk: ['constitutional_development_constituent_assembly_ambedkar_2g'] },
  { ras: ['fundamental_rights', 'directive_principles', 'fundamental_duties'], gk: ['citizenship_fundamental_rights_dpsp_duties_2g'] },
  { ras: ['executive_union', 'legislature_union'], gk: ['president_vp_pm_council_ministers_2g', 'parliament_supreme_court_election_commission_2g'] },
  { ras: ['judiciary_union'], gk: ['parliament_supreme_court_election_commission_2g'] },
  // Science
  { ras: ['biotechnology', 'genetic_engineering'], sci: ['p1_biotech_recombinant_dna_tools', 'p1_biotech_pcr'] },
  { ras: ['human_health_care', 'diet_and_nutrition', 'diseases_public_health_programs'], sci: ['p1_cmb_proteins_carbs_lipids', 'p1_gen_blood_groups_disorders'] },
  // Current Affairs
  { ras: ['welfare_development_new_schemes_programs_initiatives'], gk: ['new_schemes_initiatives_welfare_development_2g'] },
  { ras: ['sports_achievements'], gk: ['sports_and_games_2g'] }
];
