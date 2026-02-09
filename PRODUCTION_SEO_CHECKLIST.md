# AlertDoc SEO - Production Deployment Checklist

## 🚀 Pre-Deployment

### 1. Environment Variables
- [ ] Set `NEXT_PUBLIC_BASE_URL=https://alertdoc.in` in production environment
- [ ] Verify environment variable is loaded correctly
- [ ] Test that all metadata URLs use production domain

### 2. Final Build Verification
- [ ] Run `npm run build` locally to check for errors
- [ ] Verify no console errors or warnings
- [ ] Test all routes render correctly in production mode
- [ ] Verify og-image.png is included in build output

---

## 📊 Post-Deployment - Day 1

### 3. Google Search Console Setup
- [ ] Add property for `https://alertdoc.in`
- [ ] Verify domain ownership (DNS TXT record or HTML file)
- [ ] Submit sitemap: `https://alertdoc.in/sitemap.xml`
- [ ] Request indexing for key pages:
  - [ ] Homepage: `https://alertdoc.in`
  - [ ] Quiz: `https://alertdoc.in/quiz`
  - [ ] LP0: `https://alertdoc.in/lp0`
  - [ ] LP2: `https://alertdoc.in/lp2`

### 4. Robots.txt Verification
- [ ] Visit `https://alertdoc.in/robots.txt`
- [ ] Confirm AI crawlers are allowed (GPTBot, Claude-Web, etc.)
- [ ] Confirm sitemap URL is present

### 5. Sitemap.xml Verification
- [ ] Visit `https://alertdoc.in/sitemap.xml`
- [ ] Confirm all 5 routes are present
- [ ] Verify lastmod dates are correct
- [ ] Check priorities: homepage (1.0), quiz/LPs (0.9), results (0.3)

---

## 🔍 Structured Data Validation

### 6. Google Rich Results Test
Test each page for schema validation:

- [ ] **Homepage**: `https://search.google.com/test/rich-results`
  - Expected schemas: Organization
  - Check for errors/warnings

- [ ] **Quiz Page**: `https://search.google.com/test/rich-results`
  - Expected schemas: Organization, HowTo, FAQPage
  - Verify HowTo steps are parsed correctly
  - Verify FAQ questions are parsed correctly

- [ ] **LP0 Page**: `https://search.google.com/test/rich-results`
  - Expected schemas: Organization, WebApplication, FAQPage
  - Check SoftwareApplication rating

- [ ] **LP2 Page**: `https://search.google.com/test/rich-results`
  - Expected schemas: Organization, WebApplication, FAQPage
  - Check SoftwareApplication rating

### 7. Schema.org Validator
- [ ] Test each page with https://validator.schema.org/
- [ ] Fix any warnings or errors
- [ ] Document any intentional warnings

---

## 📱 Social Media Sharing Tests

### 8. Facebook Open Graph Debugger
URL: `https://developers.facebook.com/tools/debug/`

Test all pages:
- [ ] Homepage: `https://alertdoc.in`
  - Verify og:image displays correctly
  - Check title: "AlertDoc — NRI Compliance Health Check"
  - Check description matches

- [ ] Quiz: `https://alertdoc.in/quiz`
  - Verify og:image displays correctly
  - Check title: "Take the NRI Compliance Quiz — AlertDoc"

- [ ] LP0: `https://alertdoc.in/lp0`
  - Verify og:image displays correctly
  - Check title: "AlertDoc — NRI Compliance Health Check (US Edition)"

- [ ] LP2: `https://alertdoc.in/lp2`
  - Verify og:image displays correctly
  - Check title: "AlertDoc — Find Your NRI Compliance Blind Spots in 2 Minutes"

**Actions:**
- [ ] Click "Scrape Again" to clear cache
- [ ] Verify image dimensions: 1200x630px
- [ ] Verify image loads (no 404 errors)

### 9. Twitter Card Validator
URL: `https://cards-dev.twitter.com/validator`

Test all pages:
- [ ] Homepage: `https://alertdoc.in`
  - Verify card type: `summary_large_image`
  - Verify image displays correctly
  - Check title and description

