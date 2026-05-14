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
- **Pipeline & Bids** — Kanban (Prospect → Quoting → Submitted → **Bid Awaiting** → Won/Lost) with drag-drop and CSV export. Convert won opportunities directly into bonds.
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
- **Bonds** — Full CRUD for bonds with per-bond **commission %**, premium calc, status, surety partner, and **PDF bond certificate export**. Bulk bonds report PDF too.
- **Premium Calculator** — Bond class + subclass, credit/experience/working-capital/indemnity adjustments, per-partner spread, commission preview, and **PDF quote export**.
- **Documents** — Drag-drop uploads, batch attach to account/bond, category tagging, simulated preview, delete.
- **Commissions** — Per-bond and per-surety roll-ups, YTD totals, CSV export.
- **Invoicing & QuickBooks Online** — Connect / disconnect QBO (simulated OAuth), sync individual or all invoices, map A/R + Income accounts, PDF invoice export, status flow (Draft → Open → Paid).
- **Email Integration** — Connect Microsoft 365 / Google Workspace (simulated OAuth), inbox view with **auto-mapping** rules (bond-# regex, sender domain, partner sender, obligee fuzzy match) and manual map-to-account/map-to-bond.
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
    calculator.js  documents.js  commissions.js invoicing.js
    email.js       partners.js   settings.js
```
