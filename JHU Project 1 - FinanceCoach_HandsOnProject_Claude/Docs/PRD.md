# Product Requirements Document: Personal Finance Coach

**Owner:** Tiffany Pham Nguyen, ThuWork Digital Solutions
**Status:** Draft v2 — repositioned from course prototype to professional portfolio product
**Last updated:** 2026-10-05

## 1. Summary

Personal Finance Coach turns a raw bank-statement CSV into an explained picture of where money goes, how long a discretionary budget will last, which optional changes would matter most, and a conversational coach that answers follow-up questions using only the user's own analyzed data.

It is a ThuWork product demonstration. It shows prospective clients and hiring managers a complete, user-facing AI product: messy data in, trustworthy insight out. Several AI and ML techniques work together in one product: LLM classification, interactive visualization, regression forecasting, statistical anomaly and recurrence detection, and grounded, session-scoped conversation. Each has an evaluation behind it.

## 2. Problem

Budgeting tools usually fail at the first step. Before showing anything useful, they ask users to clean up and tag their transactions. Bank descriptors are cryptic (`SQ *BLUE BTL 0423 OAKLAND CA`, `AMZN Mktp US*2K4L19`), and typical users have 60–150 transactions a month. Many people give up before they see value. Tools that do categorize automatically still tend to stop at static charts. They don't answer the real question, "Am I going to make it to the end of the month, and what should I change?"

## 3. Audiences

### Product users (in-product personas)

| Persona | Situation | Core need |
|---|---|---|
| **Early-career professional** | Salaried, card-heavy spending, frequent dining and subscriptions | "Where is my money actually going, and what's the easiest thing to cut?" |
| **Variable-income freelancer** | Irregular deposits, mixed personal/business spend | "Given how I've been spending, how long will this month's budget last?" |
| **Household budgeter** | Family spending across groceries, kids, utilities | "Which categories are drifting, and what would a realistic adjustment save?" |

These personas also become the synthetic demo datasets (see `SYNTHETIC_DATA_SPEC.md`).

### Portfolio audiences (people evaluating the work)

- **Agency prospects** (ThuWork phase-1 small-business owners and, later, larger firms): want to see that ThuWork can ship a polished, safe, AI-powered product, not a notebook.
- **AI product hiring managers**: want evidence of product judgment, including scoping, evaluation, trade-offs, responsible AI, and measurable quality.

## 4. Goals and Non-Goals

### Goals
1. **Fast time to first insight:** from data to a categorized dashboard with no manual tagging.
2. **Trustworthy AI:** every category, forecast, and coach answer shows its basis and its uncertainty.
3. **Actionable guidance:** ranked, optional spending scenarios, unusual-charge alerts, and a subscription review shortlist, all with transparent reasons.
4. **Grounded conversation:** a coach that answers from computed analysis, says when it doesn't know, and never leaks across sessions.
5. **Portfolio-grade delivery:** a public, polished web app with published evaluation results and a case study.

### Non-Goals
- Live bank connections (Plaid and similar), credential collection, payments, or money movement.
- Investment, tax, legal, lending, or credit advice.
- User accounts, cross-session persistence, or multi-tenant production hosting.
- Claims about business impact (retention, churn) that the product cannot measure.

## 5. Success Metrics

The launch gate covers metrics measured by the evaluation plan (`EVALUATION_PLAN.md`). All of them must be met before the public launch.

| Area | Metric | Target |
|---|---|---|
| Time to insight | Sample persona → dashboard | < 5 s |
| Time to insight | 2,000-row uploaded CSV → dashboard (LLM path) | < 60 s |
| Categorization | Accuracy on labeled golden set | ≥ 90% overall; no category < 75% |
| Categorization | Share of transactions needing LLM (vs. rules/cache) | Reported; target < 40% |
| Forecast | MAE vs. naive baseline on chronological backtest | Beats baseline on ≥ 3 of 4 personas; otherwise the forecast is suppressed for that case |
| Unusual charges | Precision / recall on anomalies injected into synthetic data | ≥ 80% / ≥ 70% |
| Subscriptions | Precision / recall on labeled recurring charges | ≥ 90% / ≥ 85% |
| Coach | Groundedness (claims supported by session analysis) | ≥ 95% on coach eval set |
| Coach | Fabricated transactions/amounts | 0 in eval set |
| Coach | Correct refusal/redirect on out-of-scope advice and injection prompts | 100% on eval set |
| Privacy | Prohibited fields in LLM payloads/logs | 0 (automated test) |

