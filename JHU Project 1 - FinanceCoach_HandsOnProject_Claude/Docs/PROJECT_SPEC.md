## Project Overview

This is an agency portfolio product demonstration: a Python-based Personal Finance Coach that shows an end-to-end, user-facing AI product from data import through coaching. The ClearLedger scenario and retention figures are an illustrative product brief, not a claim of an agency engagement or verified business results. The demo should be polished, credible, and safe to share with prospective clients.

## Problem and Objective

Users reportedly have to manually categorize 60–150 transactions before seeing insights. The prototype should accept a bank-statement CSV, categorize transactions automatically, provide an interactive spending dashboard, estimate when a user may reach a self-set discretionary spending limit, recommend ranked category-level spending reductions, and answer follow-up questions using the user's spending data and the generated analysis.

The product demonstrates an integrated data pipeline combining LLM classification, visualization, regression-based prediction, and session-scoped conversational context. Each major design choice should be explainable in terms of user value, data quality, privacy, maintainability, or the delivery constraint.

## Proposed Technical Design

- **Language and application:** Python with Streamlit, designed to run locally and on a Python-capable hosted service.
- **Data processing:** pandas for CSV parsing, validation, cleaning, aggregation, and feature preparation.
- **Visualization:** Plotly for interactive spending charts.
- **Classification:** an LLM provider adapter for transaction categorization, with a deterministic rules/fallback path when the provider is unavailable. Send only the minimum transaction fields needed; never send card security data.
- **Forecasting:** scikit-learn regression trained and evaluated using a user's historical transactions. Forecast daily discretionary spending, then estimate days remaining under the user's stated limit. Suppress or clearly qualify estimates when there is insufficient history or no meaningful positive forecast.
- **Coaching:** a conversational interface grounded in computed spending summaries, forecast output, and recommendations. Keep conversation context session-scoped; do not treat model output as authoritative financial advice.
- **Configuration:** API keys and provider configuration are supplied through environment variables or local secret configuration and are not committed to source control.

These are proposed choices for an agency portfolio demo. Revisit them if the product moves toward real-customer use or requirements change.

## Deployment and Portfolio Demo

GitHub is the source repository and can trigger deployment, but it is not the Python application runtime. The proposed deployment is Streamlit Community Cloud connected to the GitHub repository, or another host that supports Python applications. GitHub Pages serves static assets and cannot run the planned Streamlit/Python application without a separate backend or a substantial architecture change.

The public demo must use approved synthetic data and must not include the supplied raw financial files in its deployed assets. Keep provider credentials in the host's secret manager, never in the repository. Do not enable public uploads of real financial records until hosting behavior, retention, provider data handling, and user disclosure have been reviewed. Confirm repository visibility and hosting choice before deployment.

## Input Data and Processing

The repository contains `Data/Raw/transactions.csv`, `users.csv`, `cards.csv`, and `mcc_codes.json`; `Data/Processed/` is currently empty. The observed schemas are documented in [DATA_DICTIONARY.md](DATA_DICTIONARY.md). Dataset provenance, licensing, representativeness, and currency/amount sign conventions still need verification. Do not commit or deploy these raw files as portfolio demo data until their status is confirmed.

For the prototype, process only the transaction fields needed for categorization and analysis, plus a user's monthly discretionary limit when available. Do not load `cards.csv` into the coach: it contains PAN-like card numbers and CVVs. Do not use or expose user addresses, precise coordinates, income, debt, or credit score in coaching unless a separately reviewed requirement justifies it. See [PRIVACY_AND_SECURITY_REQUIREMENTS.md](PRIVACY_AND_SECURITY_REQUIREMENTS.md).

CSV ingestion must validate required columns and parse dates and monetary values safely. Invalid rows should be reported without silently corrupting totals. Preserve transaction identifiers only as needed for deduplication and auditability. Category results should include a category, confidence or review status, and provenance (LLM, rule, or fallback).

## Core Requirements

1. Upload and validate a transaction CSV; explain rejected or malformed rows.
2. Categorize eligible transactions without requiring manual tagging, and show fallback/uncertain classifications honestly.
3. Render spending summaries by time and category with clear currency and date ranges.
4. Estimate days remaining until the user's configured discretionary spending limit, showing the basis, uncertainty, and an insufficient-data state.
5. Rank potential category-level spending reductions using observed spending and transparent assumptions.
6. Support multi-turn questions grounded in the current user's analyzed data, with no cross-user context leakage.
7. Provide a privacy-aware hosted demo using approved synthetic data; local CSV upload may be used for development. Do not solicit real financial uploads from public users until the hosting and data-processing controls are reviewed.

## Prediction and Recommendation Contract

The selected limit period, discretionary category definition, treatment of refunds/credits, and forecast horizon must be explicit in the UI and code. A forecast must not imply certainty. Use chronological holdout/backtesting rather than random row splitting. Compare against a simple baseline, report model limitations, and avoid displaying a numeric prediction when data is inadequate. Recommendations should be ranked from measured category spend and estimated savings, avoid double-counting the total budget, and be presented as optional scenarios rather than guaranteed outcomes.

## Quality and Acceptance Checks

- A clean local setup can run the prototype, and the hosted portfolio demo can be built and deployed from GitHub using documented steps.
- A valid CSV reaches a useful first dashboard state in under five minutes in the demo environment, excluding unusual provider outages.
- Required columns, malformed dates/amounts, empty files, duplicate rows, refunds, and missing limits have defined handling.
- Dashboard totals reconcile to eligible parsed transactions under the documented sign and filtering rules.
- Forecasts are evaluated chronologically against a baseline and provide a clear unavailable/low-confidence state when warranted.
- The coach answers using supplied aggregates and indicates when the data cannot answer a question; it does not invent transactions or claim to be a financial, tax, or legal adviser.
- Automated checks cover parsing, aggregation, forecast edge cases, and prompt-context isolation.
- No card number, CVV, or other prohibited sensitive field is included in LLM requests, logs, analytics, or generated artifacts.

## Out of Scope

- Production bank connectivity or credential collection.
- Payment initiation, credit decisions, investment trading, tax/legal advice, or guarantees of savings.
- Production-grade multi-tenant financial data processing, compliance certification, or a claim that the product achieves a retention target. A limited hosted portfolio demonstration is in scope.
- Anomaly detection as a committed MVP feature; the original business context mentions it, but the stated six-week deliverable does not require it. Add only if time and explicit acceptance criteria permit.

## Assumptions and Open Questions

- The supplied data's provenance, rights to use, and whether it contains real personal information must be confirmed before external sharing or sending any fields to a provider. Use generated/approved synthetic data for the public demo by default.
- Decide whether the prototype's limit is monthly, another fixed period, or configurable. The `users.csv` field is named `monthly_discretionary_limits`.
- Confirm category taxonomy, treatment of transfers/refunds, and which merchant/location fields may be used.
- Select and approve an LLM provider, its data-processing terms, retention behavior, and region before sending transaction data.
- Confirm GitHub repository visibility and the Python-capable hosting provider; GitHub Pages alone is not compatible with the proposed Streamlit runtime.
- Define the minimum amount of history and the forecast evaluation threshold before describing a prediction as useful.
- Confirm whether the user may correct categories, even though the initial flow is designed to avoid mandatory manual tagging.