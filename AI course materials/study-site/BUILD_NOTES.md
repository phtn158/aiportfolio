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

## 2026-08-26 — Scheduled content-update run: RAG module (Weeks 13–14)

**New source files found in the workspace folder, not present in `meta.generatedFrom`:** `JHU_Week 13_RAG.pdf` ("Introduction to RAG" — limitations of generative-only and retrieval-only systems, RAG fundamentals, BERT-vs-GPT-vs-RAG comparison, RAG vs. traditional/generative search, real-world applications, and a second short deck on RAGAs for component-level evaluation), `JHU week 14_Slides.pdf` ("Advanced RAG: Code Walkthrough" — the three levers for improving RAG: transform the data, transform the retrieval, transform the query), and `14_Slides_v14.1.pdf` ("Welcome to the Multimodal RAG" — multimodal RAG definition, the 4-stage pipeline, a robotics/GPT-4V worked example, and multimodal-specific challenges). These are a JHU-track continuation (Weeks 13–14) picking up after the original Weeks 6–8 material.

Extracted all three with `pdftotext -layout` (895 lines combined; the RAG deck in particular has heavy repeated per-slide watermark/footer boilerplate that was filtered out during authoring, not treated as content).

**New module added: `rag` — "Retrieval-Augmented Generation (RAG)"**, inserted after `architecture-reference` and before `claude-cowork` in the module sequence (reference-style material, not a task-flow module — RAG is a cross-cutting architecture/technique, not a task type). Placed after `architecture-reference` specifically because it builds directly on the BERT/GPT family comparison already established there.

**Deduplication check performed first:** a `rag` concept already existed in the `qa` module (prompting-level definition: "retrieve context, inject into prompt, generate"). Rather than re-authoring that definition, the new module's overview concept was dropped and the remaining entries were written to go one level deeper — architecture (BERT retrieval-oriented vs. GPT generation-oriented vs. RAG as their combination), evaluation (RAGAs, Retriever/Generator components), optimization (the three levers), and the multimodal extension — with a cross-reference note added to the `rag-unified-approach` entry pointing back to the `qa` module's entry.

Content added, authored by hand in the established format (`eliForgot` one-liner above each formal definition, `tags.category`/`tags.tool`, worked example):
- **16 dictionary entries** — the two failure modes RAG fixes, retrieval-only models (BM25/TF-IDF), BERT/GPT roles, RAG as a unified approach, the basic RAG pipeline, RAG vs. traditional search, RAG's core strengths, RAGAs, Retriever/Generator components, the three optimization levers, multimodal RAG, the multimodal pipeline, CLIP embedding alignment, GPT-4V, and multimodal RAG challenges. First use of the `Tool` category value (on RAGAs and CLIP) — defined in the original taxonomy but not yet exercised by any existing entry.
- **8 flashcards** and **6 quiz questions**, same ID-prefix convention as existing modules (`fc-rag-N`, `q-rag-N`).

No formulas were added for this module — the source decks are conceptual/architectural, not formula-based (consistent with `dspy`, which also has none).

Ran the same validation as the original build script (no duplicate concept/flashcard/quiz IDs, every quiz `correctIndex` in range, every `moduleId` reference resolves, module-level counts match actual content) before merging into `content.json`. All checks passed.

**Updated totals: 181 dictionary entries, 92 flashcards, 64 quiz questions across 13 modules.**

Existing content, topic order, and the localStorage progress schema were untouched — this was a pure addition.

**Not done as part of this run (by design):** Netlify redeploy. The workflow only updates the local site files; deploying is a separate manual/git step.

## 2026-08-28 — Scheduled content-update check: no new material

Checked the workspace folder against `content.json`'s `meta.generatedFrom` (11 source files — the original 5, the 3 Claude Ecosystem sessions, and the 3 RAG-module decks added 2026-08-26). All 11 files present in the folder are already tracked, and none have a modification date newer than the 2026-08-26 processing entry above. No new or changed PDFs found — no content added, site untouched.

## 2026-09-04 — Scheduled content-update check: no new material

Checked the workspace folder against `content.json`'s `meta.generatedFrom` (11 source files, unchanged since 2026-08-26). All 11 files present in the folder are already tracked, and none have a modification date newer than the 2026-08-26 processing entry. No new or changed PDFs found — no content added, site untouched.

## 2026-09-11 — Scheduled content-update check: no new material

Checked the workspace folder against `content.json`'s `meta.generatedFrom` (11 source files, unchanged since 2026-08-26). All 11 files present in the folder are already tracked, and none have a modification date newer than the 2026-08-26 processing entry. No new or changed PDFs found — no content added, site untouched.

## 2026-10-05 — Scheduled content-update run: Secure & Responsible Gen AI (Weeks 11–12) + Agents & LangGraph (Week 13)

