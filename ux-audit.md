# UX/UI Audit — AlertDoc (New Pages)
**Date**: 2026-02-11
**Auditor**: Claude (Product Design)
**Scope**: Blog listing, 5 blog articles, interactive compliance calendar

## Product Summary
A compliance health check that tells NRIs in the US what they owe India (and the IRS about India) — before penalties find them. Voice: smart friend, not authority.

## Core Flows Audited
- **P1**: Blog listing → Article reading → Quiz CTA conversion
- **P1**: Calendar browsing → Quiz CTA conversion

---

## Flow: Blog Reading

### Screen: Blog Listing (`/blog`)
**Screenshots**: `ui-screenshots/blog/blog-listing-desktop.png`, `blog-listing-mobile.png`

#### Goods
- Clean 2-column grid with good card structure (reading time badge, date, title, description, READ MORE)
- Yellow highlight on "Guides & Resources" heading matches brand
- Footer with Blog, Deadlines, Privacy, Terms, Contact is complete
- Mobile stacks to single column properly
- "READ MORE →" links are clear pink CTAs

#### Bads
- **[CRITICAL]** No mobile navigation
  - Where: Nav component — `hidden md:flex` hides all nav links on mobile
  - Why: On mobile (majority of traffic), users see only the logo. No way to reach quiz, blog, calendar, or any other page. Complete dead end for mobile users.
  - Fix: Add hamburger menu with slide-out drawer for mobile

- **[MINOR]** 5th article card orphaned in grid
  - Where: Blog listing grid, last card sits alone on left
  - Why: 2-col grid with odd number of items. Slight visual imbalance.
  - Fix: Acceptable until 6th article. Or make last card span full width.

---

### Screen: Blog Article (`/blog/fbar-guide-2026` — representative of all 5)
**Screenshots**: `ui-screenshots/blog/blog-fbar-header-desktop.png`, `blog-fbar-body-desktop.png`, `blog-fbar-table-desktop.png`, `blog-fbar-cta-desktop.png`

#### Goods
- Breadcrumbs (Home / Blog / Title) provide clear navigation context
- Article header is clean: big title, description, reading time badge, date, author
- H2 with yellow highlight (`highlight-yellow`) creates excellent visual section breaks
- H3 with monospace font provides strong sub-section hierarchy
- Blockquotes with yellow background (`why-applies-box`) are distinctive and eye-catching
- Body text at `text-base md:text-lg` with `leading-relaxed` is highly readable
- Internal links (pink) vs external links (purple) are distinguishable
- Bottom CTA "Not sure what applies to you?" is strong and well-placed
- Mid-article `<CtaBanner>` is well-positioned
- Keyword tags at bottom are useful for SEO context

#### Bads
- **[CRITICAL]** Markdown tables render as raw pipe-delimited text
  - Where: "FBAR Deadlines 2026" section — shows `| Milestone | Date ||------------|------|| Tax year covered | January 1...` as inline text
  - Why: All 5 articles use tables extensively (comparison tables, penalty tables, deadline tables). Without rendered tables, key information is unreadable. This is the #1 issue.
  - Fix: Add `remark-gfm` plugin to `MDXRemote` options. Install `remark-gfm`, pass `options={{ mdxOptions: { remarkPlugins: [remarkGfm] } }}` to MDXRemote.

- **[CRITICAL]** No mobile navigation (same as listing)
  - Where: Nav component on all pages
  - Why: Mobile users cannot navigate anywhere
  - Fix: Hamburger menu (shared fix)

- **[MAJOR]** Logo is oversized in nav
  - Where: Nav — `h-28 md:h-32` (112px/128px tall)
  - Why: Takes up ~14% of mobile viewport height before any content. Wastes precious above-the-fold space. On articles, users must scroll past a massive logo to reach the headline.
  - Fix: Reduce to `h-12 md:h-14` (~48-56px) which is standard for web app navs.

- **[MINOR]** Breadcrumb wraps awkwardly with long titles
  - Where: Breadcrumb on mobile for titles like "The Complete Guide to FBAR for NRIs in the USA (2026)"
  - Why: Full title in breadcrumb causes multi-line wrapping on narrow screens
  - Fix: Truncate title in breadcrumb with `truncate` class and `max-w-[200px]` on mobile

- **[MAJOR]** FBAR vs FATCA table is an unreadable wall of text
  - Where: "FBAR vs FATCA" section — the 11-row comparison table renders as a massive paragraph of pipe-delimited text spanning ~15 lines on mobile, ~8 lines on desktop
  - Why: This is the longest and most important table in the article (11 rows, 3 columns with long content). As raw pipe text, the FBAR/FATCA comparison — the #1 thing NRIs Google — is completely unreadable. Far worse than the smaller deadline tables.
  - Fix: Same root cause as CRITICAL table issue (`remark-gfm`). But even after fix, this table needs `overflow-x-auto` wrapper + consider a stacked card layout on mobile for readability.
  - Verified: 2026-02-11 via Playwright (desktop + mobile screenshots)

- **[MAJOR]** Footer Privacy, Terms, and Contact links are dead
  - Where: Footer component — `footer.tsx` lines 29-43, all three links use `href="#"`
  - Why: On a compliance-focused site telling NRIs about $100K penalties, dead legal links destroy trust. Users clicking "Privacy" or "Terms" get scrolled to top with nothing. Google also penalizes sites without functional legal pages.
  - Fix: Create `/privacy`, `/terms`, and `/contact` pages. Even simple ones are better than dead links.
  - Verified: 2026-02-11 via source code review

