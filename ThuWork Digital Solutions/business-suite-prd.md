# Business Management Suite — PRD
**"Owner's Assistant" — AI-Powered Business Management Suite for Small Business Owners**

Status: Draft v1 | Owner: Tiffany | Last updated: 2026-09-13

---

## 1. Overview

An AI-powered suite of agents that acts as a small business owner's assistant — handling communications, scheduling, finance, marketing, operations, and reporting so the owner doesn't have to context-switch across disconnected tools.

**Primary goal:** Build as an internal tool first (dogfooded on ThuWork Digital Solutions and kskinluxe), productize/sell later. Development is also being used as a vehicle to build a hands-on AI tooling portfolio (agent orchestration, RAG, no-code automation) for Tiffany's Senior AI PM job search.

---

## 2. Problem Statement

Small business owners (solo operators to <10 employees) lose hours per week context-switching between disconnected tools (CRM, accounting, scheduling, marketing) and manual admin work that an assistant could otherwise handle.

**Target user:** Solo operator or small team (salon, contractor, e-commerce, local service, etc.) who wears every hat — sales, ops, marketing, finance, customer service — with no time or budget for separate, disconnected subscriptions.

---

## 3. Feature Modules (14)

| # | Module | Core Function |
|---|---|---|
| 1 | Communications Hub | Unified inbox (email, SMS, social DMs, WhatsApp), AI drafts/auto-replies, missed-call text-back |
| 2 | Scheduling & Bookings | Booking page, calendar sync, reminders, no-show follow-up |
| 3 | Customer/Lead CRM | Contact records, pipeline stages, lead capture, source tracking |
| 4 | Marketing Assistant | Social post drafting/scheduling, email/SMS campaigns, review requests, ad copy |
| 5 | Finance & Accounts | Invoicing, quotes, payment links, AR/AP tracking, expense categorization, P&L, tax export, payroll hooks |
| 6 | Task & Ops Management | To-do lists, recurring task automation, kanban boards, vendor tracking |
| 7 | Reputation Management | Review monitoring, auto-request flows, AI-drafted responses |
| 8 | Document & Contract Hub | E-signatures, template contracts/proposals, file storage |
| 9 | AI Chief of Staff | Daily briefing, cross-module triage, chat/voice command interface |
| 10 | Reporting Dashboard | Revenue, leads, cash flow, task completion in one view |
| 11 | Team/Staff Management | Shift scheduling, time tracking, payroll integration, hiring/onboarding |
| 12 | Compliance & Admin | License/permit renewal reminders, insurance tracking, HR document storage |
| 13 | Inventory & Procurement | Stock levels, SKU tracking, reorder alerts, purchase orders, supplier comparison |
| 14 | Strategic Planning | OKRs/goal-tracking tied to the Reporting Dashboard (prescriptive, not just descriptive) |

---

## 4. Architecture Principles

Each module is built as an **independent, single-purpose agent** rather than one monolithic app — following the pattern already proven with the ThuWork lead-gen outreach agent.

Every agent shares four components:
1. **Trigger** — scheduled (daily/weekly) or event-based (new message, overdue invoice, review posted)
2. **Scoped job** — one narrow task, not "run the business"
3. **State/memory** — persisted in a shared data layer, not siloed per agent
4. **Output mode** — auto-act or draft-for-approval (policy varies by module; finance/outreach stay draft-for-approval longer than low-risk modules like review monitoring)

### Shared components across all agents
- **Shared data layer** — single source of truth (contacts, transactions, tasks, bookings, inventory, messages)
- **Orchestrator agent ("Chief of Staff")** — reads across all agent outputs/state to compile the daily briefing and triage list
- **Approval queue** — surface where draft outputs (invoices, replies, posts) sit until the owner approves
- **Consistent approval/action policy** — global rule set for what agents may auto-act on vs. require sign-off

---

## 5. Tech Stack

| Layer | Choice | Rationale |
|---|---|---|
| Frontend/Dashboard | Next.js on Netlify | Matches existing deploy habit; strong AI-assisted-coding support |
| Database | Supabase (Postgres + auth) | Managed, built-in multi-tenancy/auth primitives, inspectable SQL |
| Agent orchestration | n8n | Visual workflow builder; native connectors (Gmail, Twilio, Stripe, Calendar) reduce custom integration code |
| AI reasoning | Claude API / Claude Agent SDK | Drafting, judgment calls, multi-step tool-calling agent loops |
| RAG / knowledge retrieval | Supabase pgvector (or Pinecone) | Grounds CRM/knowledge agent responses in business-specific data |
| Integrations | Resend/Postmark (email), Twilio (SMS), Stripe (payments/invoicing), Google Calendar API, Meta/IG Graph API | Standard, well-documented, generous free tiers |
| Version control | GitHub | Existing habit |

**Open decision:** whether agent scheduling stays Netlify-native (simpler) or moves to n8n/Trigger.dev/Inngest (more powerful, one more service to manage) — leaning n8n per above.

---

## 6. Build Sequencing (Learning-Driven)

Because a core goal is building demonstrable AI-tooling skill for a Senior AI PM portfolio, sequencing favors differentiated tools over quick wins.

**Phase 1 — Agent Orchestration (Claude Agent SDK / Claude Code)**
- Rebuild the existing manual outreach/lead-gen workflow as a true autonomous agent: multi-step tool-calling loop (search → identify → dedupe against stored leads → draft outreach → flag for approval)
- Demonstrates: agent loop design, tool definition/use, persisted state, human-in-the-loop approval
- Portfolio angle: before/after narrative — manual chat-scheduled task → real coded agent with state

**Phase 2 — RAG (Supabase pgvector or Pinecone)**
- Build a CRM knowledge agent: "what do we know about this customer/lead" retrieved from stored notes/interactions
- Demonstrates: embeddings, chunking, retrieval, grounding responses in proprietary data
- Composability angle: outreach agent (Phase 1) can later query this RAG layer ("have we contacted a similar business before")

**Later phases (not yet sequenced):** Claude API + n8n quick-build agents (review-response, reminders), Retool-style approval-queue dashboard.

---

## 7. Open Questions

- Rebuild the outreach agent from scratch for Phase 1, or evolve the existing scheduled-task version incrementally (preserving lead history) to show a real migration story?
- Final call on agent scheduling infra: Netlify-native vs. n8n vs. Trigger.dev/Inngest
- Per-module approval policy: which agents graduate from draft-for-approval to auto-act, and when

---

## 8. Success Criteria

- **Internal:** ThuWork and kskinluxe operations run measurably faster/lighter-touch across at least 2 modules (target: Communications + Finance)
- **Portfolio:** Two complete, documented case studies (agent orchestration + RAG) in the existing Problem → Role & Approach → What It Does → Outcome → What I'd Do Differently → What's Next format
- **Productization (later):** Suite is multi-tenant-ready from day one, even while single-tenant in dogfood phase
