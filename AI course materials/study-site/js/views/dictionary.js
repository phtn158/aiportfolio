import { Data } from "../data.js";
import { UI } from "../ui.js";
import { Storage } from "../storage.js";

let activeCategory = null;
let activeTool = null;
let activeModule = null;
let queryText = "";

export function renderDictionary(container, params) {
  const jumpToId = params?.conceptId || null;
  const categories = Data.getAllCategoryTags();
  const tools = Data.getAllToolTags();
  const modules = Data.getModules();

  container.innerHTML = `
    <h1>Dictionary</h1>
    <p class="subtitle">Every concept from the program, in one alphabetized, filterable reference. Each entry leads with a plain-language one-liner before the formal definition.</p>

    <div class="dict-toolbar">
      <input type="text" id="dict-search" placeholder="Filter by keyword…" value="${UI.escapeHtml(queryText)}" />
      <select id="dict-module-select" class="tag-filter-btn" style="padding:7px 10px;">
        <option value="">All modules</option>
        ${modules.map((m) => `<option value="${m.id}">${UI.escapeHtml(m.title)}</option>`).join("")}
      </select>
    </div>

    <div class="tag-filter-bar" id="category-filters">
      <span style="font-size:0.78rem; color:var(--text-faint); align-self:center;">Category:</span>
      <button class="tag-filter-btn ${activeCategory === null ? "active" : ""}" data-cat="">All</button>
      ${categories.map((c) => `<button class="tag-filter-btn ${activeCategory === c ? "active" : ""}" data-cat="${UI.escapeHtml(c)}">${UI.escapeHtml(c)}</button>`).join("")}
    </div>
    <div class="tag-filter-bar" id="tool-filters">
      <span style="font-size:0.78rem; color:var(--text-faint); align-self:center;">Tool:</span>
      <button class="tag-filter-btn ${activeTool === null ? "active" : ""}" data-tool="">All</button>
      ${tools.map((t) => `<button class="tag-filter-btn ${activeTool === t ? "active" : ""}" data-tool="${UI.escapeHtml(t)}">${UI.escapeHtml(t)}</button>`).join("")}
    </div>

    <div id="dict-count" class="subtitle" style="margin-top:8px;"></div>
    <div id="dict-entries"></div>
  `;

  const searchInput = container.querySelector("#dict-search");
  searchInput.addEventListener("input", (e) => {
    queryText = e.target.value;
    renderEntries(container);
  });

  container.querySelector("#dict-module-select").addEventListener("change", (e) => {
    activeModule = e.target.value || null;
    renderEntries(container);
  });

  container.querySelectorAll("#category-filters button").forEach((btn) => {
    btn.addEventListener("click", () => {
      activeCategory = btn.dataset.cat || null;
      renderDictionary(container, params);
    });
  });
  container.querySelectorAll("#tool-filters button").forEach((btn) => {
    btn.addEventListener("click", () => {
      activeTool = btn.dataset.tool || null;
      renderDictionary(container, params);
    });
  });

  renderEntries(container);

  if (jumpToId) {
    setTimeout(() => {
      const target = container.querySelector(`#concept-${CSS.escape(jumpToId)}`);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        target.style.outline = "1px solid var(--accent)";
      }
    }, 60);
  }
}

function renderEntries(container) {
  let concepts = Data.getAllConcepts();

  if (activeModule) concepts = concepts.filter((c) => c.moduleId === activeModule);
  if (activeCategory) concepts = concepts.filter((c) => (c.tags?.category || []).includes(activeCategory));
  if (activeTool) concepts = concepts.filter((c) => (c.tags?.tool || []).includes(activeTool));
  if (queryText.trim()) {
    const q = queryText.trim().toLowerCase();
    concepts = concepts.filter((c) =>
      c.term.toLowerCase().includes(q) ||
      c.eliForgot.toLowerCase().includes(q) ||
      c.definition.toLowerCase().includes(q)
    );
  }

  concepts = [...concepts].sort((a, b) => a.term.localeCompare(b.term));

  const countEl = container.querySelector("#dict-count");
  countEl.textContent = `${concepts.length} concept${concepts.length === 1 ? "" : "s"}`;

  const entriesEl = container.querySelector("#dict-entries");
  if (concepts.length === 0) {
    entriesEl.innerHTML = `<p class="empty-state">No concepts match these filters.</p>`;
    return;
  }

  entriesEl.innerHTML = concepts
    .map((c) => UI.renderConceptEntry(c, Data.getModule(c.moduleId)?.title))
    .join("");

  // Record a view the first time a concept scrolls into view this session (lightweight, no IntersectionObserver dependency issues on old browsers -> use it if available)
  if ("IntersectionObserver" in window) {
    const seen = new Set();
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.id.replace("concept-", "");
          if (!seen.has(id)) {
            seen.add(id);
            Storage.recordConceptView(id);
          }
        }
      });
    }, { threshold: 0.6 });
    entriesEl.querySelectorAll(".concept-entry").forEach((node) => observer.observe(node));
  }
}
