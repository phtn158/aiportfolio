import { Data } from "../data.js";
import { UI } from "../ui.js";
import { Storage } from "../storage.js";

export function renderDashboard(container) {
  const allCardIds = Data.getAllFlashcards().map((f) => f.id);
  const allQuizIds = Data.getAllQuiz().map((q) => q.id);
  const stats = Storage.getStats();

  const weakCardIds = Storage.getWeakFlashcards(allCardIds, 15);
  const weakQuizIds = Storage.getWeakQuizQuestions(allQuizIds, 15);

  const cardsById = new Map(Data.getAllFlashcards().map((c) => [c.id, c]));
  const quizById = new Map(Data.getAllQuiz().map((q) => [q.id, q]));

  // Overall counts
  let reviewedCards = 0, matureCards = 0;
  allCardIds.forEach((id) => {
    const c = Storage.getCardState(id);
    if (c.totalReviews > 0) reviewedCards += 1;
    if (c.reps >= 2 && c.missCount === 0) matureCards += 1;
  });

  let attemptedQuiz = 0, correctQuiz = 0, totalAttempts = 0;
  allQuizIds.forEach((id) => {
    const s = Storage.getQuizStat(id);
    if (s.attempts > 0) { attemptedQuiz += 1; totalAttempts += s.attempts; correctQuiz += s.correct; }
  });
  const quizAccuracy = totalAttempts ? Math.round((correctQuiz / totalAttempts) * 100) : 0;

  const weakCardsHtml = weakCardIds.length
    ? weakCardIds.map((id) => {
        const card = cardsById.get(id);
        const mod = Data.getModule(card.moduleId);
        const c = Storage.getCardState(id);
        return `
          <div class="weak-item">
            <div>
              <div class="wi-text">${UI.escapeHtml(card.front)}</div>
              <div class="wi-meta">${UI.escapeHtml(mod?.title || "")} · missed ${c.missCount}x</div>
            </div>
            <a class="pill-btn" href="#/flashcards/${card.moduleId}">Review</a>
          </div>
        `;
      }).join("")
    : `<p class="empty-state">No shaky flashcards yet — keep practicing and misses will surface here.</p>`;

  const weakQuizHtml = weakQuizIds.length
    ? weakQuizIds.map((id) => {
        const q = quizById.get(id);
        const mod = Data.getModule(q.moduleId);
        const s = Storage.getQuizStat(id);
        const acc = Math.round((s.correct / s.attempts) * 100);
        return `
          <div class="weak-item">
            <div>
              <div class="wi-text">${UI.escapeHtml(q.question)}</div>
              <div class="wi-meta">${UI.escapeHtml(mod?.title || "")} · ${acc}% correct (${s.correct}/${s.attempts})</div>
            </div>
            <a class="pill-btn" href="#/quiz/${q.moduleId}">Retry</a>
          </div>
        `;
      }).join("")
    : `<p class="empty-state">No weak quiz topics yet — misses will surface here as you take quizzes.</p>`;

  container.innerHTML = `
    <h1>My Progress</h1>
    <p class="subtitle">A running "focus on this" list, built from what you've actually missed — not what you've merely seen.</p>

    <div class="stat-grid">
      <div class="stat-box"><div class="num">${reviewedCards}/${allCardIds.length}</div><div class="label">Cards Practiced</div></div>
      <div class="stat-box"><div class="num">${matureCards}</div><div class="label">Cards Mastered</div></div>
      <div class="stat-box"><div class="num">${attemptedQuiz}/${allQuizIds.length}</div><div class="label">Quiz Qs Attempted</div></div>
      <div class="stat-box"><div class="num">${quizAccuracy}%</div><div class="label">Quiz Accuracy</div></div>
      <div class="stat-box"><div class="num">${(stats.visitDates || []).length}</div><div class="label">Study Days</div></div>
    </div>

    <h2>Weak Flashcards</h2>
    <div class="card">${weakCardsHtml}</div>

    <h2>Weak Quiz Topics</h2>
    <div class="card">${weakQuizHtml}</div>

    <h2>Data</h2>
    <div class="card">
      <p style="margin-top:0; font-size:0.85rem; color:var(--text-dim);">
        Your progress is stored only in this browser's localStorage — nothing is sent anywhere. Export a backup before clearing browser data, or if you want to carry progress to another device manually.
      </p>
      <div style="display:flex; gap:10px; flex-wrap:wrap;">
        <button class="btn btn-secondary" id="export-btn">Export Progress (.json)</button>
        <button class="btn btn-secondary" id="import-btn">Import Progress</button>
        <button class="btn btn-secondary" id="reset-btn" style="border-color:var(--bad); color:var(--bad);">Reset All Progress</button>
      </div>
      <input type="file" id="import-file" accept="application/json" style="display:none;" />
    </div>
  `;

  container.querySelector("#export-btn").addEventListener("click", () => {
    const blob = new Blob([Storage.exportProgress()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `genai-study-progress-${Storage.todayISO()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  const fileInput = container.querySelector("#import-file");
  container.querySelector("#import-btn").addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const text = await file.text();
    if (Storage.importProgress(text)) {
      alert("Progress imported.");
      renderDashboard(container);
    } else {
      alert("That file couldn't be read as valid progress data.");
    }
  });

  container.querySelector("#reset-btn").addEventListener("click", () => {
    if (confirm("This clears all flashcard/quiz progress in this browser. This can't be undone unless you've exported a backup. Continue?")) {
      Storage.resetAllProgress();
      renderDashboard(container);
    }
  });
}
