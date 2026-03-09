# SOUNDARYA — Daily Execution Tracker
## Quick Reference & Progress Log

Use this as your **daily checkpoint** for building Soundarya. Keep updated as you progress.

---

## Phase 1: Project Setup & Infrastructure ⚙️
**Target Completion:** Day 1-2

- [ ] **1.1** Next.js 14 project initialized with App Router
  - Verification: `npm run dev` works, landing page loads
  
- [ ] **1.2** All dependencies installed
  - Verification: `npm list | grep` shows all packages in package.json
  
- [ ] **1.3** Repository folder structure created
  - Verification: All 12 top-level directories exist
  
- [ ] **1.4** `.env.local` created with all 22 variables
  - Checklist:
    - [ ] Supabase (3 vars)
    - [ ] Grok (4 vars)
    - [ ] R2 (4 vars)
    - [ ] Stripe (3 vars)
    - [ ] Resend (2 vars)
    - [ ] PostHog (2 vars)
    - [ ] App (3 vars)
  
- [ ] **1.5** `next.config.js` configured per spec
  - Verification: `npm run build` completes without errors
  
- [ ] **1.6** Type definitions created
  - Files: `/types/analysis.ts`, `/types/user.ts`, `/types/grok.ts`

**Daily Checklist - Phase 1 Complete?** ✓ / ✗

---

## Phase 2: Database & Authentication 🗄️
**Target Completion:** Day 3-5

- [ ] **2.1** Supabase project created
  - Account created: ________ (project name)
  - 3 keys copied to `.env.local`: ✓
  
- [ ] **2.2** Database schema created
  - [ ] `profiles` table ✓
  - [ ] `analyses` table ✓
  - [ ] `leaderboard_daily` view ✓
  - [ ] `country_stats` view ✓
  - [ ] `stripe_events` table ✓
  - [ ] `email_subscriptions` table ✓
  - [ ] All indexes created ✓
  - [ ] Triggers created ✓
  - Verification: SELECT count(*) FROM analyses; returns 0 (empty)
  
- [ ] **2.3** RLS policies enabled
  - [ ] `profiles_select_own` policy ✓
  - [ ] `profiles_update_own` policy ✓
  - [ ] `analyses_select_own` policy ✓
  - Verification: Can't read other users' profiles when RLS enforced
  
- [ ] **2.4** Supabase Auth configured
  - [ ] Email provider enabled
  - [ ] Redirect URLs set (dev: localhost:3000, prod: soundarya.ai)
  
- [ ] **2.5** Supabase client files created
  - [ ] `lib/supabase/client.ts` ✓
  - [ ] `lib/supabase/server.ts` ✓
  - [ ] `lib/supabase/admin.ts` ✓ (NEVER expose to client)
  
- [ ] **2.6** Database connection tested
  - [ ] `/api/test-db` endpoint created
  - Verification: GET `/api/test-db` returns 200 and data

**Daily Checklist - Phase 2 Complete?** ✓ / ✗

---

## Phase 3: Core API Routes 🔌
**Target Completion:** Day 6-9

- [ ] **3.1** Image validation library
  - [ ] `lib/image-validation.ts` validates file type, size, dimensions
  - [ ] Sharp resize to 1024px max
  - Verification: `validateAndProcessImage()` works with test image
  
- [ ] **3.2** Cloudflare R2 integration
  - [ ] `lib/r2.ts` created with S3Client
  - [ ] R2 account credentials in `.env.local`
  - Verification: Can upload and retrieve test file from R2
  
- [ ] **3.3** Rate limiting
  - [ ] `lib/rate-limit.ts` checks 3 per IP per 24h
  - Verification: After 3 analyses, 4th returns 429 error
  
- [ ] **3.4** Grok API client
  - [ ] `lib/grok.ts` implements analyseWithGrok()
  - [ ] `lib/prompts.ts` has FREE_PROMPT and PREMIUM_PROMPT
  - Verification: Function returns typed GrokAnalysisResult with all fields
  
- [ ] **3.5** Main analysis endpoint: `POST /api/analyse`
  - Flow completed: Upload → R2 → Base64 → Grok → DB → Response
  - Verification: Upload photo, get analysisId + free fields back
  - **Critical:** Premium fields NOT in response
  
- [ ] **3.6** Fetch analysis: `GET /api/analyse/[id]`
  - [ ] Validates ownership/session
  - Verification: Own analyses return 200, others' return 401
  
- [ ] **3.7** Cleanup cron job: `POST /api/cron/cleanup-photos`
  - [ ] Photos deleted after 1 hour
  - [ ] Requires CRON_SECRET header
  - [ ] `vercel.json` configured to run hourly
  - Verification: Check R2 usage doesn't grow indefinitely
  
