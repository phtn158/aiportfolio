# Privacy and Security Requirements

**Status:** Draft for local prototype; not a compliance certification or production security assessment.

## 1. Purpose and Principles

The agency portfolio application processes transaction and budget data to provide categorized spending insights and coaching. Financial records are sensitive. Collect and retain only what the workflow needs, limit external disclosure, and make data use understandable to the user. The public deployment demonstrates the product; it is not approved for production use with real customer financial data.

The dataset's provenance and whether records correspond to real people have not been verified. Do not commit it to a public GitHub repository, include it in a deployed demo, or upload it to third-party services until ownership, licensing, and data-processing permissions are confirmed. Use generated or otherwise approved synthetic data in the public demo by default.

## 2. Data Classification

- **Highly sensitive payment data:** full card number/PAN, CVV, PIN, and authentication secrets.
- **Sensitive personal/financial data:** transaction history, user/client identifiers, addresses, precise coordinates, income, debt, credit score, and spending limits.
- **Operational secrets:** LLM API keys, credentials, session tokens, and provider configuration.
- **Lower sensitivity reference data:** MCC descriptions and non-user-specific category definitions.

## 3. Mandatory MVP Rules

1. Do not load `cards.csv` into the application. It contains `card_number` and `cvv`; these fields are not needed for the product.
2. Never request, store, log, display, or transmit full card numbers, CVVs, PINs, bank credentials, or authentication codes.
3. Use an explicit field allowlist for processing and LLM prompts. Exclude addresses, ZIP codes, precise coordinates, birth details, gender, income, debt, credit score, and card identifiers unless a documented, approved need is added.
4. Before any transaction data is sent to an LLM provider, minimize and de-identify the payload (for example, omit user and transaction IDs and merchant/location details unless essential). Confirm provider retention, training, region, and deletion terms first. Configure API keys only in the host's secret manager for a hosted deployment.
5. Keep API keys in environment variables or local secret storage. Never commit secrets or include them in notebooks, screenshots, logs, or error messages.
6. Do not log raw transaction rows or full prompts by default. Log only operational status and non-sensitive error detail needed to debug.
7. Scope application state and conversational memory to the current user/session. Clear it when the session ends or the user requests reset; never reuse one user's context for another.
8. Treat uploaded CSV content and merchant text as untrusted input. Do not execute content, follow embedded instructions, or let data override system/developer instructions.
9. Provide a clear explanation of the prototype's educational purpose and its limitations. Do not present model output as guaranteed financial advice or as a substitute for a qualified professional.

## 4. Proposed Data Flow and Controls

1. **Upload:** accept only supported CSV data; validate file type, size, required columns, row count, and parser behavior. Reject unsupported input safely. The public demo should default to synthetic sample data; do not enable real-user uploads until hosted processing and retention behavior have been reviewed and disclosed.
2. **Normalize:** parse dates and amounts; apply an allowlist; discard prohibited/unneeded columns before downstream processing.
3. **Analyze:** run categorization, aggregation, and forecasting locally where possible. Keep derived datasets in memory by default.
4. **External inference:** send only the minimal transaction fields required for categorization. Use TLS through the provider SDK/API. Never include prohibited payment-card data or direct identifiers. If the provider is unavailable or not approved for the data, use the local/rules fallback.
5. **Coach:** construct context from computed aggregates and approved recommendations. Do not pass the full raw dataset to the conversational model when summaries suffice.
6. **Display/export:** avoid exposing sensitive source fields in charts, generated reports, browser state, or debug views.
7. **Cleanup:** remove temporary files and clear session state on request and at the end of the local session where feasible.

## 5. Access, Storage, and Retention

