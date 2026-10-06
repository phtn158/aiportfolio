# Booking System — Testing Log

Testing notes for the n8n workflows built per `BOOKING_SYSTEM_PLAN.md` Part 2. Instance: local n8n at `http://localhost:5678` (Personal / BookingSystem project).

## Workflow 1: `[thuwork] Availability Check` (GET /webhook/availability)

### Test 1 — basic availability
```bash
curl "http://localhost:5678/webhook/availability?date=2026-09-20"
```
Expected: `{"slots":["09:00","09:30",...]}` — open half-hour slots within business hours.

**Status: ✅ Passed**

### Test 2 — busy-slot filtering
1. Create a test event on the target Google Calendar within business hours on the test date.
2. Re-run the same curl command.
3. Expected: the slot overlapping that event no longer appears in `slots`.

**Status: ✅ Passed**

## Workflow 2: `[thuwork] Booking Intake` (POST /webhook/booking)

### Test 1 — auth check (wrong/missing secret)
```bash
curl -X POST "http://localhost:5678/webhook/booking" \
  -H "Content-Type: application/json" \
  -H "X-Booking-Secret: wrong-value" \
  -d '{"name":"Test User","company":"Acme","email":"phtn.pro@gmail.com","service":"AI discovery call","date":"2026-09-20","time":"09:00","message":"testing"}'
```
Expected: `401` with `{"authorized":false,"error":"unauthorized"}`.

**Status: ✅ Passed** — confirmed the Check Secret / Authorized? branch correctly rejects a mismatched secret.

### Test 2 — successful booking
```bash
curl -X POST "http://localhost:5678/webhook/booking" \
  -H "Content-Type: application/json" \
  -H "X-Booking-Secret: <real secret from the Config node>" \
  -d '{"name":"Test User","company":"Acme","email":"phtn.pro@gmail.com","service":"AI discovery call","date":"2026-09-20","time":"09:00","message":"testing"}'
```
Expected, all four:
- [x] Response: `{"status":"confirmed"}`
- [x] New event on Google Calendar at the requested date/time, titled with the client's name, `phtn.pro@gmail.com` added as attendee
- [x] Confirmation email received
- [x] New row appended to the Google Sheet — all 10 columns filled correctly, `reminder_sent` blank

**Status: ✅ Passed**

### Test 3 — double-booking guard
Re-run Test 2's exact curl a second time (same date/time, correct secret).

Expected: `409` with an error message, and **no** duplicate calendar event created.

**Status: ✅ Passed**

## Workflow 3: `[thuwork] Reminder + No-show Follow-up`

Not yet built. Testing plan (from `BOOKING_SYSTEM_PLAN.md`) once it exists:
- Temporarily shorten the reminder threshold, confirm the reminder email fires once and `reminder_sent` flips to true; re-run the trigger manually and confirm no duplicate reminder.
- Create a booking in the near past without marking it completed, confirm the no-show follow-up fires once and is idempotent on re-run.
- Manually mark a different booking "completed" before its no-show window and confirm the automation correctly skips it.

## End-to-end front-end test (Part 1 follow-up)

Real browser flow this time, not curl — the actual booking widget in `index.html`, served locally, hitting local n8n directly.

Setup:
- `N8N_BOOKING_BASE` temporarily pointed at `http://localhost:5678/webhook` (placeholder production domain swapped back in once Part 3 hosting exists)
- `X-Booking-Secret` header added to the front-end fetch call, matching the Booking Intake workflow's Config node value
- Site served via `python3 -m http.server 8934` (not opened as `file://`)

Test: filled out the real Contact page booking form end-to-end — picked a date (live slots loaded from the Availability Check webhook), picked a time, submitted.

Expected, all three:
- [x] Real open slots loaded into the time dropdown from n8n (not hardcoded)
- [x] Submission succeeded — success message shown in the widget
- [x] Calendar event created, confirmation email received, Sheet row logged (same as the curl-based Workflow 2 Test 2, but now proven through the actual UI a real visitor would use)

