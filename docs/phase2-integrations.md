# Phase 2 — Integrations

**Time & materials with cap. 8–12 weeks. $35k–$70k.**

## Goal

Stop app-switching. Bring real email, accounting, cloud-storage, and
e-signature into BondVault so the daily workflow lives in one place.

## In scope

**Email — bi-directional sync**
- Microsoft Graph **or** Gmail API (based on agency host). OAuth per user.
- Inbound: messages appear in BondVault inbox within 60 seconds of arrival.
  Auto-map to Accounts, Bonds, Opportunities, Renewals via the existing
  matching rules (email domain → account, subject line matching, etc.).
- Outbound: emails sent from Compose land in the user's actual Sent folder
  and thread correctly.
- **Multi-opportunity mapping**: a single email attachable to N opportunities
  (per the prototype's mapping modal). Same for renewals.
- **Real attachments**: files uploaded to S3, not data URLs. Attachment
  picker on the "New Opportunity from email" flow copies selected files
  onto the opportunity record.

**QuickBooks Online**
- OAuth connect per Admin.
- **Push**: "Create QBO Invoice" button on Bond detail creates the invoice
  in QBO, syncs the QBO Invoice # back onto the bond.
- **Pull**: nightly sync of payment status (Paid / Overdue / Draft) back to
  the Bonds view.
- **Customers**: automatic customer creation in QBO when a Bond is issued
  for a new account.

**Cloud storage — Dropbox or OneDrive**
- OAuth connect per user (or agency-level service account).
- Auto-provision the folder tree from the prototype's folder template when a
  new account, bond, opportunity, or renewal is created.
- Two-way sync: docs added to the folder appear in the app's Documents tab;
  docs uploaded in the app appear in the folder.
- Conflict resolution: last-write-wins, with a change log per file.

**E-signature — DocuSign or Dropbox Sign**
- Send bond forms, GIAs, indemnity agreements for signature from Bond or
  Account detail.
- Envelope status updates back to bond tracking dates (Reported to Bond Co.,
  Approved by Principal/Obligee, Sent Out to Principal).
- Signed PDFs land in the correct Documents folder.

## Out of scope (deferred)

- Marketing bulk email (Phase 4).
- Google Ads / SEO integrations (Phase 5).
- Individual carrier portal automations (separate phase).
- SMS / Slack / Teams notifications.

## Acceptance criteria

- New inbound carrier email lands in BondVault within 60 seconds and
  auto-maps to the correct account ≥ 80% of the time on our seed dataset.
- Clicking "Push to QBO" creates the invoice in our QBO sandbox with the
  right customer, line items, and amount.
- Creating a new account creates the matching Dropbox/OneDrive folder tree
  within 30 seconds.
- A DocuSign-signed GIA returns the signed PDF to the account's Documents
  tab and stamps the indemnity record with the signed date.
- Renewal invoice emails from carriers correctly attach to the right renewal
  card in most cases; misfires are correctable in the mapping modal.

## Tech stack additions

- Microsoft Graph SDK (or Google APIs Client Library for Gmail)
- Intuit OAuth 2.0 + QBO API v3
- Dropbox API v2 or Microsoft Graph (for OneDrive)
- DocuSign eSignature REST API or Dropbox Sign API
- Background job worker (BullMQ, Celery, or Sidekiq) for sync jobs
- Redis for the job queue

## Dependencies from us

- **QBO admin access** (sandbox first, production second).
- **Microsoft 365 or Google Workspace admin** to grant OAuth scopes.
- **Dropbox or OneDrive Business account** with admin.
- **DocuSign or Dropbox Sign account** with API access enabled.
- Decision on shared mailbox vs. per-user mailboxes for the sync.

## Payment structure

Time & materials with a not-to-exceed cap set at the end of Phase 1 once
the contractor knows the codebase. Weekly invoices with hours + summary.
