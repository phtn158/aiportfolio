# Business Context:
ClearLedger Inc. is a pre-Series A fintech startup offering a subscription-based personal finance management app to 55,000 millennials and Gen Z users. The company faces a major retention challenge and with competitors expected to launch AI-powered finance coaches soon, ClearLedger has a six-week window to deliver an innovative solution that can strengthen its Series A fundraising narrative.

To address this challenge, ClearLedger plans to build a Personal Finance Coach that combines LLM-based transaction auto-categorization, spending analytics, anomaly detection, and conversational financial coaching. The solution will automatically categorize transactions using off-the-shelf LLM APIs, generate personalized spending insights and visualizations, detect unusual transactions using machine learning, and provide an interactive AI coach that answers questions and recommends actions based on spending behavior. This approach 

# Problem Statement: 
The company faces a major retention challenge: users must manually tag 60–150 transactions before receiving any financial insights. Most users abandon the app before experiencing value, and feedback indicates they want actionable financial guidance rather than static spending reports.

# Objective:
The goal of this project is to build a Python-based Personal Finance Coach that **eliminates the manual effort currently driving ClearLedger's 71% second-session churn**. By the end of the 6-week build window, the application must:
- ingest a user's bank statement CSV, 
- automatically categorize all transactions using an LLM with no manual tagging,
- render an interactive spending dashboard, 
- predict, using a regression model trained on the user's own transaction history: how many days remain before the user reaches their self-set discretionary spending limit. 
- Ranked, category-level spending reduction suggestions that help extend that limit, and surface both the prediction and the recommendations as grounded context within a multi-turn conversational coach.

The broader learning objective is for the builder to demonstrate that four distinct AI capabilities, LLM-based classification, interactive data visualization, regression-based prediction, and stateful memory, can be integrated into a single, coherent, data-driven pipeline rather than treated as isolated exercises. Every architectural decision in the project, from few-shot prompt design to feature engineering and system prompt injection, must be explainable in terms of the business constraint it addresses, not just the technique it employs. By the end of the project, the builder should be able to walk through the complete data flow from raw CSV ingestion to coaching response generation, justify each design choice against viable alternatives, and demonstrate a fully functioning system in a live demo setting.

# Success Measurement:
- eliminates manual tagging
- reduces time-to-first-insight to under five minutes
- improve user retention to 50% while operating within the company’s constraints 

# Constraints:
- limited ML expertise, 
- no labeled training data,  
- strict cost requirements.

# DataFlow

# MVP Components:

1. Data Ingestion & Normalization
CSV loader/validator — parses transactions.csv, coerces amount (strip $), parses date, handles nulls in merchant_state/zip for online transactions.
MCC enrichment — joins mcc → human-readable category label via mcc_codes.json. This is the raw signal the LLM classifier will refine, not a substitute for it (MCC is merchant-level, not the discretionary/essential split the user needs).
User profile loader — pulls monthly_discretionary_limits, income, etc. from users.csv (this field already exists, so it removes one onboarding step — user doesn't need to self-report a limit unless they want to override it).
2. LLM-Based Transaction Categorization (Capability 1)
Category taxonomy definition — fixed small set (Groceries, Dining, Subscriptions, Transport, Discretionary/Shopping, Bills/Utilities, etc.) designed up front since there's no labeled data to derive it from.
Few-shot classification prompt — takes merchant_id/city/MCC description + amount, returns category. Few-shot exemplars substitute for the missing labeled training set.
Batching + caching layer — dedupes by merchant_id+MCC so identical merchants aren't re-classified per transaction; this is the primary lever against the "strict cost requirements" constraint at 700K-row scale.
Confidence/fallback handling — what happens when the LLM is unsure (default to MCC-derived category rather than blocking the pipeline).
3. Spending Analytics Engine (feeds both dashboard and prediction)
Aggregation layer — daily/weekly/monthly spend by category, per user (client_id).
Anomaly detection — flags unusual transactions (statistical, e.g., z-score/IQR on category+merchant spend rather than a trained ML model, given "limited ML expertise" constraint).
Feature store — the per-user time series (daily discretionary spend, cumulative spend vs. limit, category mix) that both the dashboard and the regression model consume, so it's computed once.
4. Interactive Dashboard (Capability 2)
Visualization layer — category breakdown, spend trend over time, anomaly markers, limit burn-down chart.
"Time-to-first-insight" path — this component is the direct answer to the <5-minute success metric, so it should render immediately once categorization finishes for a statement, not wait on the regression model.
5. Regression-Based Prediction (Capability 3)
Feature engineering — daily discretionary spend rate, day-of-week/recency-weighted average, category velocity, from the user's own history only (no cross-user model needed — sidesteps the "no labeled data" and "limited ML expertise" constraints since it's a simple per-user regression, not a trained classifier).
Days-to-limit model — regresses cumulative discretionary spend against days remaining until monthly_discretionary_limits is hit.
Model refresh strategy — retrain/update as new transactions arrive (per statement upload, not real-time).
6. Recommendation Engine
Ranking logic — category-level suggestions ranked by (reduction potential × frequency/ease), derived from the same feature store — e.g., "Dining is 3 days of your runway; cutting 20% adds 2 days."
Grounding contract — output format the coach can consume (structured, not prose) so the LLM coach isn't inventing numbers.
7. Conversational Coach (Capability 4 — Stateful Memory)
System prompt injection layer — assembles the prediction output + ranked recommendations + recent spend summary into context for each turn.
Multi-turn state management — conversation history/session memory so follow-up questions ("what if I cut dining by half?") don't require re-explaining context.
Grounding/guardrails — coach answers must cite the actual prediction and recommendation data, not hallucinate figures — directly addresses "actionable financial guidance" vs. "static reports" from the problem statement.
8. Orchestration / App Shell
Pipeline coordinator — CSV upload → categorize → aggregate → predict → recommend → dashboard + coach, as one flow (this is what makes the 4 capabilities "one coherent pipeline" rather than isolated exercises, which the spec explicitly calls out as the learning objective).
Cost/latency instrumentation — token/API-call counters per pipeline stage, since cost is a named constraint and needs to be demonstrable, not just assumed.