- [ ] **3.8** Leaderboard API: `GET /api/leaderboard`
  - [ ] Supports `type` (global|country) and `limit` params
  - Verification: Returns top 10 analyses with cache headers
  
- [ ] **3.9** Health check: `GET /api/health`
  - [ ] Checks DB + Grok API
  - Verification: Returns 200 with service statuses

**Daily Checklist - Phase 3 Complete?** ✓ / ✗

---

## Phase 4: Frontend UI Components 🎨
**Target Completion:** Day 10-14

- [ ] **4.1** Upload component
  - [ ] `components/upload/DropZone.tsx` drag-and-drop
  - [ ] `components/upload/LoadingStages.tsx` animates stages
  - [ ] Result modal displays correctly
  - Verification: Upload photo locally, see stages animate (800ms each)
  
- [ ] **4.2** Results page: `/app/(app)/analyse/[id]/page.tsx`
  - [ ] Hero score display
  - [ ] Dimension bars chart (7 dimensions)
  - [ ] Summary + strengths + tips
  - [ ] Share buttons (Twitter, Instagram, copy)
  - [ ] Challenge button
  - Verification: Load analysis, all free fields visible, mobile responsive
  
- [ ] **4.3** Results sub-components
  - [ ] `ScoreHero.tsx` ✓
  - [ ] `DimensionBars.tsx` ✓
  - [ ] `ShareRow.tsx` ✓
  - [ ] Premium paywall component ✓
  
- [ ] **4.4** Landing page
  - [ ] Hero section with CTA
  - [ ] Feature cards
  - [ ] Ticker (real-time scores)
  - Verification: Mobile/desktop responsive, CTA visible
  
- [ ] **4.5** Leaderboard page
  - [ ] Global leaderboard table
  - [ ] Country filter dropdown
  - [ ] Real-time updates (Supabase subscription)
  - Verification: Shows top 50, can filter by country
  
- [ ] **4.6** Authentication UI (Optional but helpful)
  - [ ] SignUp form
  - [ ] Login form
  - [ ] Session persistence
  - Verification: Sign up → redirected to profile

**Daily Checklist - Phase 4 Complete?** ✓ / ✗

---

## Phase 5: Payment & Webhooks 💳
**Target Completion:** Day 15-17

- [ ] **5.1** Stripe setup
  - [ ] Account created and verified
  - 3 products created in Stripe:
    - [ ] Premium Report ($19 one-time) → Price ID: ____________
    - [ ] Elite Package ($49 one-time) → Price ID: ____________
    - [ ] Monthly ($9.99/month) → Price ID: ____________
  - [ ] All 3 Price IDs in `.env.local`
  - [ ] Webhook endpoint created in Stripe
  - [ ] Webhook signing secret in `.env.local`
  
- [ ] **5.2** Stripe client
  - [ ] `lib/stripe.ts` exports initialized instance
  - Verification: No errors on import
  
- [ ] **5.3** Create checkout session: `POST /api/payment/create-session`
  - [ ] Accepts `{ analysisId, tier, email }`
  - [ ] Verifies analysis exists and not already unlocked
  - [ ] Returns Stripe checkout URL
  - Verification: POST to endpoint, get sessionUrl, can redirect to Stripe
  
- [ ] **5.4** Stripe webhook handler: `POST /api/webhooks/stripe`
  - [ ] Verifies webhook signature
  - [ ] Idempotency check (same event not processed twice)
  - [ ] On payment completion:
    - [ ] Retrieves image from R2 (if still available)
    - [ ] Calls Grok with PREMIUM_PROMPT
    - [ ] Stores `premium_tips` in DB
    - [ ] Marks `premium_unlocked = true`
    - [ ] Sends confirmation email
  - Verification: Simulate payment in Stripe Dashboard, check DB updated
  
- [ ] **5.5** Paywall component
  - [ ] Shows locked features
  - [ ] 3 tier buttons (premium, elite, subscription)
  - [ ] Click → POST to create-session → redirected to Stripe
  - Verification: On free analysis, paywall visible, can click to pay
  
- [ ] **5.6** Premium report page: `/app/(app)/report/[id]`
  - [ ] Requires login (redirects if not)
  - [ ] Requires payment (redirects if not paid)
  - [ ] Shows all 20 premium tips
  - [ ] Middleware protection implemented
  - Verification: Can access only after login + payment

**Daily Checklist - Phase 5 Complete?** ✓ / ✗

---

## Phase 6: Analytics & Monitoring 📊
**Target Completion:** Day 18-19