- The public portfolio deployment is for demonstration with synthetic data, not production personal-finance service or real-customer financial records.
- GitHub is the source repository/deployment trigger, not the Python runtime. Use a Python-capable host (proposed: Streamlit Community Cloud) and review that host's access, logging, retention, and secret-management behavior before deployment. GitHub Pages alone cannot host the planned Streamlit runtime.
- Do not persist raw uploads or model prompts unless required for a documented purpose and explicitly approved.
- Do not enable public uploads of real financial statements until the hosting provider's temporary storage, logs, retention, deletion, and external inference behavior are understood and disclosed.
- If persistence is introduced, define storage location, encryption at rest, access controls, retention period, deletion behavior, backup handling, and owner before enabling it.
- Restrict raw dataset access to the project owner and avoid copying sensitive source files into generated output directories.
- Exclude sensitive data and secrets from Git; review repository contents before publishing or sharing.
- Provide a user-visible way to clear the current analysis and conversation. Document any data that remains on disk.

## 6. LLM and Third-Party Provider Requirements

Before use with anything other than approved synthetic/demo data, document the provider and verify:

- whether requests or outputs are retained, used for model training, or reviewed by personnel;
- available retention controls, deletion mechanisms, processing region, and subprocessors;
- encryption in transit and contractual/data-processing terms;
- whether the account and project are approved for sensitive financial information.

If these conditions are unknown or unacceptable, do not send financial records to that provider. Use the local/rules fallback instead. Apply request limits and safe error handling; avoid returning provider request bodies in exception traces. For a public deployment, keep provider credentials server-side in the host's secret store, never in client code or GitHub.

## 7. Application Security

- Validate file contents rather than trusting filename or MIME type; set reasonable upload and row limits.
- Use parameterized/structured APIs for data access; avoid evaluating CSV content as code or formulas.
- Keep dependencies current and minimize installed packages; do not expose development server publicly by default.
- Use secure defaults for any web binding; local development should bind to localhost unless intentionally configured otherwise. For hosted deployments, rely on the provider's HTTPS endpoint and do not expose debug mode.
- Apply reasonable request and upload limits to reduce abuse and unexpected LLM/API costs in a public demo.
- Prevent cross-session data leakage and test that chat context is rebuilt/reset for each analysis.
- Handle exceptions without exposing file contents, secrets, local paths, or provider payloads to end users.

## 8. User Transparency and Responsible Output

- State what data is analyzed and whether any fields are sent to an external provider.
- Show the period, limit, category assumptions, and forecast limitations beside results.
- Distinguish estimates from facts; don't invent missing budget values or transaction details.
- Avoid coercive, shaming, or absolute recommendations. Present spending reductions as optional scenarios with estimated—not guaranteed—effects.
- Make it clear that categorization and predictions can be wrong and should be reviewed before acting.

## 9. Incident and Release Checklist

Before each demo or release:

- Confirm no PAN, CVV, credentials, API keys, or real personal data are present in the repository, logs, screenshots, or fixtures.
- Confirm LLM payloads contain only allowlisted fields.
- Confirm session reset and data cleanup behavior.
- Confirm upload validation and error messages do not reveal sensitive content.
- Confirm current provider data-handling terms and use only approved data.
- Confirm the deployed GitHub revision contains no raw financial datasets or secrets, and verify the public demo uses approved synthetic data.

If sensitive data or a secret is exposed, stop further transmission, revoke/rotate affected credentials, remove access where possible, preserve only necessary incident details without duplicating exposed data, and notify the data owner. For real personal data, follow applicable organizational and legal incident processes before resuming.

## 10. Open Decisions Before Production

- Dataset ownership, lawful basis/consent, licensing, and whether records are synthetic or real.
- Applicable privacy, consumer financial data, and security obligations by jurisdiction and deployment model.
- Production authentication, authorization, tenant isolation, encryption, audit, retention, deletion, backup, and incident-response design.
- Approved LLM provider, contractual terms, data residency, and sensitive-data eligibility.
- Hosting provider, GitHub repository visibility, public upload policy, traffic/rate limits, and hosting-platform retention/logging behavior.
- Whether any data must be persisted, and for how long.
- Security testing, threat modeling, and independent review before any public or real-customer deployment.