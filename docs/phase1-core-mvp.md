# Phase 1 — Core MVP

**Fixed price. 12–16 weeks. $50k–$100k.**

## Goal

Replace the BondVault prototype with a real multi-user app the agency runs on
day one. After Phase 1, we stop using spreadsheets for accounts, bonds,
pipeline, and renewals.

## In scope

**Authentication & users**
- Email + password login. MFA optional.
- Roles: Admin, Producer, Read-only.
- User management screen for the Admin role.
- Session management, password reset flow, audit log of every mutation.

**Data model & CRUD** (see prototype for field-level detail)
- **Accounts** — full tabbed detail: Overview, Company, Contacts, Indemnitors,
  Underwriting, Bonds, WIP, Tasks, Pipeline/Bids, Documents, Emails.
- **Bonds** — all 5 types (Bid, Payment & Performance, Subdivision/Site
  Improvement, License/Permit, Probate) with type-specific fields.
- **Pipeline opportunities** — 7 default stages, editable. Bid results.
  Convert-to-Bond flow.
- **Renewals** — auto-created at 90 days from expiration, with a full snapshot
  of the source bond copied onto the renewal record.
- **Leads** — separate pipeline with full Contractor Questionnaire (CQ)
  captured at intake and carried into the account on conversion.
- **Tasks** — cross-entity, with priorities (P1–P4), assignees, date-range
  filters. Sidebar aggregation across all entities.
- **Lost bids** — surface bids that were not won (bidResult in `not_low`,
  `no_bid`, `withdrawn`, `cancelled`) on the account Overview and Pipeline tabs.

**Documents**
- Upload to S3 (or R2). Folder-template auto-provisioning per account,
  bond, opportunity, renewal.
- Underwriting Documents attach to Leads and carry to the account on convert.
- Bond Certificate + Invoice PDF generation, server-side, matching the
  prototype's layout.

**Utility features**
- Aggregate & single limit tracking per account (WIP credits reduce backlog).
- PDF form uploader on New Lead / New Opportunity / New Bond that auto-fills
  fields via text extraction (pdf.js server-side or client, up to contractor).
- Email templates + variable substitution (Compose modal). No inbox sync yet.
- Premium calculator.

**Ops**
- Audit log for every user-facing mutation (who / what / when / diff).
- Daily encrypted database backups, 30-day retention.
- Error tracking (Sentry) + basic uptime monitoring.

## Out of scope (deferred)

- Real inbox sync (Phase 2).
- QuickBooks Online integration (Phase 2).
- E-signature (Phase 2).
- Cloud folder mirroring — Dropbox/OneDrive real API (Phase 2).
- Marketing Hub (Phase 4).
- Google Ads / SEO / AEO (Phase 5).
- Carrier portal automations (separate phase per carrier).
- Mobile-native app.

## Acceptance criteria

- 5+ users log in concurrently from different devices and see the same data.
- Creating a bond reduces aggregate availability for the account in real time.
- A bond crossing 90 days to expiry auto-creates a renewal card **with a
  full bond snapshot** including type-specific fields.
- All fields in the prototype persist; nothing is lost on reload.
- A lost bid appears on the account Overview + Pipeline tab immediately.
- Bond Certificate PDF matches the prototype's `PDF.bondCertificate` layout.
- Documents upload to S3 and appear in the correct folder per the template.
- Uploading a Contractor Bond Request Form PDF fills at least 4 fields
  automatically on the New Opportunity modal.
- Audit log records the change when any entity is modified.
- Test coverage on business rules (aggregate math, WIP credits, renewal
  auto-creation) at 70%+.

## Tech stack

Contractor's choice, provided:
- Modern framework (React or Vue) on the front-end
- Node/Express or Python/FastAPI on the back-end
- PostgreSQL (Neon, Supabase, or AWS RDS)
- Auth0 or Clerk for auth (do not roll your own)
- S3 or Cloudflare R2 for files
- Render, Railway, or Fly.io for hosting

## Dependencies from us

- Real account/bond/pipeline seed data export from current spreadsheets.
- Branding assets (logo files, brand colors already in prototype).
- One named product owner (Casey) — decisions in < 24 hrs during active phases.
- Decision on Microsoft 365 vs. Google Workspace (drives Phase 2 quote).

## Payment schedule

Four milestone payments, each **25% of fixed price**:

1. **Kickoff**: contract signed, environment set up, first deploy of empty shell.
2. **Data layer complete**: all CRUD, no integrations. All prototype fields
   persist end-to-end.
3. **Feature complete**: renewal auto-creation, PDF generation, form parser,
   audit log, permissions all working. Acceptance criteria all met on staging.
4. **Production go-live**: deployed to production URL. Agency team onboarded.
   30-day post-launch bug-fix warranty starts.
