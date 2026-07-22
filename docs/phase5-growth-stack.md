# Phase 5 — Growth Stack (Google Ads / SEO / AEO)

**Time & materials with cap. 6–10 weeks. $30k–$70k.**

## Goal

Wire in real growth-marketing data — paid search performance, organic
search performance, and AI-answer visibility — so decisions and reporting
happen inside BondVault instead of across 4 dashboards.

## Buy-vs-build guidance

Some of this is genuinely better bought than built. Recommended split:

| Capability | Build or buy | Rationale |
|---|---|---|
| Google Ads sync | **Build** | Google's Ads API is stable and free. ~2 weeks. |
| Google Search Console sync | **Build** | Free API. ~1 week. |
| GA4 sync | **Build** | Free API. ~1 week. |
| SEO crawler / audit | **Buy** — wire in Ahrefs or SEMrush | A real crawler is months of work. Ahrefs Starter is $199/mo. |
| Backlink data | **Buy** — Ahrefs / SEMrush API | No feasible in-house source. |
| Keyword rank tracking | **Buy** — same tools above | Same. |
| **AEO citation monitoring** | **Buy** — Profound / AthenaHQ / Otterly | Requires running queries against 5 AI engines daily at scale. Building this is a full product; tools start at $150/mo. |

Contractor's job: wire the bought-tool APIs into BondVault so the numbers
show up on our dashboards. Not to rebuild any of the tools themselves.

## In scope

**Google Ads integration**
- OAuth 2.0 connect (per Admin).
- Nightly sync: campaigns, ad groups, keywords, ads, performance metrics
  (impressions, clicks, conversions, cost, CTR, CPC, CPA, ROAS, quality score).
- **Conversion attribution**: match Google Ads conversions back to BondVault
  contacts → leads → accounts → bonds via UTM parameters + email hashing.
- Manual campaign changes NOT in scope (view-only initially — flip to
  read/write in a later mini-phase if the ROI is there).

**Google Search Console (GSC)**
- OAuth connect.
- Nightly pull of: search queries, positions, impressions, clicks, CTR
  per page.
- Powers the SEO tab's "Keyword Rankings" and "Page Performance" panels.

**Google Analytics 4 (GA4)**
- OAuth connect.
- Nightly pull of: sessions, users, source/medium, conversions,
  engagement time.
- Powers landing-page performance and attribution dashboards.

**Ahrefs or SEMrush API integration**
- API key in Admin. Nightly pull for:
  - Backlink profile (total, referring domains, DR, new/lost)
  - Keyword difficulty & search volume for tracked keywords
  - Competitor keyword tracking
  - Content gap analysis
- Powers the SEO tab's Backlink Profile and Content Gap sections.

**AEO tool integration (Profound / AthenaHQ / Otterly.ai)**
- API key + query list in Admin.
- Daily pull of: engine citations, position, snippet, sentiment.
- Powers the AEO tab's Recent Citations and Per-Engine Cards.

**Cross-channel attribution**
- Marketing → Sales pipeline: Google Ads spend → conversion → contact →
  lead → account → bond premium. First-touch attribution baseline;
  configurable window (30 / 60 / 90 days).
- Multi-touch attribution deferred.

**Alerting**
- Ranking drops on tracked keywords (>3 positions) → notification.
- Google Ads budget pace off by > 20% → notification.
- New citation appears on a tracked AEO query → notification.

## Out of scope (deferred)

- **Actual SEO content creation / brief-writing tools** (an editorial
  workflow inside BondVault). Would be a Phase 6 if the ROI is there.
- Bidding automation / auto-pause on Google Ads (buy Google's Smart
  Bidding first).
- Facebook / LinkedIn / TikTok ad account integrations. Add if we start
  spending materially there.
- SEO schema markup generator / auto-inserter.

## Acceptance criteria

- Connected Google Ads account displays yesterday's data in BondVault by 9 AM.
- A Google Ads-attributed lead in BondVault matches (customer ID + UTM
  campaign) at least one Ads conversion event.
- Ahrefs API returns fresh backlink data on nightly sync; new backlinks
  appear on the SEO tab within 24 hours.
- AEO tool returns fresh citation data for the top 20 tracked queries daily.
- A keyword dropping > 3 positions overnight generates an in-app notification
  and an email to Courtney.

## Tech stack additions

- Google Ads API v17+ (or current)
- Google Search Console API
- Google Analytics Admin + Data APIs
- Ahrefs API v3 or SEMrush API
- Third-party AEO tool of choice
- Scheduled sync workers (already added in Phase 2)

## Monthly SaaS costs enabled by this phase

| Tool | Estimated cost |
|---|---|
| Ahrefs Starter or SEMrush | $199–$449 |
| Profound / AthenaHQ / Otterly.ai | $150–$800 |
| Additional API quota (Google Ads / GSC / GA4) | $0 (free) |
| **Monthly, on top of base infra** | **$350–$1,250** |

## Dependencies from us

- Google Ads account with API access (usually enabled by default, one form
  otherwise).
- GSC verified for our primary domain.
- GA4 property configured.
- Ahrefs / SEMrush account with API access (paid tier required).
- AEO tool trial → paid account.
- List of the top 20 AEO queries we want monitored (we can seed with the
  ones already in the prototype).