**Portfolio hypotheses (not measured by this product):** faster time to insight and personalized guidance would improve engagement and retention in a real finance app. These appear in the case study as hypotheses only.

## 6. Scope

### MVP
1. **Start options:** pick a sample persona, or upload a CSV (opt-in, with a privacy disclosure).
2. **Import and validation:** auto-detect supported schemas, map columns, parse dates/amounts, and report rejected or questionable rows.
3. **Categorization:** a rules → MCC → LLM cascade into a fixed taxonomy, with confidence and provenance on every transaction.
4. **In-session category correction:** the user can recategorize a transaction or merchant; analysis recomputes. Corrections are not persisted after the session.
5. **Dashboard:** spend by category and over time, period selector, discretionary vs. essential split, data-quality summary.
6. **Budget runway forecast:** projected days until the monthly discretionary limit is reached, with a range, the method, and an unavailable state when the data is insufficient.
7. **Spending scenarios:** ranked category-level reductions with estimated monthly savings and the effect on runway.
8. **Unusual-charge alerts:** flag charges that are out of pattern for this user, such as a far larger amount than usual at a merchant, a possible duplicate charge, a large first-time merchant, or a price increase on a recurring charge. Each flag states its reason in plain language.
9. **Subscriptions and cancellation shortlist:** detect recurring charges (weekly/monthly/annual), show next expected date and monthly-equivalent cost, and rank an optional "review these" shortlist.
10. **Coach:** multi-turn chat grounded in the session's analysis, with suggested starter questions, a visible "based on" context, reset, and a disclaimer.
11. **"How it works" panel:** plain-language explanation of each AI component, its data use, and its eval results.

### Later (post-launch, not committed)
- Additional bank export formats (OFX/QFX).
- Optional accounts with persisted corrections.

## 7. Supported Inputs

| Format | Description | Use |
|---|---|---|
| **Generic bank CSV** | `date`, `description`, `amount` (+ optional `category`, `account`, separate debit/credit columns) with header aliases | Primary upload format; synthetic personas use this |
| **Card-network schema** | The existing dataset schema (`date`, `amount`, `mcc`, `merchant_id`, …) | Shows multi-schema ingestion; MCC-driven categorization |

Limits for public uploads: CSV only, ≤ 5 MB, ≤ 10,000 rows, up to 24 months of history.

## 8. Primary User Flow

1. The user lands on the product page, which states the value proposition, the privacy promise, and "Try a sample" / "Upload your CSV".
2. **Sample path:** the user picks a persona and the dashboard loads instantly with precomputed categories.
   **Upload path:** the user reads the disclosure and uploads. The app shows a validation report (rows accepted, rejected, and why), then categorizes, showing progress.
3. On the dashboard the user sees totals, the category breakdown, a trend chart, the limit in use (editable), and a data-quality badge.
4. The user reviews the runway forecast: the projected date, the range, the method, and its assumptions. If the data is insufficient, the forecast panel explains why instead of showing a number.
5. The user reviews the ranked scenarios. Toggling a scenario shows the updated runway.
6. The user reviews unusual-charge alerts and the subscription list. Shortlisted subscriptions can be added to scenarios with one click.
7. The user asks the coach follow-up questions. Answers cite the figures they rely on.
8. The user can reset at any time. All session data is discarded.

## 9. Functional Requirements

