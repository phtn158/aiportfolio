# Build Notes

Real build history, in order, deviations included. See [SPEC.md](./SPEC.md) for the resulting architecture and [README.md](./README.md) for how to run/extend it.

## 2026-08-12 — Scoping & structure

Started from 5 source PDFs (Week 6 LLM/Transformers slides, Week 7 Prompt Engineering, JHU NLP intro slides, Week 8 task-type slides, and an Eval Prompts deck covering evaluation methodology and DSPy).

First structure draft mirrored the program's actual lecture order: NLP fundamentals → RNN/attention/transformer theory → model families (BERT/GPT/T5) → prompting → task types → evaluation → DSPy. On review, this read as a syllabus, not something to actually study *from* — technically correct but not memorable.

Revised to a practice-first structure (Do → Measure → Understand), then revised again to the final structure: **task-flow first**. Six task-type modules (Classification, Summarization, QA, Translation, Code Generation, Speech-to-Text), each following an identical repeatable pattern — task definition, traditional vs. GenAI approach, how to prompt it, how to evaluate it — with shared prerequisites (Foundations, Core Prompting Skills) up front and cross-cutting material (Evaluation Rigor, DSPy) and full architecture depth pushed to the end as reference material rather than gating content. This mapped naturally onto the Eval Prompts deck, which already organizes its evaluation rubrics per task type.

Added a concept taxonomy on top of the structure: every dictionary entry tagged by **category** (Technique / Metric / Tool / Model-Architecture / Parameter / Concept) and by **tool** — including the actual Python package that implements it (e.g. `scikit-learn` for F1/Cohen's κ, `ragas`/`deepeval` for faithfulness eval, `dspy` for the DSPy module), not just named frameworks like LangChain. This powers dictionary filtering and a per-module "Concepts & Tools used here" summary box.

## 2026-08-12 — Content authoring

Extracted all 5 PDFs with `pdftotext -layout` (338 slides total) and authored the content by hand into module-scoped JSON files, then merged into one `content.json` with a Python script that also validates: no duplicate concept/flashcard/quiz IDs, and every quiz `correctIndex` actually points at a valid option.

Final content: **147 dictionary entries, 76 flashcards, 52 quiz questions** across 11 modules.

## 2026-08-12 — Site build

Built as static HTML/CSS/JS with ES modules, no build step. Implemented SM-2-style spaced repetition for flashcards (see SPEC.md for why SM-2 over a binary toggle or Leitner boxes), a hash router, site-wide search, the formula/code reference panel, and the weak-spot dashboard.

### Testing approach

No real browser was available in the build environment (network-sandboxed — Puppeteer's Chromium download was blocked). Instead of skipping runtime testing, used `jsdom` to provide a real DOM and `localStorage` implementation, then imported the app's actual ES modules directly into that DOM via Node's native module loader — meaning the real application code ran against a real DOM, not a mock. This caught real bugs (below) that static syntax checking alone would have missed.

### Bugs found and fixed during testing

- **Search couldn't find Cohen's κ by searching "kappa."** The dictionary term uses the Greek letter (κ), so a literal substring search for "kappa" never matched the term itself — only entries whose *body text* happened to spell out the word. Fixed by adding an `aliases` field to the concept schema and indexing it in search; applied to all three IAA metrics (Cohen's κ, Fleiss' κ, Krippendorff's α).
- **"Study Days" counter never counted the first day.** `defaultState()` pre-set `lastVisit` to today at creation time, so the visit-tracking check (`if lastVisit !== today`) was already "true" before the user had done anything, and the very first visit was never pushed into the visit-history array. Fixed by initializing `lastVisit` to `null` so the first real visit always registers.
- **"Practice Again" / "Retry" buttons on session-complete screens were implemented as `<a href="#/flashcards/:moduleId">` links.** Since the hash never actually changes during a session (the app re-renders manually via JS, not via navigation), clicking a link back to the *same* hash doesn't fire a `hashchange` event — the router never re-runs, and the button silently does nothing. Fixed by replacing those with real `<button>` elements that call the render function directly instead of relying on hash navigation.

All three were confirmed fixed by re-running the interaction test end-to-end (flip → grade → verify `localStorage` state → render dashboard → verify weak-spot list; complete a full flashcard/quiz session → click Practice Again/Retry → verify a new session actually starts).

### What's next

- Netlify deploy + add the live link to README.md.
- Portfolio page write-up (Problem / My Role & Approach / What It Does / Outcome / What I'd Do Differently / What's Next), once the deployed site has been used for a week or two of real studying.
- First scheduled Friday content-update run, to validate the update workflow against a real new-material drop rather than just its written spec.

## 2026-08-12 — Scheduled content-update run: Claude Ecosystem & Agentic Workflows module

This is the first real run of the scheduled weekly update workflow referenced above — validated against an actual new-material drop rather than just its spec.

**New source files found in the workspace folder, not present in `meta.generatedFrom`:** `Session 1 - The Claude Ecosystem__From Answers to Workflows.pdf`, `Session 2 - Prompt Engineering - Thinking Clearly with Claude.pdf`, `Session 3 - Claude Cowork & Agentic Workflows - AI That Works With You.pdf`. These are a different course track (practitioner training on the Claude product itself) from the original 5 NLP/LLM academic decks — different naming convention (`Session N` vs `Week N`), different subject matter.

Extracted all three with `pdftotext -layout` (1,241 lines combined). Content didn't fit any existing task-flow module — it's about *how to work with Claude* (product layers, model selection, agentic execution) rather than an NLP task or evaluation technique — so it became a new module, **`claude-cowork` — "Working With Claude: Ecosystem & Agentic Workflows,"** appended at the end of the module sequence alongside the other reference-style material (Eval Rigor, DSPy, Architecture Reference) rather than inserted mid-sequence, to avoid disturbing the reviewed task-flow ordering.

Content added, authored by hand in the established format (`eliForgot` one-liner above each formal definition, `tags.category`/`tags.tool`, worked example):
- **18 dictionary entries** — ecosystem layers (Chat/Cowork/Code), AI-as-consultant vs. workflows, multimodal input, Claude model tiers (Haiku/Sonnet/Opus), Extended vs. Adaptive Thinking, system prompt design (Role/Tone/Constraints/Format), the Connectors ecosystem, Cowork's six core capabilities, the Agentic Loop, human oversight mechanisms, Claude Skills, CLAUDE.md, sub-agent coordination, and what makes a workflow "agentic."
- **8 flashcards** and **6 quiz questions**, same ID-prefix convention as existing modules (`fc-cowork-N`, `q-cowork-N`).

No overlap with existing `core-prompting` concepts (e.g. Chain-of-Thought, prompt evaluation criteria were already covered generically) — the new entries are Claude-product-specific, not duplicated technique explanations.

Ran the same validation as the original build script (no duplicate concept/flashcard/quiz IDs, every quiz `correctIndex` in range, every `moduleId` reference resolves, module-level counts match actual content) before merging into `content.json`. All checks passed.

**Updated totals: 165 dictionary entries, 84 flashcards, 58 quiz questions across 12 modules.**

Existing content, topic order, and the localStorage progress schema were untouched — this was a pure addition.

**Not done as part of this run (by design):** Netlify redeploy. The workflow only updates the local site files; deploying is a separate manual/git step.

## 2026-08-14 — Scheduled content-update check: no new material

Checked the workspace folder against `content.json`'s `meta.generatedFrom` (8 source files: Eval Prompts, JHU 5_Slides_NLP, Week 6/7/8, Session 1–3). All 8 are already tracked, and none have a modification date newer than the last processing entry above. No new or changed PDFs found — no content added, site untouched.
