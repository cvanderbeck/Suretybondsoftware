# Phase 4 — Marketing Hub

**Time & materials with cap. 10–16 weeks. $50k–$110k.**

## Goal

Build the top-of-funnel we don't have today. After Phase 4 we can run
campaigns, nurture prospects, attribute revenue back to marketing spend,
and prove which channels grow the book.

## In scope

**Marketing Contacts database**
- Separate from operational contacts (accounts/leads still live there).
- Lifecycle stages: Subscriber → Lead → MQL → SQL → Opportunity → Customer → Evangelist.
- Fields: source, campaign attribution, lead score, tags, UTM parameters,
  activity timeline, list memberships.
- Convert-to-Lead flow that pushes into the existing Leads pipeline
  (already stubbed in the prototype).
- Full CRUD; import via CSV; export via CSV.

**Campaigns**
- Types: Outbound Email, Inbound, Newsletter, Paid Social, Paid Search,
  Event, Referral, Direct Mail, Content, Other.
- Per-campaign fields: name, channel, status, dates, budget, spent, goal,
  description, tags.
- Metrics: impressions, clicks, contacts, MQLs, SQLs, opportunities,
  won revenue, cost, ROI.
- Every marketing contact attributes to a source campaign.
- Every won bond attributes back through the source contact's original campaign
  (multi-touch attribution optional — first-touch is fine for v1).

**Lists / Segments**
- **Static** lists: manually curated contact IDs.
- **Dynamic** lists: filter builder against contact fields (stage, source,
  score, tags, campaign, custom fields).
- CSV export.
- **Send blast to list** launches into the email composer with list preselected.

**Email Blasts**
- Bulk email via SendGrid or Mailgun (contractor's choice; real delivery
  required).
- Template variable substitution across the recipient list.
- **Real engagement tracking**: opens (pixel), clicks (tracking links),
  unsubscribes (compliance-mandated one-click), bounces.
- Draft → scheduled → sent lifecycle.
- Unsubscribe list is honored across all future blasts.

**Landing Pages**
- Simple builder: title, hero, form, thank-you. Not a full CMS.
- Publish to a public URL (custom subdomain support: `marketing.vanderbeck-surety.com`).
- Form submissions create marketing contacts and fire enrollment in a
  sequence.
- Track: visits, submissions, conversion rate.

**Sequences (Marketing drip)**
- Triggers: contact-created, lifecycle-mql, lifecycle-sql, renewal-90d,
  form-submitted, manual-enroll.
- Steps: email, task, wait, SMS (if we add Twilio in scope — decide at kickoff).
- Enrollment stats: enrolled / in progress / completed / unsubscribed.

**Attribution Dashboard**
- Revenue by campaign, source, channel.
- Blended ROI across all marketing spend.
- Contact-to-customer conversion rate over time.
- Top campaigns by influenced pipeline.
- Traffic sources chart (already in prototype).

**Lead scoring**
- Rule-based (matching the prototype: opens = +5, clicks = +10, form = +25,
  meeting = +30, etc.).
- Configurable in Admin.
- Auto-upgrade lifecycle stage at thresholds (Subscriber → Lead → MQL → SQL).

## Out of scope (deferred)

- SMS marketing (unless we add Twilio at kickoff).
- Advanced multi-touch attribution modeling (first-touch + last-touch is fine
  for v1).
- Chatbots / live chat.
- Ad account integrations (Phase 5).
- Full CMS / website builder.

## Acceptance criteria

- 500-contact email blast delivers to real inboxes with < 1% bounce rate on
  a warmed sending domain.
- Opens, clicks, unsubscribes, and bounces track per contact within 15
  minutes of the recipient's action.
- A landing page submission creates the marketing contact, attributes to
  the source campaign, enrolls in the correct sequence, and appears in
  the CRM within 30 seconds.
- Attribution dashboard reconciles: `sum(campaign.wonRevenue)` matches
  `sum(bonds.premium where source campaign is set)`.
- A dynamic list re-evaluates within 60 seconds when a contact field changes.

## Tech stack additions

- SendGrid or Mailgun (transactional + marketing email)
- Sender domain warm-up + SPF/DKIM/DMARC setup (contractor's responsibility)
- A public site for landing pages — Next.js static pages or standalone
  templates
- Web analytics (Plausible or PostHog) for landing page traffic

## Dependencies from us

- Existing contact lists from Mailchimp / Google Sheets / wherever they live.
- Existing sending domain (or willingness to warm one up — takes 2–4 weeks).
- Approval for the "unsubscribe" compliance flow (required by law).
- Rough list of the top 5 sequences we want ready on day one.
