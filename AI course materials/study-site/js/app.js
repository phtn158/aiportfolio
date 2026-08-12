import { Data } from "./data.js";
import { Router } from "./router.js";
import { UI } from "./ui.js";
import { Storage } from "./storage.js";
import { initGlobalSearch } from "./search.js";

import { renderHome } from "./views/home.js";
import { renderModule } from "./views/module.js";
import { renderDictionary } from "./views/dictionary.js";
import { renderFlashcards } from "./views/flashcards.js";
import { renderQuiz } from "./views/quiz.js";
import { renderFormulas } from "./views/formulas.js";
import { renderDashboard } from "./views/dashboard.js";

const appEl = document.getElementById("app");

function topLevelRoute(hash) {
  // used only for nav highlighting, e.g. "#/flashcards/dspy" -> "/flashcards"
  const parts = hash.replace(/^#/, "").split("/").filter(Boolean);
  return parts.length ? "/" + parts[0] : "/";
}

async function main() {
  try {
    await Data.load();
  } catch (e) {
    appEl.innerHTML = `<div class="card"><strong>Couldn't load study content.</strong><p>${UI.escapeHtml(e.message)}</p><p>If you're opening this file directly (file://), some browsers block fetch() for local files. Serve it over a local web server instead (e.g. <code>npx serve</code> or <code>python3 -m http.server</code>), or deploy it to Netlify.</p></div>`;
    return;
  }

  Storage.touchVisit();
  initGlobalSearch();

  Router.on("#/", () => { renderHome(appEl); UI.setActiveNav("/"); window.scrollTo(0, 0); });
  Router.on("#/module/:moduleId", ({ moduleId }) => { renderModule(appEl, moduleId); UI.setActiveNav("/module"); window.scrollTo(0, 0); });

  Router.on("#/dictionary", () => { renderDictionary(appEl, {}); UI.setActiveNav("/dictionary"); window.scrollTo(0, 0); });
  Router.on("#/dictionary/:conceptId", ({ conceptId }) => { renderDictionary(appEl, { conceptId }); UI.setActiveNav("/dictionary"); });

  Router.on("#/flashcards", () => { renderFlashcards(appEl, null); UI.setActiveNav("/flashcards"); window.scrollTo(0, 0); });
  Router.on("#/flashcards/:moduleId", ({ moduleId }) => { renderFlashcards(appEl, moduleId); UI.setActiveNav("/flashcards"); window.scrollTo(0, 0); });

  Router.on("#/quiz", () => { renderQuiz(appEl, null); UI.setActiveNav("/quiz"); window.scrollTo(0, 0); });
  Router.on("#/quiz/:moduleId", ({ moduleId }) => { renderQuiz(appEl, moduleId); UI.setActiveNav("/quiz"); window.scrollTo(0, 0); });

  Router.on("#/formulas", () => { renderFormulas(appEl); UI.setActiveNav("/formulas"); window.scrollTo(0, 0); });
  Router.on("#/dashboard", () => { renderDashboard(appEl); UI.setActiveNav("/dashboard"); window.scrollTo(0, 0); });

  // Keep nav highlighting correct even for sub-routes like #/flashcards/dspy
  window.addEventListener("hashchange", () => UI.setActiveNav(topLevelRoute(window.location.hash)));

  Router.start();
}

main();
