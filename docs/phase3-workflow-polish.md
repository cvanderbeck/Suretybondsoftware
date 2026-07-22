# Phase 3 — Workflow Polish

**Time & materials with cap. 6–10 weeks. $25k–$50k.**

## Goal

Kill the repetitive work. After Phase 3, an opportunity moving through
stages mostly drives itself; a new principal onboarding is a click, not
a checklist; a producer knows what to do next without asking.

## In scope

**Automations / Template Sequences**
- Port the prototype's Templates view to the backend.
- Named sequences with steps (day-offset, action type, template ref).
- Actions: send email (using template + variables), create task, wait,
  update field.
- **Stage-change triggers**: e.g. "Awarded → auto-create bond, send
  issuance email, push QBO invoice, open issuance tasks."
- **Time-based triggers**: e.g. "90 days before bond expiry → auto-create
  renewal card, send renewal reminder to principal" (already the case, but
  formalized as one of many triggers).
- **Manual enroll**: apply a sequence to any account, lead, opportunity,
  renewal from the Apply Template picker.

**Tasks — production polish**
- Full task assignments with 4-user seat (or whatever we end up with).
- Recurring tasks (monthly WIP review, annual financial pull).
- **iCal feed** so tasks appear in Outlook / Google Calendar for each user.
- Reassign / snooze / delegate flows.

**Public intake forms**
- Producer generates a tokenized link (CQ, PFS, WIP, Contract BRF,
  Commercial BRF, Subdivision App, Bond Express — 7 forms in the prototype).
- Prospect fills online. Auto-save on tab switch (already in prototype).
- Submissions land in the Forms inbox with **duplicate detection + merge UI**
  (email / EIN / phone / normalized name matching).
- Auto-provision Account or attach to existing based on email match.

**WIP tracker**
- Per-bond cost-to-complete inputs from principals (via WIP intake form)
  roll up to account-level backlog credit against aggregate limits.
- Monthly reminder cadence to principals; producer sees "WIP overdue" chip.

**Premium calculator**
- Server-side rate cards per carrier (uploaded via admin UI as CSV/PDF).
- Quote generator: bond type + amount + carrier → premium + commission.
- Save quote → auto-populate Opportunity fields.

**Commissions**
- Producer split tracking per bond.
- Monthly commission statement PDF per producer.
- Reconciliation view against QBO payment status.

**Reporting**
- Pre-built reports:
  - Production by producer (period-over-period)
  - In-force by carrier
  - Expirations by month (rolling 12)
  - Lost bid analysis (why we lost, by carrier, by size)
  - Aggregate utilization by account
  - Commission earned vs. paid
- CSV + PDF export on every report.
- Optional: scheduled email delivery (weekly digest to Courtney).

## Out of scope (deferred)

- Marketing Hub sequences (Phase 4 — different data model).
- BI dashboards / custom report builder.
- Mobile app.

## Acceptance criteria

- Moving a Pipeline card to "Awarded" auto-creates the bond record, fires
  the issuance email, opens a QBO invoice (via Phase 2 integration), and
  posts the issuance task list — all from one drag.
- A producer sends a CQ link to a new prospect; the principal submits it;
  the data appears in the account with no manual re-keying.
- A commissions report for last month reconciles to QBO within $5 across
  all bonds.
- A tasks iCal feed URL renders correctly in Outlook and Google Calendar.

## Tech stack additions

- Job scheduler (cron-like, e.g. node-cron or Celery Beat)
- Report generation library (PDFKit, ReportLab, or WeasyPrint)
- CSV export (streaming for large reports)

## Dependencies from us

- Current rate sheets per surety carrier (PDF or spreadsheet is fine).
- Current commission splits per producer.
- List of every recurring task we do today, with cadence and owner.
- Sample reports we currently produce manually — helpful benchmarks.
