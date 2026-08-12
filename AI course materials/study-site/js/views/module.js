import { Data } from "../data.js";
import { UI } from "../ui.js";

export function renderModule(container, moduleId) {
  const mod = Data.getModule(moduleId);
  if (!mod) {
    container.innerHTML = `<p>Module not found. <a href="#/">Back home</a></p>`;
    return;
  }
  const concepts = Data.getConceptsByModule(moduleId);

  // "Concepts & Tools used here" quick-reference box, grouped by category tag.
  const grouped = {};
  concepts.forEach((c) => {
    (c.tags?.category || []).forEach((cat) => {
      grouped[cat] = grouped[cat] || new Set();
      grouped[cat].add(c.term);
    });
  });
  const tools = new Set();
  concepts.forEach((c) => (c.tags?.tool || []).forEach((t) => tools.add(t)));

  const groupedHtml = Object.entries(grouped)
    .map(([cat, terms]) => `<p style="margin:4px 0;"><strong>${UI.escapeHtml(cat)}:</strong> ${Array.from(terms).map(UI.escapeHtml).join(", ")}</p>`)
    .join("");
  const toolsHtml = tools.size
    ? `<p style="margin:4px 0;"><strong>Tools/Packages:</strong> ${Array.from(tools).map(UI.escapeHtml).join(", ")}</p>`
    : "";

  const entries = concepts.map((c) => UI.renderConceptEntry(c)).join("");

  container.innerHTML = `
    <div class="breadcrumb"><a href="#/">Home</a> / ${UI.escapeHtml(mod.title)}</div>
    <h1>${UI.escapeHtml(mod.title)}</h1>
    <p class="subtitle">${UI.escapeHtml(mod.description || "")}</p>

    <div class="card" style="margin-bottom:20px;">
      <strong>Concepts &amp; Tools used here</strong>
      ${groupedHtml}
      ${toolsHtml}
    </div>

    <div style="display:flex; gap:10px; flex-wrap:wrap; margin-bottom:24px;">
      <a class="btn" href="#/flashcards/${mod.id}">Practice this module's flashcards (${mod.flashcardCount})</a>
      <a class="btn btn-secondary" href="#/quiz/${mod.id}">Take this module's quiz (${mod.quizCount})</a>
    </div>

    <h2>Concepts</h2>
    ${entries}
  `;
}