- [ ] **6.1** PostHog setup
  - [ ] Account created at posthog.com
  - [ ] Next.js project created
  - [ ] `NEXT_PUBLIC_POSTHOG_KEY` in `.env.local`
  - [ ] `lib/posthog.ts` implemented
  - [ ] `initPostHog()` called in app layout
  - Verification: Page views appear in PostHog dashboard
  
- [ ] **6.2** Track critical events
  - Events table in `/components` or `/lib/analytics`:
  - [ ] `page_view` ✓
  - [ ] `photo_upload_started` ✓
  - [ ] `photo_upload_completed` ✓
  - [ ] `analysis_completed` ✓
  - [ ] `paywall_viewed` ✓
  - [ ] `payment_initiated` ✓
  - [ ] `payment_completed` ✓
  - [ ] `share_clicked` ✓
  - [ ] `challenge_created` ✓
  - [ ] `leaderboard_viewed` ✓
  - Verification: Events visible in PostHog when performing each action
  
- [ ] **6.3** PostHog funnels created
  - [ ] Funnel 1: Landing → Upload → Analysis → Paywall → Payment
  - [ ] Funnel 2: Analysis → Share → Challenge Created → Challenge Accepted
  - [ ] Funnel 3: Analysis → Email Captured → Day 3 Return → Day 7 Return
  - Verification: Can see conversion % for each funnel
  
- [ ] **6.4** Sentry error monitoring
  - [ ] Account created at sentry.io
  - [ ] `NEXT_PUBLIC_SENTRY_DSN` in `.env.local`
  - [ ] `lib/sentry.ts` configured
  - Verification: Intentional error appears in Sentry dashboard
  
- [ ] **6.5** Alerts configured
  - [ ] High error rate alert (>5%)
  - [ ] Stripe webhook failure alert
  - [ ] Rate limit bypass alert
  - Verification: Can receive alerts via Slack/email

**Daily Checklist - Phase 6 Complete?** ✓ / ✗

---

## Phase 7: Testing & Optimization 🧪
**Target Completion:** Day 20-22

- [ ] **7.1** Functional testing
  - [ ] Free analysis complete (upload → score → view)
  - [ ] Premium unlock works (click → Stripe → payment → tips appear)
  - [ ] Rate limiting (3 work, 4th = 429)
  - [ ] Photos deleted after 1 hour
  - [ ] Leaderboard updates in real-time
  - [ ] Challenge links work
  - [ ] Emails send on premium unlock
  
- [ ] **7.2** Security audit
  - [ ] Premium content NOT in free response
  - [ ] RLS prevents reading others' analyses
  - [ ] Stripe signature verified
  - [ ] CRON_SECRET protects cleanup
  - [ ] All Grok text sanitized
  - [ ] Security headers set (CSP, X-Frame-Options)
  - Verification: Security audit checklist 100%
  
- [ ] **7.3** Performance optimization
  - [ ] Images resized before Grok (1024px)
  - [ ] Cache headers set:
    - [ ] Leaderboard: 5 min ✓
    - [ ] Country stats: 1 hour ✓
    - [ ] Score cards: 24 hours ✓
  - [ ] Database indexes all created
  - [ ] Lighthouse score > 90 on mobile
  - [ ] Materialized views refresh on schedule
  - Verification: `npm run build` completes, no warnings
  
- [ ] **7.4** Mobile testing
  - [ ] iPhone SE (oldest) ✓
  - [ ] iPhone 15 (latest) ✓
  - [ ] Samsung S24 ✓
  - Checks per device:
    - [ ] Upload works (camera + gallery)
    - [ ] Results responsive
    - [ ] No layout shift
    - [ ] Buttons clickable (not too small)
  
- [ ] **7.5** A/B testing setup in PostHog
  - [ ] Experiment created (paywall headline variants)
  - [ ] 50/50 split configured
  - [ ] Tracking conversion rate

**Daily Checklist - Phase 7 Complete?** ✓ / ✗

---

## Phase 8: Launch Preparation 🚀
**Target Completion:** Day 23-24

### Pre-Launch Checklist (12 hours before go-live)

**Environment:**
- [ ] All 22 env vars set in Vercel production (NOT .env.local)
- [ ] `.env.local` NOT committed to git (in .gitignore)
- [ ] Stripe in LIVE mode (not test mode)
- [ ] Grok API key valid with sufficient credits ($50+)
- [ ] R2 CORS configured for production domain
- [ ] Supabase in production mode

**Testing:**
- [ ] Rate limiting works: 3 analyses allowed, 4th returns 429
- [ ] Free analysis completes without premium content
- [ ] Payment flow: unlock → Stripe → pay → premium tips appear
- [ ] Webhook test: GET /api/test-webhook or POST manual event
- [ ] Cron job logs: photos deleted from R2 within 1 hour
- [ ] Health check: GET `/api/health` returns 200