- [ ] Quiz: `https://alertdoc.in/quiz`
  - Verify card type: `summary_large_image`
  - Verify image displays correctly

- [ ] LP0: `https://alertdoc.in/lp0`
  - Verify card type: `summary_large_image`
  - Verify image displays correctly

- [ ] LP2: `https://alertdoc.in/lp2`
  - Verify card type: `summary_large_image`
  - Verify image displays correctly

**Actions:**
- [ ] Request approval for Twitter Cards (if needed)
- [ ] Verify no warnings or errors

### 10. LinkedIn Post Inspector
URL: `https://www.linkedin.com/post-inspector/`

- [ ] Test homepage URL
- [ ] Verify og:image displays correctly
- [ ] Check title and description

---

## 🤖 AI Crawler Verification

### 11. AI Crawler Testing (Week 1-2 post-launch)
- [ ] Verify Googlebot can access all pages (check GSC Coverage report)
- [ ] Check server logs for AI crawler visits:
  - GPTBot (OpenAI)
  - ChatGPT-User (ChatGPT browsing)
  - PerplexityBot (Perplexity AI)
  - Claude-Web (Anthropic)
  - Anthropic-AI

- [ ] Test if AlertDoc appears in AI responses:
  - [ ] Ask ChatGPT: "What is AlertDoc?"
  - [ ] Ask Perplexity: "NRI compliance health check tools"
  - [ ] Ask Claude: "Tools for NRI tax compliance"

---

## 📈 Analytics & Monitoring

### 12. Set Up Monitoring
- [ ] Configure Google Analytics 4 (if using)
- [ ] Set up Google Search Console email alerts
- [ ] Monitor Core Web Vitals in GSC
- [ ] Set up uptime monitoring (e.g., UptimeRobot)

### 13. Weekly Checks (First Month)
- [ ] Check GSC for indexing issues
- [ ] Monitor search impressions and clicks
- [ ] Review structured data errors
- [ ] Check for broken links or 404s

---

## 🎯 Performance Targets

### Expected Results (30 days post-launch):
- [ ] All 5 pages indexed by Google
- [ ] Rich snippets appearing in search results
- [ ] FAQ schema generating featured snippets
- [ ] Social media shares display correct og-image
- [ ] AI assistants can retrieve AlertDoc information

---

## 🔧 Troubleshooting

### Common Issues:

**og-image not displaying:**
- Clear cache in Facebook Debugger / Twitter Validator
- Verify image URL is absolute (not relative)
- Check image is accessible (no 401/404)
- Verify image size < 8MB

**Structured data not recognized:**
- Validate JSON-LD syntax in console
- Check for duplicate schemas on same page
- Verify required fields are present

**Pages not indexed:**
- Check robots.txt isn't blocking
- Verify sitemap.xml is accessible
- Request indexing via GSC
- Check for noindex tags

---

## ✅ Sign-Off

**Deployment Date:** ___________
**Verified By:** ___________

**Production URL:** https://alertdoc.in

**Key Metrics to Track:**
- Google Search Console impressions
- Click-through rate from search
- Featured snippet appearances
- Social media share previews
- AI crawler visits

---

## 📚 Quick Reference

**Tools Used:**
- Google Search Console: https://search.google.com/search-console
- Google Rich Results Test: https://search.google.com/test/rich-results
- Schema.org Validator: https://validator.schema.org/
- Facebook Debugger: https://developers.facebook.com/tools/debug/
- Twitter Card Validator: https://cards-dev.twitter.com/validator
- LinkedIn Post Inspector: https://www.linkedin.com/post-inspector/

**Production Files:**
- Sitemap: https://alertdoc.in/sitemap.xml
- Robots.txt: https://alertdoc.in/robots.txt
- OG Image: https://alertdoc.in/og-image.png

**Contact for Issues:**
- Next.js deployment issues: Check Vercel/hosting provider docs
- SEO questions: Review this checklist
- Structured data errors: Use Google Rich Results Test