**New source files found in the workspace folder, not present in `meta.generatedFrom`:**
- `Week 11 Lecture Slides.pdf` (2026-09-18). "Secure and Responsible Gen AI": human-baseline vs. risk-based adoption (kidney-transplant decision study, loss framing), the F.A.I.R. S.T. ethics principles, bias feedback loops (predictive policing, medical algorithms), integrity/explainability, competence vs. hallucination, OWASP LLM Top 10 risks mapped to the CIA triad, GDPR and China's PIPL, mitigation at model/system/application level, and RAI monitoring.
- `week12 -  SecureAndResponsibleGenAISolution/Week 12 AGAAI Post MLS.docx.pdf` (2026-09-19). Hands-on handbook: building a guarded legal-aid case-status assistant (three data buckets, grounded reasoning prompt, input screening, output masking + work-product deny-list, Llama Guard moderation, leak-count and paired fairness evaluation) via the generate → review → refine AI-assisted coding loop.
- `week13 - buildingSingleAgentSystem/AGAAI Week 13 Slides 1.pdf` and `AGAAI Week 13 Slides 2.pdf` (2026-09-24). Agentic AI intro, history of "agents", agents vs. workflows, agentic frameworks, single vs. multi-agent systems, the AI Email Assistant pipeline, and LangGraph (State/Nodes/Edges/StateGraph, the five components, the four design patterns).

First time new material arrived in **subfolders** rather than the folder root. The scan now walks subfolders. The two Week 14 RAG decks (`14_Slides_v14.1.pdf`, `JHU week 14_Slides.pdf`) also moved into a `week14/` subfolder, but their modification dates are unchanged (2026-08-20) and they're already tracked by filename, so they weren't reprocessed.

Extracted all four PDFs with `pdftotext -layout` (2,902 lines raw; per-page copyright/watermark footers and personal-licence stamps were stripped and never copied into content). The Week 11 deck is largely image-based, so a few sections (e.g., Fairness/Robustness detail slides) had little extractable text. Content was authored only from what the text layer supports. The companion notebooks (`Basic_Graph.ipynb`, `LangGraph_Design_Patterns.ipynb`) were read only to make the LangGraph code-reference snippets match the course's actual API usage (`StateGraph`, `add_conditional_edges`, `bind_tools`, `ToolNode`, `tools_condition`, `add_messages`). They aren't tracked as content sources. The other lab files (`.ipynb`, `.json`, `.csv`) were not processed.

**Two new modules**, inserted after `rag` and before `claude-cowork`:
- **`responsible-ai` — "Secure & Responsible Gen AI"**: 30 dictionary entries, 12 flashcards, 8 quiz questions.
- **`agents-langgraph` — "Agents & LangGraph: Building Single-Agent Systems"**: 22 dictionary entries, 10 flashcards, 8 quiz questions.

Placement reasoning: both are cross-cutting reference material (like `rag`), not task-flow modules, so they go after the reviewed task-flow sequence. Responsible AI comes first (Weeks 11–12 precede Week 13). Agents & LangGraph sits directly before `claude-cowork` because Cowork's agentic loop is the product-level version of the same ideas.

**Deduplication / cross-references** (no existing entries edited):
- `competence-vs-hallucination` points to the existing `hallucination-types` (QA) instead of repeating that taxonomy.
- `jailbreaking` / `prompt-injection` go deeper than the one-line mention in `adversarial-testing` (Eval Rigor) and reference it.
- `agentic-ai` references `what-makes-work-agentic` (Claude Cowork). `agent-pattern` is framed as the graph form of the existing `react-prompting`. `reasoning-traces` builds on `chain-of-thought`. `langgraph-messages` / `langgraph-tools` reuse the existing `langchain` tool tag.

**Formula / code reference panel:** 9 new entries. GDPR max-fine formula, leak-rate / over-refusal metric, input-gate logic, and LangGraph snippets for State, edges, StateGraph build/compile, tool binding + `tools_condition`, the `add_messages` reducer, and checkpointer memory. Snippets are single-line because `.concept-formula` doesn't preserve line breaks.

**New tool tags:** `langgraph`, `detoxify`, `llm-guard` (plus existing `spacy`, `langchain`). Second use of the `Tool` category (`langgraph`).

**Quiz note:** quiz options aren't shuffled at render time, so correct answers in the 16 new questions were placed evenly across positions 0–3 (4 each). That avoids a guessable pattern.

Ran the build validation: no duplicate module/concept/flashcard/quiz IDs, every `correctIndex` in range, every `moduleId` resolves, module counts match content, and every pre-existing entry is byte-identical and in its original order. Also ran the jsdom smoke test (real app modules against a real DOM). Home renders 15 module cards. Both new module, quiz and flashcard views render. The formulas page shows the new snippets. Search finds "llama guard", "tools_condition", "owasp", "gdpr", "reducer" (and "kappa" still works). A pre-seeded `studySiteProgress_v1` save kept its flashcard/quiz history.

**Updated totals: 233 dictionary entries, 114 flashcards, 80 quiz questions across 15 modules.**

Existing content, topic order, and the localStorage progress schema were untouched. This was a pure addition.

**Not done as part of this run (by design):** Netlify redeploy.
