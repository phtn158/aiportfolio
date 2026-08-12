import { Data } from "../data.js";
import { UI } from "../ui.js";
import { Storage } from "../storage.js";

export function renderHome(container) {
  const modules = Data.getModules();
  const stats = Storage.getStats();

  const cards = modules.map((m) => `
    <a class="module-card" href="#/module/${m.id}">
      <h3>${UI.escapeHtml(m.title)}</h3>
      <p>${UI.escapeHtml(m.description || "")}</p>
      <div class="counts">${m.conceptCount} concepts · ${m.flashcardCount} flashcards · ${m.quizCount} quiz questions</div>
    </a>
  `).join("");

  const totalDays = (stats.visitDates || []).length;

  container.innerHTML = `
    <h1>Applied GenAI Study Hub</h1>
    <p class="subtitle">A practical, task-by-task path through the program: what to do, what you can build, and how to tell if it actually worked.</p>

    <div class="stat-grid">
      <div class="stat-box"><div class="num">${Data.getAllConcepts().length}</div><div class="label">Concepts</div></div>
      <div class="stat-box"><div class="num">${Data.getAllFlashcards().length}</div><div class="label">Flashcards</div></div>
      <div class="stat-box"><div class="num">${Data.getAllQuiz().length}</div><div class="label">Quiz Questions</div></div>
      <div class="stat-box"><div class="num">${totalDays}</div><div class="label">Study Days</div></div>
    </div>

    <h2>Study Path</h2>
    <div class="module-grid">${cards}</div>

    <h2>Quick Actions</h2>
    <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:10px;">
      <a class="btn" href="#/flashcards">Practice Flashcards</a>
      <a class="btn btn-secondary" href="#/quiz">Take a Quiz</a>
      <a class="btn btn-secondary" href="#/dashboard">View Weak Spots</a>
    </div>
  `;
}
