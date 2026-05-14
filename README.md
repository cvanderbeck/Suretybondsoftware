# BondVault — Surety Agency OS (Interactive Preview)

A self-contained, click-through preview of a surety bond management
system for **independent producer agencies**.

## Running

This is a static site — no build required. Open `index.html` in any modern browser:

```bash
# Option 1: just double-click index.html
# Option 2: serve locally
python3 -m http.server 8000
# then visit http://localhost:8000
```

State persists in `localStorage`. Use **Settings → Reset Demo Data** to start over.

## Features

- **Dashboard** — KPIs, premium trend chart, bond-mix donut, expiring bonds, UW progress.
- **Pipeline** — Kanban with the default 7-stage producer flow (Request Received → Pre-Qualification → Submission in Progress → Submitted to Underwriter → Underwriter Review → Approved – Pending Bid Results → Awarded - Ready to Issue). Drag-drop, CSV export, and **fully editable stages** (rename, reorder, add, delete via Manage Stages). Opportunities are editable any time; clicking the company name jumps to the Account file. **Convert to Bond** opens an Approved Bond Details form that captures bond #, surety partner, premium, rate, commission %, dates, QBO invoice #, and tracking timestamps before the bond is created.
- **Accounts** — Rich account hub with tabs:
  - **Overview** — KPIs, primary contact card, renewal-due badges, company snapshot
  - **Company** — legal name, DBA, entity type, formation state, founded, NAICS, website, gross revenue, employees, single + aggregate bond capacity
  - **Contacts** — multi-contact CRUD, mark primary
  - **Indemnity** — personal + corporate indemnitor CRUD with SSN/EIN, spouse, net worth, liquid, PFS date
  - **Underwriting** — renewal triggers (financials + WIP intervals with overdue/due-soon badges), step pipeline (Intake → Doc Collection → Surety Submission → Decision → Issuance), per-bond requirement checklists, advance/submit
  - **Bonds** — grouped by Active / Pending UW / Expired / Cancelled, clickable into the bond detail
  - **Pipeline / Bids** — opportunities for this account with cross-link to the full pipeline
  - **Documents** — files tied to the account
  - **Emails** — mapped messages
- **Bonds** — Full CRUD with per-bond **commission %**, premium calc, status, surety partner, **QuickBooks Invoice #**, and **bond tracking timestamps** (Reported to Bond Co., Approved by Principal/Obligee, Sent Out to Principal — each editable inline with a one-click "Today" stamp). **PDF bond certificate export**, bulk bonds report PDF, and tracking-status dots on the list view.
- **Renewals** — Dedicated page for upcoming bond expirations with a follow-up workflow:
  - Filter by window (30 / 60 / 90 / 120 / 180 days) and status
  - Per-bond renewal record with a 5-step pipeline: Upcoming → Outreach Started → Awaiting Response → Decision Made → Closed
  - Decision outcomes: **Renew** (rolls expiration forward 1 yr), **Released** (no longer needed → cancel), **Reduce** / **Increase** bond amount (auto-updates bond + premium), **Cancel** (not renewing)
  - Activity log of follow-up notes with date / author
  - Quick "Log FU" inline action sets next follow-up date and advances status
  - CSV export
- **Premium Calculator** — Bond class + subclass, credit/experience/working-capital/indemnity adjustments, per-partner spread, commission preview, and **PDF quote export**.
- **Documents** — Drag-drop uploads, batch attach to account/bond, category tagging, simulated preview, delete.
- **Commissions** — Per-bond and per-surety roll-ups, YTD totals, CSV export.
- **Invoicing & QuickBooks Online** — Connect / disconnect QBO (simulated OAuth), sync individual or all invoices, map A/R + Income accounts, PDF invoice export, status flow (Draft → Open → Paid).
- **Email Integration** — Connect Microsoft 365 / Google Workspace (simulated OAuth), Inbox / Sent / Drafts folders, **reusable email templates** with `{{variable}}` substitution (account/contact/bond/renewal/agency context), template manager (CRUD by category), auto-mapping rules, and a **Compose** modal you can launch from anywhere.
- **Compose anywhere** — ✉ Email buttons in Renewals, Bonds, Accounts (incl. per-contact), and Pipeline open a context-aware composer. Sending from a Renewal also logs a follow-up note and advances workflow.
- **Bond Company Partners** — Card grid of sureties: appetite, AM Best rating, contact, portal link, default commission, per-partner bond/premium/commission totals.
- **Settings** — Agency profile, integrations overview, reset / export demo data.

## Stack

Vanilla JS + Tailwind (Play CDN) + Chart.js + jsPDF + jsPDF-AutoTable. No
build, no server.

## File layout

```
index.html
css/styles.css
js/
  app.js           main controller / routing
  data.js          seed data + localStorage
  utils.js         formatters, modal, toast
  pdf.js           jsPDF document generators
  icons.js         inline SVG icons
  views/
    dashboard.js   pipeline.js   accounts.js    bonds.js
    renewals.js    calculator.js documents.js   commissions.js
    invoicing.js   email.js      partners.js    settings.js
```
