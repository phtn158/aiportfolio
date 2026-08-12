import { Data } from "./data.js";
import { UI } from "./ui.js";
import { Router } from "./router.js";

export function initGlobalSearch() {
  const input = document.getElementById("global-search");
  const resultsBox = document.getElementById("search-results");

  function renderResults(query) {
    const results = Data.search(query);
    if (!query.trim()) {
      resultsBox.innerHTML = "";
      resultsBox.classList.remove("open");
      return;
    }
    if (results.length === 0) {
      resultsBox.innerHTML = `<div class="search-empty">No concepts match "${UI.escapeHtml(query)}".</div>`;
      resultsBox.classList.add("open");
      return;
    }
    resultsBox.innerHTML = results
      .map((r) => {
        const mod = Data.getModule(r.moduleId);
        return `
          <a class="search-result-item" href="#/dictionary/${r.id}" data-id="${UI.escapeHtml(r.id)}">
            <div class="search-result-term">${UI.escapeHtml(r.term)}</div>
            <div class="search-result-module">${UI.escapeHtml(mod?.title || "")}</div>
          </a>
        `;
      })
      .join("");
    resultsBox.classList.add("open");
  }

  input.addEventListener("input", (e) => renderResults(e.target.value));
  input.addEventListener("focus", (e) => {
    if (e.target.value.trim()) renderResults(e.target.value);
  });

  document.addEventListener("click", (e) => {
    if (!resultsBox.contains(e.target) && e.target !== input) {
      resultsBox.classList.remove("open");
    }
  });

  resultsBox.addEventListener("click", (e) => {
    const item = e.target.closest(".search-result-item");
    if (item) {
      resultsBox.classList.remove("open");
      input.value = "";
    }
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      resultsBox.classList.remove("open");
      input.blur();
    }
  });
}
