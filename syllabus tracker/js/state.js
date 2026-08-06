/**
 * js/state.js — Mutable global state
 * Must be loaded after firebase-config.js and config.js
 */

let currentLang = 'en';     // 'hi' | 'en'
let activeTab   = 'tracker'; // 'tracker' | 'overlap' | 'analytics'
let activeExam  = 'ras';    // 'ras' | 'gk' | 'sci'
let activeFilter = 'all';   // 'all' | 'pending' | 'revision' | 'bookmarked'
let searchQuery = '';
let activeNotesTopicId = null;
let currentUser = null;
let isGuestMode = false;    // true = localStorage only, false = Firestore sync

// Raw JSON data loaded at boot
const rawData = { ras: null, gk: null, sci: null };

// Per-topic user state: { [topicId]: { completed, revision, revisionRound, bookmarked, notes } }
const userState = { ras: {}, gk: {}, sci: {} };

// Accordion / expand memory (persist across soft rerenders)
const openSubjects   = { ras: new Set([0]), gk: new Set([0]), sci: new Set([0]) };
const expandedTopics = { ras: new Set(), gk: new Set(), sci: new Set() };
