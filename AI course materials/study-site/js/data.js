// data.js — loads content.json once and exposes lookup helpers.
// This is the single source of truth: dictionary, flashcards, quiz, and the
// formula panel are all views over the same concepts/flashcards/quiz arrays.

let content = null;
let conceptsById = new Map();
let modulesById = new Map();
let searchIndex = [];

async function load() {
  if (content) return content;
  const res = await fetch("data/content.json");
  if (!res.ok) throw new Error("Failed to load content.json: " + res.status);
  content = await res.json();

  content.concepts.forEach((c) => conceptsById.set(c.id, c));
  content.modules.forEach((m) => modulesById.set(m.id, m));

  searchIndex = content.concepts.map((c) => ({
    id: c.id,
    moduleId: c.moduleId,
    term: c.term,
    haystack: [
      c.term,
      c.eliForgot,
      c.definition,
      ...(c.aliases || []),
      ...(c.tags?.category || []),
      ...(c.tags?.tool || [])
    ].join(" ").toLowerCase()
  }));

  return content;
}

function getModules() {
  return content.modules;
}

function getModule(moduleId) {
  return modulesById.get(moduleId);
}

function getConcept(id) {
  return conceptsById.get(id);
}

function getConceptsByModule(moduleId) {
  return content.concepts.filter((c) => c.moduleId === moduleId);
}

function getFlashcardsByModule(moduleId) {
  return content.flashcards.filter((f) => f.moduleId === moduleId);
}

function getQuizByModule(moduleId) {
  return content.quiz.filter((q) => q.moduleId === moduleId);
}

function getAllConcepts() {
  return content.concepts;
}

function getAllFlashcards() {
  return content.flashcards;
}

function getAllQuiz() {
  return content.quiz;
}

function getAllCategoryTags() {
  const set = new Set();
  content.concepts.forEach((c) => (c.tags?.category || []).forEach((t) => set.add(t)));
  return Array.from(set).sort();
}

function getAllToolTags() {
  const set = new Set();
  content.concepts.forEach((c) => (c.tags?.tool || []).forEach((t) => set.add(t)));
  return Array.from(set).sort();
}

function search(query) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return searchIndex
    .filter((entry) => entry.haystack.includes(q))
    .map((entry) => {
      // rank: term-starts-with > term-contains > body match
      let rank = 2;
      const termLower = entry.term.toLowerCase();
      if (termLower.startsWith(q)) rank = 0;
      else if (termLower.includes(q)) rank = 1;
      return { ...entry, rank };
    })
    .sort((a, b) => a.rank - b.rank || a.term.localeCompare(b.term))
    .slice(0, 25);
}

function conceptsWithFormulas() {
  return content.concepts.filter((c) => !!c.formula);
}

export const Data = {
  load,
  getModules,
  getModule,
  getConcept,
  getConceptsByModule,
  getFlashcardsByModule,
  getQuizByModule,
  getAllConcepts,
  getAllFlashcards,
  getAllQuiz,
  getAllCategoryTags,
  getAllToolTags,
  search,
  conceptsWithFormulas
};
