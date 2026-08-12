// storage.js — localStorage-backed progress store + SM-2-style spaced repetition.
// All state lives under one key so the whole progress model is portable (export/import-able)
// and there is exactly one place that touches localStorage.

const STORAGE_KEY = "studySiteProgress_v1";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(dateStr, days) {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + Math.round(days));
  return d.toISOString().slice(0, 10);
}

function defaultState() {
  return {
    version: 1,
    flashcards: {},   // cardId -> { ef, interval, reps, due, missCount, totalReviews, lastResult, lastReviewed }
    quiz: {},         // questionId -> { attempts, correct, lastCorrect, lastAttempted }
    concepts: {},     // conceptId -> { viewCount, lastViewed }
    stats: { totalFlashcardReviews: 0, totalQuizAttempts: 0, firstVisit: todayISO(), lastVisit: null, visitDates: [] }
  };
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    // shallow-merge with defaults so new fields introduced later don't break old saves
    const base = defaultState();
    return {
      ...base,
      ...parsed,
      flashcards: { ...base.flashcards, ...(parsed.flashcards || {}) },
      quiz: { ...base.quiz, ...(parsed.quiz || {}) },
      concepts: { ...base.concepts, ...(parsed.concepts || {}) },
      stats: { ...base.stats, ...(parsed.stats || {}) }
    };
  } catch (e) {
    console.warn("Could not read saved progress, starting fresh.", e);
    return defaultState();
  }
}

let state = load();

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn("Could not save progress (localStorage unavailable/full).", e);
  }
}

function touchVisit() {
  const today = todayISO();
  if (state.stats.lastVisit !== today) {
    state.stats.visitDates = state.stats.visitDates || [];
    state.stats.visitDates.push(today);
    state.stats.lastVisit = today;
    save();
  }
}

// ---------- Concepts (dictionary view tracking, powers "recently viewed") ----------

function recordConceptView(conceptId) {
  const c = state.concepts[conceptId] || { viewCount: 0, lastViewed: null };
  c.viewCount += 1;
  c.lastViewed = new Date().toISOString();
  state.concepts[conceptId] = c;
  save();
}

function getConceptStat(conceptId) {
  return state.concepts[conceptId] || { viewCount: 0, lastViewed: null };
}

// ---------- Flashcards: SM-2-style spaced repetition ----------
// Quality buttons map to SM-2 quality scores:
//   Missed it -> 1   Shaky -> 3   Got it -> 5
// Cards below 3 reset their interval (resurface again soon); cards >=3 grow their interval
// by the ease factor. missCount never resets — it's the signal the weak-spot dashboard reads.

function getCardState(cardId) {
  return state.flashcards[cardId] || {
    ef: 2.5, interval: 0, reps: 0, due: todayISO(),
    missCount: 0, totalReviews: 0, lastResult: null, lastReviewed: null
  };
}

function reviewCard(cardId, quality) {
  // quality: 1 (missed), 3 (shaky), 5 (got it)
  const c = getCardState(cardId);
  c.totalReviews += 1;
  c.lastReviewed = new Date().toISOString();
  c.lastResult = quality;

  if (quality < 3) {
    c.missCount += 1;
    c.reps = 0;
    c.interval = 0; // resurface within this session / very soon
  } else {
    if (c.reps === 0) c.interval = 1;
    else if (c.reps === 1) c.interval = 6;
    else c.interval = Math.round(c.interval * c.ef);
    c.reps += 1;
  }

  // SM-2 ease factor update, clamped to a sane floor
  const q = quality;
  c.ef = Math.max(1.3, c.ef + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));
  c.due = addDays(todayISO(), c.interval);

  state.flashcards[cardId] = c;
  state.stats.totalFlashcardReviews += 1;
  save();
  return c;
}

// Build a practice queue for a set of card IDs, weighted so frequently-missed
// cards resurface more often within the session (not just "due" cards).
function buildPracticeQueue(cardIds) {
  const today = todayISO();
  const due = [];
  const notDue = [];
  cardIds.forEach((id) => {
    const c = getCardState(id);
    const isDue = !c.lastReviewed || c.due <= today;
    (isDue ? due : notDue).push({ id, c });
  });

  // Weight: base 1 slot + 1 extra slot per miss (capped at +4) so shaky cards repeat more.
  const weighted = [];
  due.forEach(({ id, c }) => {
    const copies = 1 + Math.min(c.missCount, 4);
    for (let i = 0; i < copies; i++) weighted.push(id);
  });

  // Shuffle
  for (let i = weighted.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [weighted[i], weighted[j]] = [weighted[j], weighted[i]];
  }

  return { queue: weighted, dueCount: due.length, notDueCount: notDue.length };
}

// ---------- Quiz ----------

function recordQuizAnswer(questionId, wasCorrect) {
  const q = state.quiz[questionId] || { attempts: 0, correct: 0, lastCorrect: null, lastAttempted: null };
  q.attempts += 1;
  if (wasCorrect) q.correct += 1;
  q.lastCorrect = wasCorrect;
  q.lastAttempted = new Date().toISOString();
  state.quiz[questionId] = q;
  state.stats.totalQuizAttempts += 1;
  save();
  return q;
}

function getQuizStat(questionId) {
  return state.quiz[questionId] || { attempts: 0, correct: 0, lastCorrect: null, lastAttempted: null };
}

// ---------- Weak-spot aggregation ----------

function getWeakFlashcards(allCardIds, limit = 20) {
  return allCardIds
    .map((id) => ({ id, c: getCardState(id) }))
    .filter(({ c }) => c.totalReviews > 0 && (c.missCount >= 1 || c.ef < 2.0))
    .sort((a, b) => (b.c.missCount - a.c.missCount) || (a.c.ef - b.c.ef))
    .slice(0, limit)
    .map(({ id }) => id);
}

function getWeakQuizQuestions(allQuestionIds, limit = 20) {
  return allQuestionIds
    .map((id) => ({ id, q: getQuizStat(id) }))
    .filter(({ q }) => q.attempts > 0 && q.correct / q.attempts < 0.6)
    .sort((a, b) => (a.q.correct / a.q.attempts) - (b.q.correct / b.q.attempts))
    .slice(0, limit)
    .map(({ id }) => id);
}

// ---------- Utility / danger zone ----------

function resetAllProgress() {
  state = defaultState();
  save();
}

function exportProgress() {
  return JSON.stringify(state, null, 2);
}

function importProgress(json) {
  try {
    const parsed = JSON.parse(json);
    state = { ...defaultState(), ...parsed };
    save();
    return true;
  } catch (e) {
    console.error("Import failed: invalid JSON", e);
    return false;
  }
}

function getStats() {
  return state.stats;
}

export const Storage = {
  touchVisit,
  recordConceptView,
  getConceptStat,
  getCardState,
  reviewCard,
  buildPracticeQueue,
  recordQuizAnswer,
  getQuizStat,
  getWeakFlashcards,
  getWeakQuizQuestions,
  resetAllProgress,
  exportProgress,
  importProgress,
  getStats,
  todayISO
};
