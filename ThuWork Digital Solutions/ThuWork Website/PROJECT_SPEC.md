1. Market Intelligence -- DONE
(43% revenue increase, hours saved, 82% grew headcount)
Good instinct — hard numbers build credibility fast. But it's the same issue we just fixed with the badges: no cited source beyond "provided statistics," and "82% grew headcount" might actually worry a solo owner who fears AI replacing their one employee, not motivate them. I'd keep 1-2 of the most relatable stats (hours saved is strongest) and cut or re-source the rest.
    Changes:
    - Replaced the uncited stats with real, sourced numbers: 89% adoption, 91% report revenue growth, 89.7% save time weekly — cited to U.S. Chamber of Commerce 2026 Small Business Survey, U.S. Chamber of Commerce Foundation 2026, and Salesforce 2025 Small Business Trends Report.
    - Added category kickers (Adoption / Revenue Growth / Time Saved) above each number so they're scannable without reading the full sentence first.
    - Gave the adoption stat visual priority — bigger number plus its own "↑ up from 36% in 2023" delta line, since a 2.5x jump is the most striking data point and was previously buried in prose.
    - Decluttered the header by moving the "this describes the market, not our own results" disclaimer down to sit with the source citation, instead of competing with the headline for space.
    - Fixed a CSS bug where the big numbers rendered gray instead of blue — a descendant selector meant only for the description text was also matching the nested count-up number span and overriding its color.

2. "Why ThuWork" -- DONE
("AI should solve a business problem, not create another one")
Fine as a quick palate-cleanser, but forgettable — "connect strategy, technology, and implementation" is consultant-speak that doesn't tell an owner anything concrete. Low priority to fix, but could be tightened or cut since it doesn't add much between two stronger sections.

    Changes:
    - Cut the section entirely — a full section for one line wasn't worth it.
    - Folded the idea into a single supporting sentence under the Capabilities headline instead: "We start with what's actually slowing you down, then build the smallest tool that fixes it — never a system that needs its own IT department to run."

3. Capabilities (Process Automation, Intelligent Assistants, Predictive Analytics, AI Governance) -- DONE
First three are solid and clear. "AI Governance" as a 4th capability sitting next to those is the odd one out — "create practical guardrails for responsible, secure, sustainable AI adoption" sounds like an enterprise compliance service, not something a 5-person business is shopping for. I'd swap it for something more universally needed (e.g., a reporting/insights capability).

    Changes:
    - Swapped "AI Governance" for "Automated Follow-Ups" ("Send reminders, confirmations, and check-ins on autopilot, so no lead or client falls through the cracks") — small-business relevant, distinct from the other 3 cards. Updated the matching footer link and gave it a new icon.
    - Merged "Why ThuWork" and "AI in Action" into this section (see both entries) so the page goes from 3 separate scroll-stops down to 1, with one eyebrow/headline instead of three.

4. AI in Action (Manual Process vs. With ThuWork, step-by-step) -- DONE
This is good content, but it's largely redundant with the hero's before/after workflow visual right above it — same idea, different format, one scroll later. I'd either cut one of the two, or differentiate them clearly (hero = quick visual hook, this = the detailed walkthrough for people who scrolled further).

    Changes:
    - Kept it, but folded it into the Capabilities section instead of cutting — demoted from its own eyebrow+headline to a "SEE IT IN PRACTICE" sub-label inside Capabilities, so it reads as proof of the capability above it rather than a third independent before/after beat.
    - Fixed a real problem found along the way: Manual Process and With ThuWork both listed 5 steps, so the comparison required reading every line to notice a difference. Trimmed "With ThuWork" to 3 steps (merged the logging/routing/follow-up steps into one automated step) so the step-count difference is visible at a glance.
    - Considered two stronger visuals and set both aside for now: a short AI-generated before/after video (real production work outside this session — flagged that it should carry an "illustrative" disclosure if pursued, consistent with the Case Studies/Market Intelligence honesty pattern) and a manual-vs-ThuWork duration bar (days vs. minutes), which was built, previewed, and removed as not actually informative for a client.

5. Industry Applications — this is the biggest problem on the page. -- DONE
Financial Services, Healthcare & Life Sciences, Logistics & Supply Chain, Manufacturing & Energy — these are enterprise verticals with compliance/fraud/fleet-operations language. A solo shop owner reading this will conclude "this isn't for me" and bounce, directly contradicting the "small, owner-operated businesses" positioning everywhere else on the site. This needs to be rewritten around actual small-business categories (e.g., local services, retail/e-commerce, healthcare practices, contractors) or cut entirely.

Context from Tiffany: this section is intentional — it's phase 2 content, meant to show AI helping across every vertical regardless of business size, for when ThuWork targets larger firms. Not a copywriting mistake, but a timing mismatch: phase 2 content living on the current phase 1 (small-business-positioned) homepage.

Changes:
- Commented out the section rather than rewriting or deleting it — the content and markup are intact in `index.html`, wrapped in an HTML comment explaining why, so it can be re-enabled when phase 2 begins instead of being rebuilt from scratch.


6. Case Studies teaser
Good — transparent that these are templates, not verified results, consistent with the honesty on the actual Case Studies page. No notes.

What's Different (Business-First Diagnosis, Built to Integrate, Governance Included, Outcomes You Can Measure)
This is nearly a duplicate of the "Built for Business Outcomes" section we just cut — same structure, and "Governance Included / security, monitoring, responsible-use guardrails" has the identical enterprise-jargon problem. I'd recommend cutting or rewriting this one too, for the same reasons.

How We Work (Discover → Assess → Build → Scale)
Reasonable, but it's a 4-step process here vs. the 3-step "Understand → Build → Launch" in the hero visual — two different step counts for "how we work" on the same page is a small inconsistency worth reconciling.

Engagement preview (Discovery / Build / Scale teaser cards)
No issues — simple, clear teaser into the Packages page.

About ThuWork (dark section, teaser + CTA)
Fine as-is, standard "learn more" pattern.

In Their Words (testimonial placeholder)
Good — same honest "not published until confirmed" pattern as case studies. Consistent and trustworthy.

Final CTA ("Have an AI challenge worth exploring?")
Works fine, though "AI challenge" is a bit abstract compared to the concrete language we landed on elsewhere (hero, workflow box).

My priority order if you want to act on this: (1) fix or cut Industry Applications — it actively undermines your positioning, (2) cut/rewrite "What's Different" (same problem we already fixed once), (3) reconcile the 3-step vs 4-step process discrepancy, (4) everything else is polish, not urgent.