### 9.1 Import
- FR-1: Detect the schema from headers using an alias map. When detection fails, show the required columns and an example.
- FR-2: Parse amounts (currency symbols, thousands separators, parentheses, separate debit/credit columns) and dates (common US/ISO formats) without silently dropping rows. Every rejected row is counted, with a reason.
- FR-3: Apply an explicit field allowlist at ingestion. Discard non-allowlisted columns before any further processing. For example, if an upload contains `date, description, amount, account_number, balance, address`, keep only `date, description, amount`, and drop the rest immediately after parsing. Dropped columns are never categorized, displayed, logged, or sent to the LLM. The validation report lists the dropped column *names* (never their values).
- FR-4: Detect exact duplicate rows and report them.

### 9.2 Categorization
- FR-5: Assign every eligible transaction one category from the fixed taxonomy (defined in `DATA_DICTIONARY.md`), plus `confidence` (high/medium/low) and `source` (rule / mcc / llm / user / fallback).
- FR-6: Order of precedence: user correction → deterministic rules (known merchants, transfers, income) → MCC map → LLM → `Uncategorized` fallback.
- FR-7: Send the LLM only normalized descriptors and amount sign. Deduplicate descriptors so each unique merchant string is classified once per session.
- FR-8: If the LLM is unavailable or times out, the dashboard still loads using rules/MCC/fallback, and a banner states that categorization is limited.
- FR-9: Treat descriptor text as untrusted data. Embedded instructions must have no effect.

### 9.3 Analytics and dashboard
- FR-10: Spend excludes income, transfers between own accounts, and card payments. Refunds net against their category. The UI shows these rules.
- FR-11: Totals reconcile exactly with the sum of eligible parsed transactions (automated test).
- FR-12: The discretionary limit defaults to the persona's value. For uploads, the user enters it. The app never infers a limit silently.

### 9.4 Forecast
- FR-13: Model daily discretionary spend from the user's own history. Evaluate on a chronological holdout against a naive baseline (trailing average).
- FR-14: Show a numeric runway only when there are at least 60 days of history, the model beats the baseline on the holdout, and the projected spend is positive. Otherwise show a specific unavailable reason.
- FR-15: Display the projected date as a range, along with the method and assumptions.

### 9.5 Scenarios
- FR-16: Rank discretionary categories by estimated monthly savings from a stated reduction (default 10–25%, adjustable). Show the effect on runway. Never double-count across scenarios.
- FR-17: Use optional, non-judgmental language. No scenario is described as required or guaranteed.

### 9.6 Unusual-charge alerts
- FR-18: Flag a charge when it is unusual relative to the user's own history: the amount is far above that merchant's or category's typical range, the same merchant and amount appear twice within 3 days, a large charge comes from a never-seen merchant, or a recurring charge's price increased.
- FR-19: Every flag shows its reason and the comparison it is based on (e.g., "$214 at Shell — your usual there is $35–$60").
- FR-20: Cap the number of flags shown (default: top 10 by severity) so alerts stay useful. The user can dismiss a flag for the session.
- FR-21: Alerts are informational ("worth a look"). They never state or imply fraud.

### 9.7 Subscriptions and cancellation shortlist
- FR-22: Detect recurring charges by grouping normalized merchants and checking for a regular cadence (weekly, monthly, annual) and a stable amount (within a tolerance).
- FR-23: For each subscription, show the merchant, cadence, last amount, monthly-equivalent cost, next expected date, and any price change.
- FR-24: Rank an optional shortlist to review using transparent signals: monthly-equivalent cost, recent price increase, or overlapping services in the same sub-category (e.g., several streaming services). Show the signal behind each item.
- FR-25: The app never cancels anything or links to account actions. Shortlist items can feed directly into spending scenarios.

### 9.8 Coach
- FR-26: Answer from a structured session context (aggregates, forecast, scenarios, alerts, subscriptions) and from tool calls into the analytics layer. Do not send the raw transaction dump.
- FR-27: When the data cannot answer a question, say so. Never invent transactions, merchants, or amounts.
- FR-28: Decline investment, tax, legal, and credit advice and redirect politely. Show the educational disclaimer.
- FR-29: Conversation memory is scoped to one session, can be cleared by the user, and expires automatically.

