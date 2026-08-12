import { Data } from "../data.js";
import { UI } from "../ui.js";

export function renderFormulas(container) {
  const entries = Data.conceptsWithFormulas().sort((a, b) => a.term.localeCompare(b.term));

  const grouped = {};
  entries.forEach((c) => {
    const modTitle = Data.getModule(c.moduleId)?.title || "Other";
    grouped[modTitle] = grouped[modTitle] || [];
    grouped[modTitle].push(c);
  });

  const sections = Object.entries(grouped)
    .map(([modTitle, items]) => `
      <h3>${UI.escapeHtml(modTitle)}</h3>
      ${items.map((c) => `
        <div class="formula-entry">
          <div class="formula-term">${UI.escapeHtml(c.term)}</div>
          <div class="concept-formula">${UI.escapeHtml(c.formula)}</div>
          ${c.example ? `<p class="concept-example">${UI.escapeHtml(c.example)}</p>` : ""}
        </div>
      `).join("")}
    `)
    .join("");

  container.innerHTML = `
    <h1>Formulas &amp; Code Reference</h1>
    <p class="subtitle">Every formula and code-like syntax across the program, pulled into one quick-lookup page.</p>
    ${sections || `<p class="empty-state">No formulas tagged yet.</p>`}
  `;
}