**Status: ✅ Passed** — full loop (browser widget → n8n → Google Calendar/Gmail/Sheets) verified working, not just the curl-only path.

## Production deployment (Part 3)

Migrated all 3 workflows from local n8n to the self-hosted production instance at `https://n8n.thuwork.digital` (Hetzner CX22 + Docker Compose: n8n + Postgres + Caddy).

Setup:
- Exported each workflow as JSON from local, imported into the fresh production instance
- Recreated Google Calendar/Sheets/Gmail OAuth credentials on production (credentials don't travel with export/import)
- Added `https://n8n.thuwork.digital/rest/oauth2-credential/callback` to the Google Cloud OAuth client's Authorized redirect URIs
- Set `N8N_BOOKING_BASE` in `index.html` to `https://n8n.thuwork.digital/webhook`

Test: full booking flow through the actual website UI (served locally, pointed at production n8n), not curl.

Issue hit and fixed: the Booking Intake workflow's Append Row node had its `email` column mapping revert to Fixed/plain-text mode during the Document/Sheet reselection required post-import, so the sheet was logging the literal string `{{ $('Webhook').item.json.body.email }}` instead of the real address. Also spent significant time debugging this because `N8N_BOOKING_BASE` still pointed at `localhost:5678` from earlier local testing, so fixes to production weren't being exercised by the tests at all until that was caught and corrected.

Expected, all four:
- [x] Real time slots loaded from production's Availability Check webhook
- [x] Booking submission succeeded through the real website UI
- [x] Calendar event, confirmation email, and Sheet row all created correctly — including a correctly-resolved `email` value after the fix
- [x] Confirmed against a genuinely fresh test row (not a stale one from before the fix)

**Status: ✅ Passed** — full production loop (real website → `n8n.thuwork.digital` → Google Calendar/Gmail/Sheets) verified working end-to-end.

## Gotchas hit along the way (for next time / for the resale runbook)

1. **404 "webhook not registered" even though it looks saved** — the workflow must be **Published** (this n8n version's UI renamed the classic Active/Inactive toggle to a "Publish" button, top right). Saving alone isn't enough.
2. **"Invalid JSON in 'Response Body' field"** on a Respond to Webhook node — happens when typing an expression like `{{ $json }}` into a Response Body field that's still in plain/JSON-text mode instead of Expression mode. Fix used: set **Respond With → First Incoming Item** instead, which forwards the previous node's JSON directly with no manual expression needed.
3. **A "Get many" node returning 0 results silently stalls everything downstream** — if a Google Calendar search finds no matching events, n8n by default emits 0 items and the next node never runs at all (the webhook then just hangs/times out). Fix: enable **Always Output Data** (node's ⋯ menu → Settings) on every "Get many" node whose result could legitimately be empty (both the availability-window fetch and the double-booking re-check).
4. **A 401 "unauthorized" response is a successful n8n execution, not an error** — the Executions list shows it as "success" because no node crashed; it just means the `X-Booking-Secret` header didn't match the Config node's `booking_secret` value. Worth remembering when the executions list looks fine but the response is still wrong.

## Follow-up not yet done
- ~~The front-end `fetch(N8N_BOOKING_URL, ...)` call in `index.html` does not yet send the `X-Booking-Secret` header~~ — done, see "End-to-end front-end test" above.
- ~~`N8N_BOOKING_BASE` in `index.html` still points at `http://localhost:5678/webhook`~~ — done, now points at `https://n8n.thuwork.digital/webhook`, see "Production deployment" above.
- Workflow 3 (Reminder + No-show) branches were built and individually debugged (full list of issues + fixes now in `BOOKING_SYSTEM_PLAN.md`) but not yet re-run start-to-finish for a final pass/fail confirmation, and not yet migrated to production at all — still only exists on local n8n.
- CORS on production's Webhook nodes is currently set to `*` (wildcard) for local-testing convenience — needs to be scoped down to the real deployed domain once `index.html` is actually live on Netlify instead of being tested via a local static server.
- The deployed Netlify site is still the old version (per earlier note) — the booking widget isn't live for real visitors yet, only tested locally against production n8n.
