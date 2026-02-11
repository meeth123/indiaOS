# AlertDoc — Product Definition

## One-Liner
A compliance health check that tells NRIs in the US exactly what they owe India (and the IRS about India) — before penalties find them.

## Brand
- **Tagline**: "Don't guess. Know."
- **Voice**: Smart friend, not authority. Empowering, not alarming. Honest and specific.
- **Tone**: The friend who's a CA's kid, reads the fine print, then texts you a 3-bullet summary.

## Problem
4.4M Indian-origin people in the US. Most are silently non-compliant with obligations they don't know exist. Rules are scattered across IRS, FEMA, RBI, Indian IT Department. Penalties are severe ($10K+ per missed FBAR per account per year). Guidance is fragmented across CA blogs, Reddit, and outdated PDFs.

## Target Users

### Primary ICP: "Settled NRI"
- Age 28-45, moved to US 3-15 years ago
- H1B → Green Card → Citizen pipeline
- HHI $120K-$300K
- Has "stuff" in India: bank accounts, MFs, property, LIC, PPF
- Has filed US taxes but never FBAR, FATCA, or Indian ITR since leaving
- Willing to pay $10/mo for peace of mind

### Secondary ICP: "Recent Move NRI"
- Moved 0-2 years ago, still has active Indian financial life
- Higher urgency, more engaged

### Anti-Persona
- NRIs who already have CA + CPA handling everything
- Ultra-HNW with complex trusts (need bespoke advisory)
- NRIs outside the US (Phase 2)

## What This Product Is NOT
| Assumption | Reality |
|---|---|
| Document vault / Digilocker | Compliance intelligence engine — tells you what to do and when |
| Tax filing service | Identifies obligations, connects to professionals who file |
| Financial advisor | Compliance tracker, never recommends financial products |
| CA/CPA replacement | Triage layer — tells you when you need one, connects to vetted ones |

## Core Product: Free Health Check

### Design Philosophy
Ask LIFE questions, not compliance questions. User doesn't know what FBAR is. They know they have an HDFC savings account. Rules engine translates life facts → compliance obligations.

Must feel: fast, non-judgmental, slightly alarming in results. The "Oh Shit" moment on results page = entire conversion engine.

### Quiz Flow (5 Screens)
1. **Your NRI Journey** — year left India, US status (H1B/GC/Citizen/Other), filing status
2. **India Footprint** — checkboxes: bank accounts, MFs, stocks, property, insurance, PPF, NPS, EPF, NRE/NRO
3. **Ballpark Amounts** — ranges for each asset type (FBAR threshold = $10K aggregate peak balance)
4. **Income from India** — rental, interest, dividend, capital gains, business income
5. **Document Check** — tri-state (Yes/No/Not Sure) for: PAN, Aadhaar, OCI, FBAR, FATCA, PFIC, ITR, KYC, FEMA conversion

### Results Page ("Oh Shit" Moment)
- **Compliance Score**: 0-100 gauge (Critical/At Risk/Needs Work/Good/Excellent)
- **Money at Risk**: Large red penalty range
- **Issues Found**: Cards sorted by severity (Urgent/Warning/Info)
- **CTAs**: Pro subscription, CA/CPA referral, share score, email capture for PDF

### Rules Engine
Pure TypeScript, deterministic. 19 rules, no AI inference.

| # | Rule | Weight | Severity |
|---|------|--------|----------|
| 1 | FBAR Filing | 20 | Urgent |
| 2 | FATCA Form 8938 | 15 | Urgent |
| 3 | Indian ITR | 12 | Urgent |
| 4 | PAN Inoperative | 8 | Warning |
| 5 | FEMA Account Conversion | 10 | Warning |
| 6 | OCI Update | 5 | Warning |
| 7 | Aadhaar Biometric | 3 | Info |
| 8 | TDS Certificates | 3 | Info |
| 9 | Repatriation Forms | 4 | Info |
| 10 | PFIC Reporting | 12-15 | Urgent |
| 11 | DTAA Tax Residency | 4 | Info |
| 12 | Property Tax | 3 | Warning |
| 13 | Bank KYC Renewal | 5 | Warning |
| 14 | PPF NRI Status | 3 | Info |
| 15 | LIC Premium Tracking | 4 | Info |
| 16-19 | State-specific (FEIE, FTC, WA Cap Gains, Citizenship Renunciation) | 2-5 | Info/Warning |

