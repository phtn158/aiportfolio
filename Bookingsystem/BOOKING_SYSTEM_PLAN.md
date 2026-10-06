# Booking/Scheduling System for ThuWork Website

## Context

The site currently has no working way to book a call — the "contact form" at `index.html` lines 7052–7120 is a front-end-only mockup (`<form onsubmit="return false;">`, explicitly commented as not wired to any backend); the only live path is a `mailto:` link. Meanwhile, "Scheduling & Bookings" is already one of ThuWork's 14 advertised product modules (`module-cost-estimates.md`, $900 setup / $39mo — "a booking page that syncs your calendar and follows up automatically on no-shows"), and a sibling project (`business-suite-prd.md`) has already picked **n8n** as ThuWork's standard automation/orchestration layer, with Google Calendar, Resend/Postmark, and Twilio named as its integrations.

Given that, the goal isn't just "add a booking form" — it's to build the *actual* Scheduling & Bookings module once, use it live on ThuWork's own site, and structure it so it can be cloned/rebranded for paying clients later with minimal rework. Decided approach (confirmed with user): **hybrid architecture** — a booking widget styled to match the site lives directly in `index.html`, and it talks to a **self-hosted n8n instance** (net new — none exists yet) that owns all the backend logic: calendar sync, confirmation email, reminder + no-show follow-up, and lead logging.

## Part 1 — Front-end: replace the contact form (`index.html` lines 7052–7120, `styles.css` lines 611–677)

Keep the existing two-column `.container.contact-grid` layout and reuse the existing `.form` / `.details` CSS classes as-is (no framework, no new dependencies — the site has none today).

- **Left column** (lines 7076–7084): keep the `.details` block (EMAIL/PHONE/LOCATION) as a fallback path — update the heading/copy to fit a booking flow instead of a generic inquiry ("Book a free AI discovery call").
- **Right column** (lines 7085–7117): replace the form. Keep Name / Company / Email / the "What can we help with?" dropdown (same options, `AI discovery call` stays first) / Message — same fields, same CSS classes (`.form.stagger-group`, `.stagger-item`), so no new base styling is needed. Add:
  - `<input type="date">` (native, `min` set via JS to today — no date-picker library).
  - A dependent `<select>` for time slots, populated by a `fetch` to n8n's availability webhook on `date` change (server is the single source of truth for what's free — never trust client-side availability state).
  - Submit does `fetch(POST)` to n8n's booking webhook (JSON body), with `AbortController` timeout (~10s), a disabled/"Booking…" loading state, and success/error UI.
  - On success: replace the form with a confirmation message (reuse `.details`-style block).
  - On failure: re-enable the form and explicitly point at the existing `mailto:hello@thuwork.digital` fallback.
