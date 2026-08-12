# Applied GenAI Study Hub

A personal study site for an Applied Generative AI program: a dictionary, flashcards with spaced repetition, quizzes, a formula/code reference, and a weak-spot dashboard — built from the program's own lecture slides and organized around what you'd actually *do* with the material, not the order it was taught in.

**Live site:** _add your Netlify URL here after deploying_
**Related docs:** [SPEC.md](./SPEC.md) (architecture & decisions) · [BUILD_NOTES.md](./BUILD_NOTES.md) (build history)

## What it does

- **Dictionary** — every concept from the program (147 at initial build), each with a plain-language "explain like I forgot everything" one-liner above the formal definition, tagged by category (Technique / Metric / Tool / Model-Architecture / Parameter / Concept) and by the Python package that implements it.
- **Flashcards** — spaced repetition using an SM-2-style algorithm. Cards you mark "Missed it" or "Shaky" resurface more often; cards you consistently get right space out further apart.
- **Quiz** — multiple choice per module, with an explanation shown after each answer.
- **Formulas & Code Reference** — every formula (Cohen's κ, faithfulness, scaled dot-product attention, softmax, F1) pulled into one lookup page.
- **My Progress** — a weak-spot dashboard aggregating flashcard misses and quiz misses into a "focus on this" list, plus overall stats.
- **Site-wide search** — jump to any concept from the header search bar on any page.

All progress is stored in the browser's `localStorage`. No login, no backend, nothing leaves the device.

## Running locally

This is a static site with ES modules, which browsers block from `fetch()`-ing over `file://`. Serve it with any local web server:

```bash
# from the project root
python3 -m http.server 8000
# or
npx serve .
```

Then open `http://localhost:8000`.

## Folder structure

```
index.html          shell: header, nav, search bar, #app mount point
css/styles.css       all styling
data/content.json    single source of truth — every concept, flashcard, and quiz question
js/
  app.js             bootstraps the app, wires up routes
  router.js           tiny hash router (#/dictionary, #/flashcards/:moduleId, etc.)
  data.js             loads content.json, exposes lookup/search helpers
  storage.js          localStorage wrapper + SM-2 spaced-repetition logic
  ui.js               shared DOM-rendering helpers
  search.js           header search-bar behavior
  views/               one render function per page (home, dictionary, flashcards, quiz, formulas, dashboard, module)
```

## Adding a new week's material

The site is designed to be extended, not rebuilt, each week:

1. Drop the new lecture PDF(s) into the connected materials folder.
2. Extract text (e.g. `pdftotext -layout file.pdf out.txt`) and identify new concepts.
3. Add entries to `data/content.json` following the existing schema (see **Data model** in [SPEC.md](./SPEC.md)) — new concepts, flashcards, and quiz questions, tagged consistently with existing categories/tools. Slot them into an existing module or add a new one to the `modules` array.
4. Log the change in `BUILD_NOTES.md`.
5. Redeploy (see below).

A scheduled task runs every Friday to check for new materials and propose this update automatically.

## Deploying to Netlify

This is a zero-build static site, so deployment is direct:

1. Push this folder to a GitHub repo (or drag-and-drop the folder into the Netlify dashboard).
2. In Netlify: **New site from Git** → select the repo → leave **Build command** blank → set **Publish directory** to `.` (project root).
3. Deploy. No environment variables, no build step, no server needed.

Because progress lives in `localStorage`, it's per-browser — deploying a new version doesn't affect anyone's saved progress unless they clear site data.
