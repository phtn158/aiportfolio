# Data Dictionary

**Status:** Draft based on the headers and sample rows currently present in `../Data/Raw/`. Verify formats, value domains, provenance, and sign conventions against the complete dataset before implementation.

## Dataset Inventory

| File | Grain | Intended use | Handling |
|---|---|---|---|
| `transactions.csv` | One transaction per row | Import, categorization, aggregation, forecasting | Allowlist only required fields; validate before use |
| `users.csv` | One user/client per row | Resolve a user-selected discretionary limit | Prefer `id` and `monthly_discretionary_limits`; do not ingest unrelated profile fields |
| `cards.csv` | One card per row | Not required for the MVP | Do not load into the coach; contains card number and CVV fields |
| `mcc_codes.json` | MCC code to description mapping | Enrich categorization when useful | Treat as reference data; validate code keys and descriptions |

## `transactions.csv`

Observed columns: `id,date,client_id,card_id,amount,use_chip,merchant_id,merchant_city,merchant_state,zip,mcc,errors`.

| Field | Meaning / observed representation | MVP use and notes |
|---|---|---|
| `id` | Transaction identifier; sample is integer-like | Deduplication and row-level traceability. Not a secret; avoid exposing unnecessarily. |
| `date` | Transaction timestamp; sample format `YYYY-MM-DD HH:MM:SS` | Parse to a timezone-aware or explicitly timezone-naive timestamp consistently. Source timezone is unknown. |
| `client_id` | User/client identifier; integer-like | Join key to `users.id`. Pseudonymous identifier; keep internal. |
| `card_id` | Card identifier; integer-like | Not needed for coaching; drop unless an explicitly approved analysis requires it. |
| `amount` | Currency-formatted string; sample `$4.81` | Parse to decimal-safe numeric values. Currency and sign convention (spend, refund, debit/credit) must be verified. |
| `use_chip` | Transaction channel text; sample `Swipe Transaction` or `Online Transaction` | Optional categorization context; avoid sending unless needed. Establish allowed values from full data. |
| `merchant_id` | Merchant identifier; integer-like | Optional grouping/deduplication context; not necessary in prompts by default. |
| `merchant_city` | Merchant city text; sample `Bronx` or `ONLINE` | Potentially identifying location data; exclude from prompts/dashboard by default. |
| `merchant_state` | State text; may be blank | Optional, coarse context only if justified; validate blanks and values. |
| `zip` | ZIP/postal code; may be blank | Sensitive location data; do not use in prompts or analysis. |
| `mcc` | Merchant category code; integer-like | Useful categorization feature. Normalize to string/code and map via `mcc_codes.json`. |
| `errors` | Error flag or error text; sample blank | Preserve for import diagnostics if needed; do not treat as transaction amount/category. Determine domain from full data. |

## `users.csv`

Observed columns: `id,current_age,retirement_age,birth_year,birth_month,gender,address,latitude,longitude,per_capita_income,yearly_income,total_debt,credit_score,num_credit_cards,monthly_discretionary_limits`.

| Field | Meaning / observed representation | MVP use and notes |
|---|---|---|
| `id` | User/client identifier; integer-like | Join key for `transactions.client_id`. Keep internal. |
| `current_age` | Age in years | Not needed for MVP; do not ingest into coach context. |
| `retirement_age` | Stated/assumed retirement age | Not needed for MVP. |
| `birth_year` | Year of birth | Directly identifying in combination with other fields; exclude. |
| `birth_month` | Month of birth | Directly identifying in combination with other fields; exclude. |
| `gender` | Demographic value; sample `Female`, `Male` | Not needed for MVP; exclude. |
| `address` | Street address text | Direct identifier; never send to the LLM or display in the coach. |
| `latitude` | Geographic coordinate | Precise location; exclude. |
| `longitude` | Geographic coordinate | Precise location; exclude. |
| `per_capita_income` | Currency-formatted string | Highly sensitive financial profile data; not needed for MVP, exclude. |
| `yearly_income` | Currency-formatted string | Highly sensitive financial profile data; not needed for MVP, exclude. |
| `total_debt` | Currency-formatted string | Highly sensitive financial profile data; not needed for MVP, exclude. |
| `credit_score` | Integer-like credit score | Highly sensitive; not needed for MVP, exclude. |
| `num_credit_cards` | Integer-like count | Not needed for MVP, exclude. |
| `monthly_discretionary_limits` | Currency-formatted string; sample `$1,755 ` | Candidate monthly limit for prototype; parse safely and verify whether it is a limit, target, or another metric. Confirm currency and definition before use. |

## `cards.csv`

Observed columns: `id,client_id,card_brand,card_type,card_number,expires,cvv,has_chip,num_cards_issued,credit_limit,acct_open_date,year_pin_last_changed,card_on_dark_web`.

This file is explicitly out of scope for ingestion. `card_number` is payment-card data and `cvv` is sensitive authentication data. Do not copy these values into processed data, logs, prompts, screenshots, or test fixtures. The MVP needs no card-level data.

## `mcc_codes.json`

JSON object mapping MCC code strings to merchant category descriptions; examples include `5812` to `Eating Places and Restaurants` and `5411` to `Grocery Stores, Supermarkets`. Validate that input MCC values are normalized before lookup. MCC descriptions are hints, not necessarily the product's final spending taxonomy.

## Derived Fields (Proposed)

| Derived field | Definition | Notes |
|---|---|---|
| `normalized_amount` | Parsed signed monetary value from `amount` | Use a consistent currency and sign convention after verifying the source. |
| `category` | Category assigned by taxonomy/rules/LLM | Store classification method and confidence/review state alongside it. |
| `transaction_day` | Local or source-defined calendar day from `date` | Timezone policy must be explicit before daily modeling. |
| `is_discretionary` | Whether a transaction contributes to discretionary spend | Based on an approved category mapping; unknown categories remain unclassified rather than guessed. |
| `daily_discretionary_spend` | Eligible discretionary transaction total per day | Define refund, transfer, and missing-category treatment before modeling. |

## Data Quality Questions to Resolve

- Is this dataset synthetic, anonymized, licensed, and approved for the intended use?
- Which currency and locale are used? Are amounts signed, and how are refunds/credits represented?
- Are timestamps local, UTC, or timezone-naive? Are duplicate transaction IDs possible?
- What values appear in `errors`, and should errored transactions be excluded?
- Is `monthly_discretionary_limits` a user-set budget or a derived field? How should missing/zero limits be handled?
- Which MCC/category mappings are appropriate for discretionary versus essential spend?