- Wire the widget's init as a **third layer** on top of the existing `showPage` wrapping pattern already used twice in the file (~line 11467 base router, further wrapped ~line 11547 and ~line 11754 via `initContactAnimations`) — add a new `origShowPageN = window.showPage; window.showPage = function(...) { ...; if (page === 'contact') initBookingWidget(); }` block rather than editing the existing layers.
- New CSS (small, additive, near `styles.css:611–677`, reusing the existing `--navy`/`--green`/`--muted`/`--line` variables): `.booking-status` (+ `.success`/`.error` variants — no error color exists in the palette yet, pick one consistent with the site's saturation) and `.form button:disabled`.
- Define the n8n webhook URL as a single clearly-commented JS constant — this is the one line a cloned client site needs to change.

## Part 2 — n8n workflows (net new)

Three workflows, each parameterized via a top-of-workflow Set/Config node (`business_name`, `calendar_id`, `from_email`, `business_hours_start/end`, `slot_length_minutes`, `booking_secret`, `sheet_id`) so cloning for a client later is "edit one node," not "hunt through every node":

1. **Availability Check** (GET webhook) → Google Calendar freebusy query → compute open slots against configured business hours/slot length → respond with `{"slots":[...]}`.
2. **Booking Intake** (POST webhook) → validate payload → re-check the requested slot is still free (defensive, handles race conditions) → create the Google Calendar event (client added as attendee, so the invite + their calendar sync come free) → send confirmation email (Resend/Postmark node, matching the sibling PRD's stack) → append a row to a Google Sheet (name, company, email, service, date/time, status, source) → respond 200.
   - Require a shared-secret header on the webhook (checked by an early IF node) — it's a publicly-reachable, publicly-discoverable endpoint (visible in page JS), so it needs basic abuse protection.
3. **Reminder + No-show Follow-up** (Schedule Trigger, every 15–30 min, polling — *not* a mid-flow multi-day `Wait` node, which doesn't survive n8n restarts): read upcoming bookings needing a reminder → send reminder, flag `reminder_sent`. Separately: read past-due bookings still marked `booked` → send no-show follow-up, flag status. Note for the user: fully automatic completed-vs-no-show detection isn't reliably possible from calendar data alone — the Sheet's status column needs a brief manual touch from whoever runs the call (flag this expectation rather than overpromising).

Google Sheets (not Airtable) for lead logging: free, reuses the same Google OAuth credential as Calendar, and is easiest for a non-technical client to glance at later.

## Issues hit while building Part 2 (and fixes)

All three workflows are now built and manually tested against a local n8n instance (`localhost:5678`). These are the real problems encountered along the way, in case the workflows need rebuilding (e.g. cloning for a client per Part 4) or something regresses:

1. **404 "webhook not registered" despite looking saved.** This n8n version's UI renamed the classic Active/Inactive toggle to a **Publish** button (top right, with a dropdown chevron). Saving a workflow isn't enough — it must be Published for its production `/webhook/...` URL to respond at all.
2. **"Invalid JSON in 'Response Body' field"** on a Respond to Webhook node. Caused by typing an expression like `{{ $json }}` into a Response Body field still in plain/Fixed mode (so n8n tries to parse the literal text `{{ $json }}` as JSON and fails). Fix used throughout: set **Respond With → First Incoming Item** instead of `JSON` — forwards the previous node's output directly with no manual expression needed.
3. **A "Get many" node returning 0 results silently stalls every node after it.** If a Google Calendar search (or any "Get many"/lookup node) finds nothing, n8n emits 0 items by default and nothing downstream executes — for a webhook flow this means the request just hangs/times out with no response. Fix: enable **Always Output Data** (node's ⋯ menu → Settings) on every node whose result could legitimately be empty (the availability-window fetch, and the double-booking re-check in Booking Intake).
4. **A 401/error response can still show as a "successful" execution.** n8n's Executions list marks a run "success" whenever no node crashes — including a run that correctly detected a bad `X-Booking-Secret` and responded 401. That's the workflow working as designed; don't mistake "shows success" for "the values matched." Compare the actual `booking_secret` (Config node) against the header value sent when auth unexpectedly fails.
5. **Manually-typed test times like `"9:00"` break Luxon date parsing.** `DateTime.fromISO(date + 'T' + time, ...)` requires a strictly zero-padded ISO time (`09:00`); a single-digit hour fails silently (`appt.isValid === false`, no crash, just excluded from every downstream filter — looks like "nothing matched" with no visible error). Real bookings from the actual widget are always zero-padded (Workflow 1 generates them via `toFormat('HH:mm')`), so this only bites hand-typed test rows in the Sheet. Fix: normalize before parsing —
   ```javascript
   function normalizeTime(t) {
     const [h, m] = t.split(':');
     return h.padStart(2, '0') + ':' + (m || '00').padStart(2, '0');
   }
   ```
   applied in both the Reminder and No-show Filter Code nodes.
6. **Gmail "To" field sent a literal, unresolved template string as the email address.** Two compounding mistakes: (a) the field was copy-pasted from the Booking Intake workflow's `{{ $('Webhook').item.json.body.email }}`, but the Reminder/No-show workflow has no Webhook node at all (it's Schedule-triggered) — the correct reference there is `{{ $json.email }}`, reading straight off the current Sheet row; (b) the field was still in **Fixed** mode rather than **Expression** mode, so n8n treated the `{{ ... }}` text as a literal string instead of evaluating it. Always double-check the `fx` toggle is actually on before typing an expression into any field.
7. **Sheet row missing an `email` value entirely.** A hand-typed test row had a blank Email cell (or a header name that didn't exactly match `email`), so the field was absent from the row's JSON altogether rather than merely blank — worth checking column headers and test-row completeness whenever a field seems to be "missing," not just empty.
8. **`row_number` came back `null`/`undefined` in the Update row node.** The **Gmail** node (and any action node like it) replaces `$json` with its own output (message ID, thread info, etc.) rather than passing the input through — so `{{ $json.row_number }}` in the Update row node, placed right after Gmail in the chain, loses the value entirely. Fix: reference the Filter node by name instead of relying on passthrough: `{{ $('Filter Reminder Candidates').item.json.row_number }}` (and the equivalent for the No-show branch). Same principle already used elsewhere in these workflows for `$('Webhook')`/`$('Config')` — reference upstream nodes explicitly rather than assuming a value survives every hop.
9. **Fanning one output into two parallel branches was hard to do via drag-and-drop** in this n8n canvas (hovering over the output connector dot didn't reliably reveal the drag handle). Workaround used: duplicate the Schedule Trigger and Config nodes so Branch A and Branch B each have their own independent 1-to-1 chain (both triggers set to the same 15-minute interval) instead of one shared trunk fanning out — functionally identical, avoids the finicky UI interaction entirely.

## Backlog

- **No-show detection is inferred, not verified — false positives are possible.** The Reminder + No-show workflow has no actual signal for whether a call happened; it only knows "the appointment time passed and nobody changed `status` away from `booked`." If whoever runs the call forgets to update the Sheet, a completed call gets an automated "sorry we missed you" follow-up email exactly like a real no-show would. A genuine fix requires attendance data from the call platform itself, not the calendar — e.g. **Google Meet attendance via the Google Workspace Admin Reports API** (real signal of who joined and for how long, but only available on a **paid Google Workspace** account, not a free/personal Gmail account — needs confirming which one this business is on), or an equivalent Zoom webhook (`meeting.participant_joined`) if the call platform were Zoom instead. Parked for now — current behavior (manual sheet edit, silent false-positive risk) is an accepted MVP tradeoff, consistent with how most booking tools at this price point behave (e.g. Calendly has the same limitation).

## Part 3 — n8n hosting (self-hosted, from scratch)

- Small VPS (e.g. Hetzner CX22 / DigitalOcean, ~$5–12/mo) running Docker Compose: `n8n` (official image, persisted `N8N_ENCRYPTION_KEY`) + `postgres` (n8n's recommended production backing store) + `Caddy` as reverse proxy for automatic HTTPS on a subdomain (e.g. `n8n.thuwork.digital`).
- DNS: A record for that subdomain → VPS IP.
- Backups: daily `pg_dump` off-box (this protects stored OAuth credentials, painful to reconstruct otherwise).
- Enable n8n's built-in auth/user management — never leave the editor UI open.
- Secrets (webhook shared secret, API keys) via Docker Compose `.env`, not hardcoded in nodes.
- Self-hosting (vs n8n Cloud) is the right call *because* this is meant to host many future clients' workflow instances on one box — cheaper at scale than per-seat Cloud pricing, consistent with the "low recurring cost" positioning already in `module-cost-estimates.md`.

## Issues hit while building Part 3 (and fixes)

Production is now live at `https://n8n.thuwork.digital` (Hetzner CX22, Falkenstein/Nuremberg, Docker Compose: n8n + Postgres 16 + Caddy 2). Real issues hit along the way, in rough chronological order:

1. **Hetzner's cheapest instance type wasn't available in US regions, and the US-available alternative cost ~5x more.** Went with the cheap EU region (Falkenstein/Nuremberg) instead of paying the US premium — a reasonable call here specifically because this server only ever talks to webhook calls and Google's APIs in the background, never serves an interactive page a person is staring at, so the extra ~100-150ms EU↔US latency is genuinely imperceptible for this workload.
2. **Local vs. remote command confusion, repeatedly.** Several commands meant for the server (`mkdir ~/n8n-stack`, appending to `~/.ssh/authorized_keys`) got accidentally run in a regular local Mac terminal instead of an actual SSH session — `~` resolves differently depending on which machine you're on, and both prompts can look superficially similar at a glance. Lesson: always confirm the terminal prompt shows the remote hostname (e.g. `root@ubuntu-4gb-hel1-1:~#`) before running anything server-side.
3. **A long SSH public-key rejection mystery.** The exact same key that was confirmed correctly placed in `~/.ssh/authorized_keys` (via Hetzner's browser console, with correct ownership/permissions/sshd config all verified) kept getting rejected by real SSH connections. Root cause was never 100% confirmed, but the likely explanation surfaced once we finally got in via a temporary root password: **the server was in a genuinely fresh state — no Docker, no `n8n-stack` directory at all** — meaning all the earlier Docker setup and key-adding work happened against some other session/state that didn't actually persist to the server we were later connecting to. Never fully root-caused which specific step caused the divergence.
4. **Fix used**: reset the root password via Hetzner's **Rescue** tab (not the main Actions menu — easy to miss), temporarily enabled `PasswordAuthentication yes` in `sshd_config` to get a reliable foothold, then rebuilt everything fresh directly through that access — installed Docker, recreated `docker-compose.yml`/`Caddyfile`/`.env`, brought the stack up, added the correct SSH key, confirmed key-only auth worked, then **disabled password authentication again** immediately after (never leave it on).
5. **Hetzner's browser console needs a root password to log in, which an SSH-key-only server never has by default.** The "Reset root password" action (under Rescue) generates one — this is a separate, one-time thing from SSH key auth, easy to not realize is needed until you're stuck at a login prompt with nothing to type.
6. **`ufw` turned out to be a red herring.** It was `inactive` the entire time — the "connection refused on 443" symptom we spent time on earlier was coincidentally happening because Docker/Caddy didn't exist yet on this particular server state (see #3), not because anything was actively blocking the port.
7. **Post-migration, a Google Sheets column mapping silently reverted to Fixed/plain-text mode.** After exporting the Booking Intake workflow from local and importing it into production, the `email` column in the Append Row node needed its Document/Sheet reselected — and in the process, its value field reset to plain text instead of Expression mode, so the sheet started logging the literal string `{{ $('Webhook').item.json.body.email }}` instead of the real address. Same underlying bug class as the Gmail "To" field issue from Part 2 — worth treating "re-verify every field mapping" as a mandatory post-import step, not an optional one.
8. **The most time-consuming bug wasn't actually a bug**: after fixing #7 and republishing, tests kept showing the identical failure. The actual cause was that `index.html`'s `N8N_BOOKING_BASE` was still pointing at `http://localhost:5678` (a leftover from the Part 1 local end-to-end testing) — every "production" test was silently hitting local n8n the whole time, which never received the fix. Lesson: when a fix "doesn't work," verify which actual endpoint is being hit before re-diagnosing the logic further.
9. **Credentials don't travel with workflow export/import** (by design, for security) — Google Calendar/Sheets/Gmail OAuth credentials had to be recreated from scratch on the production instance, which also required adding `https://n8n.thuwork.digital/rest/oauth2-credential/callback` to the Google Cloud OAuth client's **Authorized redirect URIs** — a field easily confused with the separate **Authorized JavaScript origins** field (which rejects any URL containing a path, a genuinely confusing error if you don't know the two fields exist).
10. **CORS while testing production from a locally-served site**: requests from `http://localhost:8934` (the local test server) to `https://n8n.thuwork.digital` needed the Webhook nodes' **Allowed Origins (CORS)** set to `*` for testing — this needs to be scoped down to the real deployed domain once the site is actually live there instead of tested locally.

**Broader lessons for next time (or for the Part 4 clone process):**
- Migrating a workflow between n8n instances is never just export→import — credentials and some field mappings (especially anything involving reselecting a Document/Sheet resource) need a full manual re-verification pass, not a spot check.
- When a targeted fix "doesn't work," check what's actually being exercised (the real request path/URL) before assuming the fix itself was wrong — this cost the most time here.
- Confirm actual regional cloud pricing before committing, especially for a workload where geographic latency doesn't matter.
- Always double check you're on the right machine before running any server-setup command.

## Part 4 — Resale structuring (this is a product, not a one-off)

- Export the finished, working ThuWork workflows as canonical template JSON, version-controlled outside n8n (private git repo) as the source of truth for the product.
- Clone via n8n's Duplicate Workflow / JSON import per new client; each client gets their **own** Google Calendar OAuth credential (their calendar, not ThuWork's) and their own Sheet.
- Naming convention to avoid collisions on the shared instance: prefix workflows/credentials with the client slug (`[thuwork] Booking Intake`, `[clientname] Booking Intake`).
- Email templates as separate, clearly-named nodes using placeholder tokens (`{{business_name}}`, `{{client_first_name}}`, `{{appointment_time}}`), not freeform prose — makes rebranding a find/replace, not a rewrite.
- Short clone checklist (worth writing once as an internal runbook, not part of this codebase): duplicate 3 workflows → fill in Config node's variables → client authorizes their own Calendar OAuth → client's Sheet created from template → update webhook URL + dropdown copy on their site → run the verification steps below.

## Verification

1. Submit a real test booking end-to-end with a checkable email (e.g. phtn.pro@gmail.com); confirm loading → success states, and that double-clicking submit doesn't double-book.
2. Availability: manually create a conflicting calendar event, confirm that slot is excluded from the dropdown; race two tabs for the same slot, confirm the second is rejected with a clear front-end error (not a double-booking).
3. Confirm: calendar event created correctly (title, attendee, time), confirmation email arrives with no unrendered `{{tokens}}`, Sheet row logged correctly.
4. Reminder: temporarily shorten the threshold, confirm it fires once and `reminder_sent` prevents a duplicate on re-run.
5. No-show: create a booking in the near past, confirm follow-up fires once and is idempotent on re-run; confirm a booking manually marked "completed" is correctly skipped.
6. Security: `curl` the booking webhook directly without the shared-secret header, confirm it's rejected.
7. Resale acceptance test: duplicate the workflow set under a fake client name, swap only the Config node's values + a test calendar/sheet, repeat steps 1–3 with zero code edits — proves the clone-and-rebrand story actually works.

## Critical files
- `index.html` — lines 7049–7120 (contact section to replace), ~line 11467 (`showPage` router), ~line 11743 (`initContactAnimations`, pattern to extend as a third layer)
- `styles.css` — lines 611–677 (`.form`/`.details` to reuse), lines 1–9 (CSS variables), new additive rules near there for `.booking-status` / `:disabled`
- `module-cost-estimates.md` lines 24–29 — pricing/hour budget this build should stay consistent with
- `business-suite-prd.md` (parent folder) Tech Stack section — n8n/Resend-Postmark/Google Calendar as the suite-wide standard
- Net new: n8n workflow JSON exports (Availability Check, Booking Intake, Reminder + No-show) — the actual resale template artifacts