## 10. Non-Functional Requirements

- **Privacy:** uploads are processed in memory and never written to disk or logs. Payloads to the LLM are minimized. See `PRIVACY_AND_SECURITY_REQUIREMENTS.md`.
- **Reliability:** core analysis works with the LLM disabled.
- **Performance:** meets the time-to-insight targets in §5.
- **Cost control:** per-session and global LLM budget caps, plus rate limiting on public endpoints.
- **Accessibility:** WCAG 2.2 AA for color contrast, keyboard navigation, and chart text alternatives.
- **Responsiveness:** usable at 375 px mobile width and up.
- **Maintainability:** ingestion, categorization, analytics, forecasting, anomaly detection, subscription detection, recommendations, and coach are separate, tested modules.
- **Explainability:** the date range, limit, category rules, and forecast basis are always visible next to results.

## 11. Risks and Mitigations

| Risk | Mitigation |
|---|---|
| Wrong LLM categories erode trust | Constrained taxonomy, structured output, confidence labels, in-session correction, published accuracy |
| Misleading forecast | Backtest gate vs. baseline, ranges not points, suppression with a reason |
| Too many or false unusual-charge alerts cause alarm or alert fatigue | Thresholds tuned on injected anomalies, top-10 cap, plain-language reasons, "worth a look" framing, no fraud claims |
| Missed or false subscriptions | Cadence + amount-tolerance rules evaluated on labeled data; show the evidence (dates, amounts) behind each detection |
| Coach hallucination or bad advice | Grounded context and tools, refusal policy, eval set with zero-fabrication target |
| Users upload real financial data publicly | In-memory only, minimized LLM payloads, clear disclosure, size/row limits, no logging of content |
| Public endpoint abuse or LLM cost spikes | Rate limits, upload limits, per-session token caps, global spend cap |
| Overstated impact in portfolio | Separate measured eval results from hypotheses in the case study |

## 12. Resolved Decisions

These replace the open questions from the previous draft. The rationale for each is in `DECISIONS.md`.

| Question | Decision |
|---|---|
| Formats beyond the supplied schema? | Generic bank CSV (primary) plus the card-network schema |
| Limit period? | Monthly; amount editable by the user |
| Discretionary taxonomy, refunds, transfers? | Fixed taxonomy with a discretionary flag; refunds net against category; transfers/income/card payments excluded |
| Category correction? | Yes, in-session only; not persisted |
| LLM provider? | Anthropic Claude API (no training on API data by default); smaller model for categorization, larger for coach |
| Forecast threshold? | ≥ 60 days of history and must beat the naive baseline on holdout |
| Stack? | Next.js frontend + FastAPI (Python) backend |
| Unusual charges and subscriptions? | In MVP; rules-based/statistical (no LLM needed), evaluated on synthetic data with injected cases |
| Product name? | Keep "Personal Finance Coach" (descriptive; clearest for portfolio readers) |
| Case study visibility? | Public on the agency site and PM portfolio |
| Demo data? | Generated synthetic personas; the original dataset is used only as a format/pattern reference and stays local |

## 13. Open Questions

- Where the Python backend runs (Render, Railway, or Fly.io) and the monthly cost ceiling for hosting + Claude API usage.
- Whether category corrections should be remembered in the user's own browser (no server storage) — see `DECISIONS.md`.

## 14. Related Documents

- [Data Dictionary](DATA_DICTIONARY.md) · [Synthetic Data Spec](SYNTHETIC_DATA_SPEC.md)
- [AI System Spec](AI_SYSTEM_SPEC.md) · [Evaluation Plan](EVALUATION_PLAN.md)
- [Technical Design](TECHNICAL_DESIGN.md) · [Decisions](DECISIONS.md)
- [UX Spec](UX_SPEC.md) · [Privacy and Security Requirements](PRIVACY_AND_SECURITY_REQUIREMENTS.md)

