# Spec

## Why this exists

Studying from a stack of lecture-slide PDFs doesn't build retention — concepts are scattered across five decks, formats are inconsistent, and there's no mechanism for noticing what you keep getting wrong. This project turns those PDFs into one structured, testable, self-updating study surface.

**User:** a single learner (me) working through an Applied Generative AI program, wanting to review, drill, and self-test between lectures — on a phone or laptop, without setting up an account anywhere.

**Goals**
- Every concept from the program lives in one searchable, taggable dictionary.
- Retention is actively measured and improved via spaced repetition — not just "read it once and hope."
- New weekly material can be folded in without restructuring what's already built.
- The build itself is a legible case study: a real content pipeline (PDF → structured data → multiple UI surfaces), not just a static page.

**Non-goals** (explicit, not oversights)
- No accounts, no login, no multi-device sync. Single learner, single browser, by design — see [Decision: localStorage over a backend](#decision-localstorage-over-a-backend).
- No LLM-generated content at runtime. All dictionary/flashcard/quiz content is authored once from source material and stored statically; the site itself makes no API calls.
- No mobile app. A responsive static site covers the actual use case (reviewing between classes) without the overhead of a second codebase.

**Success criteria**
- A new week's PDF can go from "in the materials folder" to "reflected in the dictionary/flashcards/quiz" in one focused editing pass, without touching the site's code.
- Flashcards actually resurface previously-missed cards more often than freshly-correct ones (verifiable by inspecting `localStorage` state).
- The weak-spot dashboard surfaces real signal (misses), not just raw exposure counts.

## Architecture

Static HTML/CSS/JS, no build step, no framework, no backend. `index.html` is a shell (`<header>` with nav + search, `<main id="app">`) and everything inside `#app` is rendered by vanilla JS in response to hash-based routing (`#/dictionary`, `#/flashcards/:moduleId`, etc.).

### Decision: static site + localStorage over a framework + backend

**Considered:** a React/Next app with a small backend (Supabase, Firebase) for auth and cross-device progress sync.

**Chose:** plain HTML/CSS/JS + `localStorage`, deployed as a static Netlify site with zero build step.

**Why:** the actual requirement is "one learner reviewing on whatever device they're on right now," not "a product with users." A backend buys account management, sync conflict handling, and hosting cost for a capability (cross-device progress) that isn't actually needed here. The trade-off being accepted explicitly: progress does **not** sync across browsers/devices. If that changes, the single-source-of-truth `content.json` and the `Storage` module's clean interface (`getCardState`, `reviewCard`, `exportProgress`/`importProgress`) are already the seam where a backend would slot in later without a rewrite.

### Single source of truth: `content.json`

Every concept, flashcard, and quiz question is authored once, in `data/content.json`. The Dictionary, Flashcards, Quiz, and Formula Reference views are all just different renderings over the same `concepts` / `flashcards` / `quiz` arrays — there's no separate content system per feature. Adding a concept automatically makes it searchable and taggable; adding a flashcard automatically makes it eligible for spaced repetition; nothing needs to be wired up per-view.

**Concept schema:**

```json
{
  "id": "cohens-kappa",
  "term": "Cohen's κ",
  "aliases": ["Cohen's kappa", "kappa"],
  "moduleId": "eval-rigor",
  "tags": { "category": ["Metric"], "tool": ["scikit-learn"] },
  "eliForgot": "A fairer version of \"percent agreement\" that subtracts out the agreement you'd expect just from random luck.",
  "definition": "The standard metric for two-rater agreement on categorical labels, correcting for expected-by-chance agreement...",
  "formula": "κ = (P₀ − Pₑ) / (1 − Pₑ)",
  "example": "100 items, labels (+, −): P₀ = 0.85, Pₑ = 0.50 → κ = 0.70 (Substantial agreement)."
}
```

`aliases` exists because formal terms using Greek letters (κ, α) don't literally contain the word a learner would type (see [Build Notes](./BUILD_NOTES.md) for the bug this fixed). `tags.category` and `tags.tool` power dictionary filtering, the formula panel, and each module's "Concepts & Tools used here" summary box.

### Content structure: task-flow first, not course-chronology

The 5 source PDFs follow the program's actual lecture order (NLP fundamentals → transformer architecture → prompt engineering → task types → evaluation). Mirroring that order in the site initially felt logical but proved confusing to actually study from — it reads like a syllabus, not a reference. The site instead organizes around **what you're trying to do**: Foundations (brief) → Core Prompting Skills (shared toolkit) → six Task-Flow modules (Classification, Summarization, QA, Translation, Code Generation, Speech-to-Text) each following the same repeatable pattern (task definition → traditional vs. GenAI approach → how to prompt it → how to evaluate it) → cross-cutting Evaluation Rigor & DSPy → an optional Architecture Reference for full transformer/BERT/GPT/T5 depth. See [Build Notes](./BUILD_NOTES.md) for how this structure was arrived at.

### Decision: spaced repetition algorithm

**Considered:** a simple binary "got it / didn't" toggle (the naive baseline); a Leitner box system; full SM-2.

**Chose:** a simplified SM-2 (SuperMemo-2), the same family of algorithm Anki is built on.

**Why:** the binary toggle can't express *how* wrong or right an answer was, so it can't prioritize resurfacing intelligently. Leitner boxes are simpler but coarser. SM-2 tracks an ease factor and interval per card and grows the interval when a card is consistently correct, resetting it when missed — giving a real "this card needs work" signal (`missCount`, tracked separately and never reset) that also feeds the weak-spot dashboard. Grading is exposed as three buttons — **Missed it / Shaky / Got it** — mapped internally to SM-2 quality scores 1/3/5, keeping the UI simple while the scheduling underneath is real.

Within a practice session, cards aren't just shown in "due" order — cards with a higher `missCount` get **more copies** in the shuffled practice queue (capped at +4), so a frequently-missed card is more likely to come up again in the same sitting, not just on a future day.

### Analytics: in-app dashboard vs. Netlify Analytics

**Considered:** Netlify's built-in server-log analytics (paid add-on, zero client code, aggregate traffic only) vs. a custom in-app "My Progress" dashboard built from `localStorage`.

**Chose:** the in-app dashboard, described above.

**Why:** Netlify Analytics would show *that* the site was visited, not *what* was learned or missed — it can't see into client-side state at all, and for a single-learner tool, traffic counts aren't the interesting metric. The in-app dashboard directly serves the retention goal (surface what to review next) and required no new infrastructure, consistent with the "no backend" decision above. Netlify Analytics remains a reasonable future add if the site is ever shared publicly and aggregate traffic becomes worth knowing.

### Routing

A ~30-line hash router (`js/router.js`) maps patterns like `#/flashcards/:moduleId` to render functions. No history API, no server-side routing config needed — this is what makes the site deployable as a flat folder with zero Netlify redirect rules.

### Weekly content updates

A scheduled task runs every Friday at 9am to check the connected materials folder for new or changed PDFs, extract their content, and propose additions to `content.json` following the existing schema and tagging conventions — without restructuring or rewriting what's already there.
