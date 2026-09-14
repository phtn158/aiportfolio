# Market Intelligence section — copy variants

Reference doc for future A/B testing. This is not linked from the site anywhere —
just a holding place for every headline/stat message option we drafted, so nothing
gets lost. "Live" = what's currently in `index.html` today.

---

## Section headline (`<h2 class="word-reveal">`)

**Current in code (not yet changed):** "AI is moving from experimentation to execution."
*(Original placeholder copy — generic consulting phrasing, flagged as not matching the
rest of the site's plain-spoken voice. Never replaced; still live.)*

### Round 1 — neutral/factual tone

1. "Small businesses are already using AI — and it's paying off." — **recommended pick from this round**; most direct match to the 3 stats below it (adoption → revenue → time saved).
2. "This isn't the future. It's already how small businesses work." — punchier, "you're behind the curve" without being pushy.
3. "AI isn't a big-company thing anymore." — directly answers the assumption that AI is only for enterprises (ties to the Industry Applications critique).
4. "The numbers on small business AI, right now." — plainest option, almost a caption; lets the stats do all the persuading.

### Round 2 — direct-to-client, "proven + you're already behind" tone

*(Requested explicitly: message the client directly, state it's proven, imply urgency if not yet onboarded.)*

5. "AI already works for small businesses. If you haven't started, you're already behind." — most literal match to the brief.
6. "The proof is in. The only question is whether you're using it yet." — slightly softer, still direct address.
7. "Small businesses using AI are already ahead of the ones that aren't." — **recommended pick from this round**; states it as market fact rather than a warning, lets stats back it up.
8. "Every business below is proof. The ones that waited are catching up." — most aggressive; explicitly ties headline to the stat cards underneath it.

**Open tension to keep in mind:** Round 2's urgency/FOMO framing is a real departure from the "no jargon, no hype" tone established in the hero and workflow box — worth deciding deliberately per experiment rather than by default.

---

## Stat cards (`.market-grid`, 3 cards)

### Slot 1 — Adoption

**Live:** **89%** — "The Shift Has Already Happened" — of small businesses now use AI in some form, up from 36% in 2023
*Source: U.S. Chamber of Commerce, 2026 Small Business Survey*

No alternates drafted for this slot — single clean stat, no overlap with anything else.

### Slot 2 — Revenue

**Live (combined):** **91%** — "Real Revenue, Not Hype" — report measurable revenue increases from AI, making them 2.3x more likely to grow than non-adopters
*Sources: Salesforce, 2025 Small Business Trends Report & U.S. Chamber of Commerce, 2026*

Alternates (before combining into one message):
- **2.3x** — "The Revenue Growth Multiplier" — AI-adopting small businesses are more likely to report revenue growth than those that don't use it *(U.S. Chamber of Commerce, 2026)*
- **91%** — "Real Revenue, Not Hype" — of small businesses using AI report measurable revenue increases *(Salesforce, 2025 Small Business Trends Report — same title, without the 2.3x clause)*

### Slot 3 — Efficiency

**Live (combined):** **89.7%** — "Real Hours Back" — of small business owners say AI saves them time every week; nearly a third save 6+ hours a week
*Source: U.S. Chamber of Commerce Foundation, 2026 ("Small Business Owners Say AI Is Already Changing Work")*

Alternates (before combining into one message):
- **29.7%** (6+ hrs/week) — "Real Hours Back" — of small business owners save at least 6 hours a week using AI *(most concrete/specific version, echoes hero's "get real hours back" almost word for word)*
- **89.7%** (any time savings) — "Time, Reclaimed" — of small business owners say AI saves them time every week *(broader, vaguer on amount)*

### Optional 4th stat — not currently used (grid is 3 columns)

**59%** — "More Capacity, Not Fewer Jobs" — of workers who gained time from AI used it to do more or better work — not to cut staff
*Source: U.S. Chamber of Commerce Foundation, 2026*

Different job than the other three: preempts the "will this replace my employees" fear rather than being another "look how good AI is" stat. Worth testing if a 4-stat layout is ever tried, or as a swap-in for one of the above.

### Superseded stats (what was live before this round of updates)

For reference — these were replaced because they were unsourced/vague ("Provided statistics on small-business AI adoption"):

- **43%** — "The 20-to-1 Revenue Advantage" — of AI-adopting SMBs see immediate revenue increases, vs. just 2% that see a decline
- **5.6–7 hrs** — "A Full Day Reclaimed Every Week" — average hours a small business owner saves weekly by automating tasks with AI
- **82%** — "A Workforce Growth Multiplier" — of AI-adopting small businesses grew their employee headcount, not shrank it

---

## Sourcing notes (context for whoever runs the experiments)

- All "live" stats trace to two U.S. Chamber of Commerce sources + one Salesforce report — chosen over other candidates (Thryv, vendor-sponsored) for credibility with a skeptical small-business audience.
- The U.S. Chamber's headline adoption number (89%) is a self-reported figure and much higher than the OECD's more rigorous, methodology-controlled estimate (~14% across OECD countries, 2020–2024). Not a reason to avoid the Chamber number, but worth knowing if a visitor ever pushes back on it.
- Federal Reserve independent research put average time savings at a more conservative 2.2 hrs/week (vs. the Chamber's 6+ hrs/29.7% figure) — the more conservative, bulletproof alternative if credibility ever gets challenged hard.