**Compliance:**
- [ ] Privacy policy published at `/privacy` or external link
- [ ] Terms of service published
- [ ] Photo deletion policy clear to users
- [ ] Email unsubscribe links working (test one)

**Vercel Deployment:**
- [ ] GitHub repo connected to Vercel
- [ ] Production environment variables set in Vercel Dashboard
- [ ] `vercel.json` configured with cron jobs
- [ ] Custom domain set up (if purchased)
- [ ] SSL certificate auto-generated (HTTPS working)

### Day of Launch

- [ ] Git push to main branch
- [ ] Vercel deployment starts automatically
- [ ] Verify build success (no errors)
- [ ] Test production URL: https://soundarya.ai
  - [ ] Landing page loads fast
  - [ ] Upload works
  - [ ] Analysis completes
  - [ ] Payment flow works
  
- [ ] PostHog funnels active and receiving data
- [ ] Stripe live mode verified
- [ ] Leaderboard has recent entries
- [ ] Sentry connected and receiving errors

- [ ] **Soft Launch:**
  - Share URL with 20-50 beta testers
  - Monitor dashboards for 2 hours
  - Watch error rate < 2%
  - Response to early feedback

- [ ] **Announce:**
  - Twitter post
  - LinkedIn post
  - Relevant Reddit/communities
  - Email list (if any)

### Post-Launch Week 1

- [ ] Daily: Check PostHog funnel conversion rate (target >5%)
- [ ] Daily: Check Grok error rate < 2%
- [ ] Daily: Monitor Stripe for webhook failures
- [ ] Daily: Read all support emails personally
- [ ] Day 3: Start A/B test on paywall headlines
- [ ] Day 5: Review analytics, find drop-off points
- [ ] Day 7: Check Day 7 retention (target >20%)

**Daily Checklist - Phase 8 Complete?** ✓ / ✗

---

## Overall Progress Tracker

| Phase | Status | Date Started | Date Completed | Notes |
|-------|--------|--------------|-----------------|-------|
| 1: Setup | ⚪ | | | |
| 2: Database | ⚪ | | | |
| 3: API | ⚪ | | | |
| 4: Frontend | ⚪ | | | |
| 5: Payment | ⚪ | | | |
| 6: Analytics | ⚪ | | | |
| 7: Testing | ⚪ | | | |
| 8: Launch | ⚪ | | | |

Legend: ⚪ Not Started · 🟡 In Progress · 🟢 Complete · 🔴 Blocked

---

## Critical Paths (Dependencies)

```
START HERE: Phase 1
        ↓
Phase 2 (needed by all API routes)
        ↓
Phase 3 (core logic)
  ↙     ↓     ↘
Phase 4  Phase 5  Phase 6
  (run in   (payment)  (monitoring)
  parallel)
        ↓
Phase 7 (testing)
        ↓
Phase 8 (launch)
```

---

## Quick Reference: When You Get Stuck

| Problem | Solution | Reference |
|---------|----------|-----------|
| Can't connect to Supabase | Check NEXT_PUBLIC_SUPABASE_URL, ANON_KEY in .env.local | Tech Doc §3.1 |
| Grok API returning errors | Verify API key valid, check quota, review prompt format | Tech Doc §7 |
| Premium tips not showing | Check webhook idempotency, verify R2 still has image, manual retry | Tech Doc §9.3 |
| Rate limiting not working | Verify IP hash calculation, check DB constraint | Tech Doc §16.1 |
| Photos not deleting from R2 | Check cron job logs, verify CRON_SECRET, run cleanup endpoint | Tech Doc §6.3 |
| Stripe webhook failing | Verify signing secret, check metadata, review logs | Tech Doc §9.3 |
| PostHog events not tracking | Verify key correct, check event names match, enable debug | Tech Doc §15 |
| Mobile upload broken | Test real device (not just browser DevTools), check CORS | Tech Doc §6 |

---

## Success Criteria

**Phase 8 Complete =** All these are true:

✓ Free analysis works end-to-end on mobile + desktop  
✓ Premium payment works (Stripe checkout → tips appear)  
✓ Rate limiting enforced (3 per IP per 24h)  
✓ Photos deleted within 1 hour of upload  
✓ Leaderboard updates every 5 minutes  
✓ Lighthouse score > 90 on mobile  
✓ Error rate < 2%  
✓ No security vulnerabilities found  
✓ Privacy policy + Terms published  
✓ All 8 phases complete  

---

**Print this page. Check it every day. Update it as you progress.**

*Soundarya Daily Tracker · v1.0 · Built for execution*
