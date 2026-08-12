import { Data } from "../data.js";
import { UI } from "../ui.js";
import { Storage } from "../storage.js";

export function renderFlashcards(container, moduleId) {
  if (!moduleId) {
    renderModulePicker(container);
    return;
  }
  const mod = Data.getModule(moduleId);
  if (!mod) {
    container.innerHTML = `<p>Module not found. <a href="#/flashcards">Back to flashcards</a></p>`;
    return;
  }
  const cards = Data.getFlashcardsByModule(moduleId);
  if (cards.length === 0) {
    container.innerHTML = `<p class="empty-state">No flashcards in this module yet.</p>`;
    return;
  }
  startSession(container, mod, cards);
}

function renderModulePicker(container) {
  const modules = Data.getModules();
  const cards = modules
    .map((m) => {
      const cardIds = Data.getFlashcardsByModule(m.id).map((f) => f.id);
      const { dueCount } = Storage.buildPracticeQueue(cardIds);
      return `
        <a class="module-card" href="#/flashcards/${m.id}">
          <h3>${UI.escapeHtml(m.title)}</h3>
          <div class="counts">${m.flashcardCount} flashcards${dueCount ? ` · <strong style="color:var(--accent)">${dueCount} due</strong>` : ""}</div>
        </a>
      `;
    })
    .join("");

  container.innerHTML = `
    <h1>Flashcards</h1>
    <p class="subtitle">Spaced repetition: cards you mark "Missed it" or "Shaky" resurface more often. Pick a module to start a session.</p>
    <div class="module-grid">${cards}</div>
  `;
}

function startSession(container, mod, cards) {
  const cardIds = cards.map((c) => c.id);
  const { queue, dueCount, notDueCount } = Storage.buildPracticeQueue(cardIds);
  const cardsById = new Map(cards.map((c) => [c.id, c]));

  const session = {
    queue: queue.length ? queue : [...cardIds], // if nothing due, practice the full deck anyway
    index: 0,
    total: queue.length ? queue.length : cardIds.length,
    showingBack: false,
    correctCount: 0,
    reviewedCount: 0
  };

  renderCard(container, mod, session, cardsById);
}

function renderCard(container, mod, session, cardsById) {
  if (session.index >= session.queue.length) {
    renderSessionComplete(container, mod, session);
    return;
  }

  const cardId = session.queue[session.index];
  const card = cardsById.get(cardId);
  const cardState = Storage.getCardState(cardId);

  container.innerHTML = `
    <div class="breadcrumb"><a href="#/flashcards">Flashcards</a> / ${UI.escapeHtml(mod.title)}</div>
    <h1>${UI.escapeHtml(mod.title)}</h1>
    <div class="session-progress">Card ${session.index + 1} of ${session.queue.length}${cardState.missCount > 0 ? ` · missed ${cardState.missCount}x before` : ""}</div>

    <div class="flashcard-stage">
      <div class="flashcard" id="flip-card">
        <span class="face-label">${session.showingBack ? "Answer" : "Question"}</span>
        <div id="card-face-text">${UI.escapeHtml(session.showingBack ? card.back : card.front)}</div>
        <span class="hint">${session.showingBack ? "" : "Click to reveal answer"}</span>
      </div>

      ${session.showingBack ? `
        <div class="grade-buttons">
          <button class="grade-btn missed" data-q="1">Missed it</button>
          <button class="grade-btn shaky" data-q="3">Shaky</button>
          <button class="grade-btn good" data-q="5">Got it</button>
        </div>
      ` : `
        <button class="btn btn-secondary" id="reveal-btn">Show Answer</button>
      `}
    </div>
  `;

  const flipCard = container.querySelector("#flip-card");
  if (!session.showingBack) {
    const flip = () => {
      session.showingBack = true;
      renderCard(container, mod, session, cardsById);
    };
    flipCard.addEventListener("click", flip);
    container.querySelector("#reveal-btn").addEventListener("click", flip);
  } else {
    container.querySelectorAll(".grade-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const quality = Number(btn.dataset.q);
        Storage.reviewCard(cardId, quality);
        session.reviewedCount += 1;
        if (quality >= 5) session.correctCount += 1;
        session.index += 1;
        session.showingBack = false;
        renderCard(container, mod, session, cardsById);
      });
    });
  }
}

function renderSessionComplete(container, mod, session) {
  const pct = session.reviewedCount ? Math.round((session.correctCount / session.reviewedCount) * 100) : 0;
  container.innerHTML = `
    <div class="breadcrumb"><a href="#/flashcards">Flashcards</a> / ${UI.escapeHtml(mod.title)}</div>
    <div class="quiz-score-summary">
      <div class="big-score">${pct}%</div>
      <p>Marked "Got it" on ${session.correctCount} of ${session.reviewedCount} cards.</p>
      <div style="display:flex; gap:10px; justify-content:center; margin-top:20px;">
        <button class="btn" id="practice-again-btn">Practice Again</button>
        <a class="btn btn-secondary" href="#/flashcards">Choose Another Module</a>
        <a class="btn btn-secondary" href="#/dashboard">View Progress</a>
      </div>
    </div>
  `;
  // Re-invoke directly rather than via hash link: the hash never changed during
  // the session (we render manually), so a same-hash <a> wouldn't fire hashchange.
  container.querySelector("#practice-again-btn").addEventListener("click", () => {
    renderFlashcards(container, mod.id);
  });
}