- **[MINOR]** No Table of Contents for 20-min read articles
  - Where: Article layout — `article-layout.tsx`, no TOC component exists
  - Why: The FBAR guide has 11 H2 sections across a 20-minute read. Users scanning for specific info (e.g., "FBAR vs FATCA" or "Streamlined Filing") must scroll through the entire article. Compliance content is reference material — people come back to find specific sections, not re-read everything.
  - Fix: Add a sticky or inline TOC component that lists H2 sections with anchor links. Could be a simple sidebar on desktop or collapsible section after the header on mobile.
  - Verified: 2026-02-11 via Playwright (full-page scroll)

- **[MINOR]** Double hyphens (--) throughout article instead of em dashes
  - Where: MDX content — appears 15+ times across the FBAR guide (e.g., "standalone violation -- even if", "ELSS -- any of them", "extension is automatic |")
  - Why: Double hyphens look unprofessional in a long-form compliance guide. Em dashes (—) are typographically correct and improve readability.
  - Fix: Either search-and-replace `--` with `—` in MDX content, or add `remark-smartypants` plugin to MDXRemote options for automatic typographic conversion.
  - Verified: 2026-02-11 via Playwright screenshots

- **[MINOR]** Keyword tags at bottom are non-interactive
  - Where: Article layout — `article-layout.tsx` lines 63-72, keyword badges are static `<span>` elements
  - Why: They visually look like clickable tags/chips (bordered, pill-shaped) but do nothing on click. Users may expect to find related articles by clicking a keyword. The affordance mismatch is confusing.
  - Fix: Either link keywords to `/blog?tag={keyword}` filtered view (ideal), or restyle them to look less interactive (remove border, use lighter background).
  - Verified: 2026-02-11 via Playwright (footer screenshot)

---

## Flow: Calendar Browsing

### Screen: Compliance Calendar (`/calendar`)
**Screenshots**: `ui-screenshots/calendar/calendar-header-desktop.png`, `calendar-expanded-desktop.png`, `calendar-header-mobile.png`, `calendar-expanded-mobile.png`

#### Goods
- "Every deadline in 2026" headline with yellow-highlighted year is punchy
- Category filter buttons are clean, well-labeled with color dots
- Color-coded days-left badges (green for far, yellow for medium, red for close) are immediately scannable
- Expandable cards work well — penalty info, description, applicability visible on expand
- Month headers with deadline count ("7 deadlines") provides useful context
- February is correctly omitted (no deadlines)
- 2-column grid on desktop is efficient use of space
- Bottom CTA "Check which deadlines apply to you" is well-placed and relevant
- Mobile stacks to single column properly

#### Bads
- **[MAJOR]** January deadlines show 2027 dates
  - Where: January section — "Form 1040-ES Q4" shows "January 15, 2027", "TDS Return Q3" shows "January 31, 2027"
  - Why: `calculateDeadlineDate()` rolls past dates to next year. Since we're in Feb 2026, Jan 2026 has passed, so it shows 2027. But the page is titled "Every deadline in 2026" — showing 2027 dates is confusing and undermines trust.
  - Fix: Calendar page should force year to 2026 for all deadlines, regardless of whether the date has passed. Use a calendar-specific date calculation that pins to 2026.

- **[CRITICAL]** No mobile navigation (same as other pages)
  - Where: Nav component
  - Fix: Hamburger menu (shared fix)

---

## Summary Scorecard

| Page | Score | Critical | Major | Minor |
|------|-------|----------|-------|-------|
| Blog Listing | 7/10 | 1 | 0 | 1 |
| Blog Articles (x5) | 4/10 | 2 | 3 | 4 |
| Calendar | 7/10 | 1 | 1 | 0 |

## Top 8 Priorities

1. **[CRITICAL] Fix MDX table rendering** — Install `remark-gfm`, add to MDXRemote options. Unblocks all table content across 5 articles. The FBAR vs FATCA comparison table is especially devastating as raw text.
2. **[CRITICAL] Add mobile navigation** — Hamburger menu with slide-out drawer. Affects all pages.
3. **[MAJOR] Fix dead footer links** — Privacy, Terms, Contact all point to `href="#"`. Create real pages. Non-negotiable for a compliance site.
4. **[MAJOR] Fix calendar 2027 dates** — Pin calendar to 2026 year, mark past deadlines as "passed" instead of rolling to 2027.
5. **[MAJOR] Shrink nav logo** — From `h-28/h-32` to `h-12/h-14`. Reclaims viewport space.
6. **[MINOR] Add Table of Contents** — Sticky/inline TOC for 20-min articles with 11+ sections. Compliance content is reference material.
7. **[MINOR] Truncate breadcrumb title on mobile** — Add `truncate` + max-width to prevent wrapping.
8. **[MINOR] Typographic polish** — Replace `--` with em dashes, make keyword tags interactive or restyle as non-interactive.

## Design System Observations
- Color palette (yellow, pink, purple, green) is consistent and distinctive
- Space Mono for headings + DM Sans for body is well-applied
- Brutal borders (3px black) and shadow offset pattern is consistent
- `highlight-yellow` and `highlight-pink` background markers are a strong brand element
- Badge system (`badge-info`, `badge-urgent`) is clean
- `why-applies-box` (blockquote) styling is distinctive and well-used in articles