Score = 100 - sum(triggered weights). "Not Sure" = 70% weight.

## Paid Tier: Pro ($9.99/mo or $99/yr)
- Personalized compliance calendar with all deadlines
- Automated reminders (email + push) at 30/15/7/1 day intervals
- Step-by-step fix-it guides with screenshots
- Document checklists per deadline
- Year-over-year compliance tracking
- CA/CPA sharing link (JWT, 30-day, read-only)
- Family profiles (up to 3: spouse, parents)
- 14-day free trial, no CC upfront

## Revenue Model
1. **Pro subscriptions** — primary revenue
2. **Affiliate referrals** — CAs, CPAs, tax filing platforms, NRI banking, forex
3. **Future Premium** ($29.99/mo) — AI monitoring, auto-fill, dedicated advisor
4. **Future B2B** — CA dashboard for managing NRI clients ($49-99/seat)

## Tech Stack
- **Frontend**: Next.js 14+ (App Router), Tailwind, shadcn/ui
- **Backend**: Supabase (Auth, Postgres, Edge Functions, RLS)
- **Email**: Resend + React Email
- **Payments**: Stripe (subscriptions, webhooks, customer portal)
- **Analytics**: PostHog + Plausible
- **Hosting**: Vercel
- **Push**: Web Push API (native browser)
- **Error tracking**: Sentry
- **Rate limiting**: Upstash Redis

## Key Metrics
- **North Star**: Monthly Active Compliance-Managed Users
- **Funnel**: Landing → Quiz Start (40%) → Quiz Complete (70%) → Email Capture (30%) → Signup (15%) → Pro (10%)
- **Revenue targets**: $700 MRR (month 3) → $16K MRR (month 12)
- **Break-even**: Month 4-5

## Domain
alertdoc.club

## Current Build Status
- Landing pages: Built (/, /lp0, /lp2 — multiple variants)
- Quiz flow: Built (5 screens, all fields, bug-fixed)
- Rules engine: Built (19 rules, 200+ exhaustive tests)
- Results page: Built (/results)
- PDF report API: Built (/api/report)
- SEO: Built (robots.ts, sitemap.ts, structured data, OG)
- Deadlines system: Built (countdown on homepage)
- Auth/Supabase: Not started (no auth files found)
- Dashboard: Not started
- Stripe/Payments: Not started
- Email reminders: Not started
- Blog/Content: Not started
- Push notifications: Not started

## Roadmap (Priority Order)
1. **NOW: SEO + Content launch** — Blog infra, 5 cornerstone articles, compliance calendar, penalty calculator, Google Search Console
2. **NEXT: Community seeding** — Reddit (r/ABCDesis, r/IndiaInvestments, r/tax), Quora, NRI Facebook groups, WhatsApp channel, Product Hunt prep
3. **THEN: UX polish + beta launch** — Performance, error states, beta with 10-20 NRIs
4. **THEN: Auth + Dashboard** — Supabase auth, user accounts, saved results, compliance dashboard
5. **THEN: Stripe + Pro tier** — Subscriptions, gated features, 14-day trial
6. **THEN: Reminders** — Email (Resend), web push, cron jobs

## Growth Channels
- Reddit (r/ABCDesis, r/IndiaInvestments, r/tax)
- Quora (NRI compliance questions)
- SEO (15-18K searches/mo addressable)
- NRI Facebook groups + WhatsApp channels
- Product Hunt launch
- Viral: shareable score cards
