# BondVault — Build Documentation

These specs describe the phased build of BondVault, a bond-management platform
for Vanderbeck Surety Agency. The interactive prototype at
`https://cvanderbeck.github.io/Suretybondsoftware/` **is the visual spec** —
each phase below refers back to it for field-level detail.

## Read order for a new contractor

1. **This README** — overview and how to bid.
2. **The live prototype** — click through every view. Feel the workflow. Note anything unclear.
3. **`phase1-core-mvp.md`** — the only phase we're quoting fixed-price today.
4. Phases 2–5 — context. Quote hourly rates against these; firm scope at end of Phase 1.

## Phase map

| # | Phase | Timeframe | Range |
|---|---|---|---|
| 1 | Core MVP | 12–16 wk | $50k–$100k |
| 2 | Integrations (email, QBO, cloud, e-sign) | 8–12 wk | $35k–$70k |
| 3 | Workflow polish (templates, automations, WIP, commissions, reporting) | 6–10 wk | $25k–$50k |
| 4 | Marketing Hub (contacts, campaigns, blasts, attribution) | 10–16 wk | $50k–$110k |
| 5 | Growth stack (Google Ads, SEO, AEO) | 6–10 wk | $30k–$70k |
| — | Carrier portal integrations (per carrier) | 4–8 wk each | $15k–$30k each |

**Live and useful after Phase 1.** Phase 2 removes email-app-switching pain.
Phase 3 removes admin drudgery. Phases 4+5 are marketing/growth.

## How we're bidding

- **Phase 1: fixed price.** 4 milestone payments (25% each) tied to the Acceptance
  Criteria in `phase1-core-mvp.md`. Send a firm quote.
- **Phases 2–5: quote hourly rate + estimated hours.** These will be
  T&M with a not-to-exceed cap per phase, firmed up after Phase 1.
- **Carrier integrations: quote each separately** as we identify which carriers
  have APIs worth the work.

## Non-negotiables

- All code is Vanderbeck property from commit #1.
- Written setup / deploy / environment-variable docs in the repo.
- Production-quality logging + error tracking (Sentry or similar).
- Daily encrypted database backups, 30-day retention.
- Audit log: who changed what, when, on every user-facing mutation.

## Questions a contractor should ask before quoting

If they don't ask most of these, they haven't read the prototype closely.

1. Does the existing icon/color system carry through, or would you rebuild the UI?
2. Are the 5 bond types (Bid, P&P, Subdivision, License/Permit, Probate) the final list?
3. How many concurrent users on day one? Day 90?
4. Is data migration required from an existing system, or do we start clean?
5. Multi-state licensing / compliance considerations?
6. E-signature — DocuSign or Dropbox Sign?
7. Email host — Microsoft 365 or Google Workspace? (drives Phase 2)
8. Is there existing brand identity (fonts, logo files) beyond what's in the prototype?

## Contact

Courtney Vanderbeck · courtneykvanderbeck@gmail.com

Prototype: https://cvanderbeck.github.io/Suretybondsoftware/
Repo: https://github.com/cvanderbeck/Suretybondsoftware
