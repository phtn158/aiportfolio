import { Data } from "../data.js";
import { UI } from "../ui.js";
import { Storage } from "../storage.js";

export function renderQuiz(container, moduleId) {
  if (!moduleId) {
    renderModulePicker(container);
    return;
  }
  const mod = Data.getModule(moduleId);
  if (!mod) {
    container.innerHTML = `<p>Module not found. <a href="#/quiz">Back to quiz</a></p>`;
    return;
  }
  const questions = shuffle(Data.getQuizByModule(moduleId));
  if (questions.length === 0) {
    container.innerHTML = `<p class="empty-state">No quiz questions in this module yet.</p>`;
    return;
  }
  startQuiz(container, mod, questions);
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function renderModulePicker(container) {
  const modules = Data.getModules();
  const cards = modules
    .map((m) => {
      const qIds = Data.getQuizByModule(m.id).map((q) => q.id);
      let attempted = 0, correct = 0;
      qIds.forEach((id) => {
        const s = Storage.getQuizStat(id);
        if (s.attempts > 0) { attempted += 1; if (s.lastCorrect) correct += 1; }
      });
      return `
        <a class="module-card" href="#/quiz/${m.id}">
          <h3>${UI.escapeHtml(m.title)}</h3>
          <div class="counts">${m.quizCount} questions${attempted ? ` · last attempt: ${correct}/${attempted} correct` : ""}</div>
        </a>
      `;
    })
    .join("");

  container.innerHTML = `
    <h1>Quiz</h1>
    <p class="subtitle">Multiple choice, with an explanation after each answer. Pick a module to start.</p>
    <div class="module-grid">${cards}</div>
  `;
}

function startQuiz(container, mod, questions) {
  const session = { index: 0, answered: false, correctCount: 0, questions };
  renderQuestion(container, mod, session);
}

function renderQuestion(container, mod, session) {
  if (session.index >= session.questions.length) {
    renderQuizComplete(container, mod, session);
    return;
  }
  const q = session.questions[session.index];

  container.innerHTML = `
    <div class="breadcrumb"><a href="#/quiz">Quiz</a> / ${UI.escapeHtml(mod.title)}</div>
    <h1>${UI.escapeHtml(mod.title)}</h1>
    <div class="session-progress" style="margin-bottom:16px;">Question ${session.index + 1} of ${session.questions.length}</div>

    <div class="card">
      <div class="quiz-question">${UI.escapeHtml(q.question)}</div>
      <div id="quiz-options">
        ${q.options.map((opt, i) => `<button class="quiz-option" data-i="${i}">${UI.escapeHtml(opt)}</button>`).join("")}
      </div>
      <div class="quiz-explanation" id="quiz-explanation">${UI.escapeHtml(q.explanation || "")}</div>
      <div class="quiz-footer">
        <span class="session-progress">Score so far: ${session.correctCount}/${session.index}</span>
        <button class="btn" id="next-btn" style="display:none;">Next</button>
      </div>
    </div>
  `;

  container.querySelectorAll(".quiz-option").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (session.answered) return;
      session.answered = true;
      const chosen = Number(btn.dataset.i);
      const wasCorrect = chosen === q.correctIndex;
      if (wasCorrect) session.correctCount += 1;
      Storage.recordQuizAnswer(q.id, wasCorrect);

      container.querySelectorAll(".quiz-option").forEach((b, i) => {
        b.disabled = true;
        if (i === q.correctIndex) b.classList.add("correct");
        else if (i === chosen) b.classList.add("incorrect");
      });
      container.querySelector("#quiz-explanation").classList.add("visible");
      container.querySelector("#next-btn").style.display = "inline-block";
    });
  });

  container.querySelector("#next-btn").addEventListener("click", () => {
    session.index += 1;
    session.answered = false;
    renderQuestion(container, mod, session);
  });
}

function renderQuizComplete(container, mod, session) {
  const total = session.questions.length;
  const pct = total ? Math.round((session.correctCount / total) * 100) : 0;
  container.innerHTML = `
    <div class="breadcrumb"><a href="#/quiz">Quiz</a> / ${UI.escapeHtml(mod.title)}</div>
    <div class="quiz-score-summary">
      <div class="big-score">${session.correctCount}/${total}</div>
      <p>${pct}% correct on ${UI.escapeHtml(mod.title)}.</p>
      <div style="display:flex; gap:10px; justify-content:center; margin-top:20px;">
        <button class="btn" id="retry-btn">Retry Quiz</button>
        <a class="btn btn-secondary" href="#/quiz">Choose Another Module</a>
        <a class="btn btn-secondary" href="#/dashboard">View Progress</a>
      </div>
    </div>
  `;
  container.querySelector("#retry-btn").addEventListener("click", () => {
    renderQuiz(container, mod.id);
  });
}
