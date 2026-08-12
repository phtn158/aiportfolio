// ui.js — small shared rendering helpers used across views.

function escapeHtml(str) {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderTags(concept) {
  const cats = (concept.tags?.category || [])
    .map((t) => `<span class="tag tag-category">${escapeHtml(t)}</span>`)
    .join("");
  const tools = (concept.tags?.tool || [])
    .map((t) => `<span class="tag tag-tool">${escapeHtml(t)}</span>`)
    .join("");
  return `<div class="concept-tags">${cats}${tools}</div>`;
}

function renderConceptEntry(concept, moduleTitle) {
  return `
    <div class="concept-entry" id="concept-${escapeHtml(concept.id)}">
      ${moduleTitle ? `<div class="concept-module-label">${escapeHtml(moduleTitle)}</div>` : ""}
      <h3 class="concept-term">${escapeHtml(concept.term)}</h3>
      <div class="concept-eli">${escapeHtml(concept.eliForgot)}</div>
      <p class="concept-def">${escapeHtml(concept.definition)}</p>
      ${concept.formula ? `<div class="concept-formula">${escapeHtml(concept.formula)}</div>` : ""}
      ${concept.example ? `<p class="concept-example">${escapeHtml(concept.example)}</p>` : ""}
      ${renderTags(concept)}
    </div>
  `;
}

function setActiveNav(routePath) {
  document.querySelectorAll("#main-nav a").forEach((a) => {
    a.classList.toggle("active", a.dataset.route === routePath);
  });
}

function el(html) {
  const div = document.createElement("div");
  div.innerHTML = html.trim();
  return div.firstElementChild;
}

export const UI = { escapeHtml, renderTags, renderConceptEntry, setActiveNav, el };
