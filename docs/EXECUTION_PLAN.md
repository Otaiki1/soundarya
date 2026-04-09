# UZOZA — Execution Plan
## 📋 Complete Build Roadmap

> **Last Updated:** March 9, 2026  
> **Reference:** soundarya_technical.md (v2.0)  
> **Framework:** Next.js 14 · Node.js 20

---

## Executive Summary

This document provides a **phase-by-phase execution roadmap** for building Uzoza. Each phase is broken into specific, actionable tasks with clear acceptance criteria. Follow this in sequence. **The technical document is the source of truth** — refer to it for any implementation details.

---

## Phase 1: Project Setup & Infrastructure ⚙️

**Duration:** 1-2 days | **Goal:** Spin up project skeleton with all integrations configured

### 1.1 Initialize Next.js Project
```bash
# Create new Next.js 14 project with App Router
npx create-next-app@latest soundarya --typescript --tailwind --app
cd soundarya
```

**Acceptance Criteria:**
- [ ] Next.js 14 with App Router running locally
- [ ] TypeScript configured
- [ ] Tailwind CSS available
- [ ] `npm run dev` works on localhost:3000

### 1.2 Install Core Dependencies

```bash
npm install \
  @supabase/supabase-js \
  @supabase/ssr \
  stripe \
  @aws-sdk/client-s3 \
  sharp \
  react-dropzone \
  resend \
  posthog-js \
  isomorphic-dompurify \
  satori \
  html2canvas
```

**Acceptance Criteria:**
- [ ] All packages install without conflicts
- [ ] `package.json` lock file generated

### 1.3 Repository Structure

Create the exact folder structure from Technical Doc Section 2:

```bash
mkdir -p app/{marketing,app,api}
mkdir -p app/app/{analyse,report,profile,challenge}
mkdir -p app/api/{analyse,payment,webhooks,challenge,leaderboard,countries}
mkdir -p components/{upload,results,leaderboard,scorecard,ui}
mkdir -p lib/supabase
mkdir -p types
mkdir -p hooks
```

**Acceptance Criteria:**
- [ ] Folder structure matches Section 2 of technical doc
- [ ] All directories created, no files yet

### 1.4 Environment Variables

Create `.env.local` with ALL variables from Technical Doc Section 3.1:

```bash
# Copy .env.example template
cp .env.example .env.local

# Add all required env vars (get from respective services):
# - Supabase: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
# - Grok: GROK_API_KEY, GROK_MODEL
# - R2: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME
# - Stripe: NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
# - Resend: RESEND_API_KEY, RESEND_FROM_EMAIL
# - PostHog: NEXT_PUBLIC_POSTHOG_KEY, NEXT_PUBLIC_POSTHOG_HOST
# - App: NEXT_PUBLIC_APP_URL, CRON_SECRET
```

**Acceptance Criteria:**
- [ ] `.env.local` created with ALL 20+ variables
- [ ] Placeholders use meaningful names (e.g., `xxxx` → update before deploy)
- [ ] `.env.local` added to `.gitignore`

### 1.5 Configure next.config.js

Implement configuration from Technical Doc Section 3.2:
- Server actions body size limit: 10MB
- Remote image patterns for R2
- Security headers (X-Content-Type-Options, X-Frame-Options)

**Acceptance Criteria:**
- [ ] `next.config.js` matches Section 3.2
- [ ] Build succeeds: `npm run build`

### 1.6 Create Type Definitions

Create `/types` folder with:
- `analysis.ts` — Analysis result types
- `user.ts` — Profile & auth types
- `grok.ts` — Grok API response types

**Acceptance Criteria:**
- [ ] All types from Section 7.2 defined in `types/grok.ts`
- [ ] No TypeScript errors in IDE

---

## Phase 2: Database & Authentication 🗄️

**Duration:** 2-3 days | **Goal:** Supabase schema, RLS, auth configured

### 2.1 Supabase Project Setup

1. Create Supabase project at supabase.com
2. Copy `NEXT_PUBLIC_SUPABASE_URL` & `NEXT_PUBLIC_SUPABASE_ANON_KEY` to `.env.local`
3. Get `SUPABASE_SERVICE_ROLE_KEY` and add to `.env.local`

**Acceptance Criteria:**
- [ ] Supabase project created
- [ ] All 3 keys in `.env.local`
- [ ] Test connection: `npx supabase init`

### 2.2 Implement Database Schema

Execute the FULL SQL from Technical Doc Section 4.1 in Supabase SQL Editor:

Key tables to create:
- `profiles` — User profiles (extends auth.users)
- `analyses` — Facial analysis results
- `leaderboard_daily` — Materialized view
- `country_stats` — Materialized view
- `stripe_events` — Webhook idempotency
- `email_subscriptions` — Email list

**Acceptance Criteria:**
- [ ] All 6 tables/views created in Supabase
- [ ] Indexes created (performance)
- [ ] Triggers for `update_updated_at()` working
- [ ] Triggers for `update_profile_best_score()` working
- [ ] `pg_cron` jobs scheduled (leaderboard refresh every 5 min)

### 2.3 Row-Level Security (RLS)

Implement RLS policies from Technical Doc Section 4.1:

Policies needed:
- `profiles_select_own` — Users can only read their own profile
- `profiles_update_own` — Users can only update their own profile
- `analyses_select_own` — Users can only read their own analyses

**Acceptance Criteria:**
- [ ] RLS enabled on all public tables
- [ ] Policies created (3 minimum)
- [ ] Test: logged-in user cannot read other users' profiles

### 2.4 Supabase Auth Configuration

In Supabase Dashboard → Authentication:
- Enable Email provider (default)
- Optional: Enable Google OAuth (social login)
- Set redirect URLs: `http://localhost:3000/auth/callback` (dev)
- In production: `https://soundarya.ai/auth/callback`

**Acceptance Criteria:**
- [ ] Email auth enabled
- [ ] Redirect URLs set for dev & prod
- [ ] Test signup flow works

### 2.5 Create Supabase Client Files

Implement from Technical Doc Section 5.1:

Files to create:
- `lib/supabase/client.ts` — Browser client
- `lib/supabase/server.ts` — Server-side client (SSR)
- `lib/supabase/admin.ts` — Admin/service role (API routes only)

**Acceptance Criteria:**
- [ ] All 3 client files created
- [ ] `admin.ts` uses SUPABASE_SERVICE_ROLE_KEY (never exposed to client)
- [ ] No TypeScript errors

### 2.6 Test Database Connection

Create a simple test endpoint:

```typescript
// app/api/test-db/route.ts
export async function GET() {
  const { data } = await supabaseAdmin.from('profiles').select().limit(1)
  return Response.json({ ok: true, data })
}
```

**Acceptance Criteria:**
- [ ] GET `/api/test-db` returns 200 and database data
- [ ] Verifies Supabase connection working

---

## Phase 3: Core API Routes 🔌

**Duration:** 3-4 days | **Goal:** All API endpoints from Section 9 implemented

### 3.1 Image Upload & Validation

Implement from Technical Doc Sections 6:

Files to create:
- `lib/image-validation.ts` — Image processing with sharp
- `lib/r2.ts` — Cloudflare R2 client

**Details:**
- Image size limits: 10MB max, 200px min, 4096px max
- Resize to 1024px max before Grok call
- Compress to JPEG 85%

**Acceptance Criteria:**
- [ ] `validateAndProcessImage()` handles all formats (JPEG, PNG, WEBP)
- [ ] `uploadToR2()` successfully uploads processed images
- [ ] Invalid files rejected with clear errors
- [ ] Test with sample images locally

### 3.2 Rate Limiting

Implement from Technical Doc Section 16.1:

File to create:
- `lib/rate-limit.ts` — Rate limit check function

**Details:**
- Limit: 3 free analyses per IP per 24 hours
- Check by IP hash (SHA-256 salted)
- Return remaining count

**Acceptance Criteria:**
- [ ] `checkRateLimit(ipHash)` called in `/api/analyse`
- [ ] 4th request within 24h returns 429
- [ ] Returns `{ allowed, remaining, retryAfter }`

### 3.3 Grok API Integration

Implement from Technical Doc Section 7:

Files to create:
- `lib/grok.ts` — Grok API client
- `lib/prompts.ts` — Prompt templates

**Details:**
- Call Grok Vision API with image base64
- Parse JSON response (use `response_format: { type: 'json_object' }`)
- Validate required fields
- Clamp scores to valid ranges (1-10 overall, 1-100 dimensions)

**Acceptance Criteria:**
- [ ] `analyseWithGrok(imageBase64, mimeType, tier)` returns typed result
- [ ] Free tier: no `premiumTips`
- [ ] Premium tier: includes full 20 tips
- [ ] Error handling for invalid JSON or missing fields
- [ ] Test with real image using valid Grok API key

### 3.4 `POST /api/analyse` — Main Endpoint

Implement from Technical Doc Section 9.1:

**Flow:**
1. Rate limit check by IP
2. Validate image file
3. Upload to R2
4. Convert to base64
5. Call Grok (free tier)
6. Get country from IP
7. Store in Supabase
8. Return free fields only

**Acceptance Criteria:**
- [ ] Accepts FormData with `photo` and `sessionId`
- [ ] Returns analysis ID + all free fields
- [ ] `premium_tips` NOT included in response
- [ ] Rate limit enforced (429 on 4th request)
- [ ] Test end-to-end with real image upload

### 3.5 `GET /api/analyse/[id]` — Fetch Analysis

Retrieve stored analysis by ID (check ownership/session):

**Details:**
- If user is authenticated: compare user_id
- If anonymous: check session_id
- Never return `premium_tips` unless user paid

**Acceptance Criteria:**
- [ ] Returns analysis by ID
- [ ] Validates ownership (returns 401 if not owner/from wrong session)
- [ ] No premium content returned unless earned

### 3.6 Cleanup Cron Job

Implement from Technical Doc Section 6.3:

File to create:
- `app/api/cron/cleanup-photos/route.ts`

**Details:**
- Runs every 1 hour (Vercel cron)
- Deletes R2 photos older than 1 hour
- Updates database: set `r2_key = null`, `photo_deleted_at = now()`

**Acceptance Criteria:**
- [ ] Requires valid `CRON_SECRET` in Authorization header
- [ ] Deletes only photos > 1 hour old
- [ ] Returns `{ deleted: N }`
- [ ] `vercel.json` configured with cron schedule

### 3.7 Leaderboard API

Implement from Technical Doc Section 12.1:

File to create:
- `app/api/leaderboard/route.ts`

**Query params:**
- `type`: 'global' | 'country'
- `country`: country code (if type='country')
- `limit`: max 50 (default 10)

**Response:**
- Array of top analyses, ranked
- Cache headers: 5 min with stale-while-revalidate

**Acceptance Criteria:**
- [ ] Returns top X analyses globally or by country
- [ ] Proper cache headers set
- [ ] Pagination works (limit param respected)

### 3.8 Health Check Endpoint

Implement from Technical Doc Section 20.3:

File to create:
- `app/api/health/route.ts`

**Details:**
- Check database connection
- Check Grok API availability
- Return 200 if all OK, 503 if any fail

**Acceptance Criteria:**
- [ ] GET `/api/health` returns 200 when all systems OK
- [ ] Returns JSON with status of each service
- [ ] Used by Vercel monitoring

---

## Phase 4: Frontend UI Components 🎨

**Duration:** 4-5 days | **Goal:** All pages and interactive components

### 4.1 Upload Component

Create from Technical Doc Section 17.1:

File to create:
- `components/upload/DropZone.tsx`
- `components/upload/LoadingStages.tsx`
- `components/upload/ResultModal.tsx`

**Details:**
- Drag-and-drop file upload
- Show loading stages (detecting → symmetry → ratio → structure → writing)
- Display analysis result in modal
- Track events to PostHog

**Acceptance Criteria:**
- [ ] Drag-and-drop works
- [ ] Loading stages animated (800ms per stage)
- [ ] File validation before upload
- [ ] Result modal displays all free fields
- [ ] Error states handled gracefully

### 4.2 Results Page

Create from Technical Doc Section 17.2:

File to create:
- `app/(app)/analyse/[id]/page.tsx`
- `components/results/ScoreHero.tsx`
- `components/results/DimensionBars.tsx`
- `components/results/ShareRow.tsx`

**Details:**
- Display overall score prominently
- Show 7 dimension scores as bars
- Display summary, strengths, weakest dimension, free tip
- Share button (Twitter, Instagram, copy link)
- Challenge creator button
- Premium paywall (for locked content)

**Acceptance Criteria:**
- [ ] Page loads analysis by ID
- [ ] Responsive on mobile (iPhone SE and up)
- [ ] All free fields visible
- [ ] Premium content NOT visible unless paid
- [ ] Meta tags (OG image) correct

### 4.3 Landing Page

Create from Technical Doc (implied from repo structure):

File to create:
- `app/(marketing)/page.tsx`

**Details:**
- Hero section: brand, tagline, CTA
- Feature cards highlighting what app does
- Ticker showing recent scores
- Call-to-action to upload photo
- Link to leaderboard

**Acceptance Criteria:**
- [ ] Compelling hero section
- [ ] CTA buttons visible and clickable
- [ ] Responsive mobile/desktop
- [ ] Static rendering for performance

### 4.4 Leaderboard Page

Create:
- `app/(marketing)/leaderboard/page.tsx`
- `components/leaderboard/LeaderboardCard.tsx`

**Details:**
- Global leaderboard (top 50)
- Country leaderboard switcher
- Real-time updates (Supabase subscription)
- Username, score, percentile, country

**Acceptance Criteria:**
- [ ] Loads top analyses globally
- [ ] Country filter works
- [ ] Real-time updates (new high scores appear)
- [ ] Ranked display with numbers

### 4.5 Authentication UI

Create:
- `components/auth/SignUp.tsx`
- `components/auth/Login.tsx`
- `components/auth/LogOut.tsx`

Optional but recommended:
- Session management in header
- Profile menu

**Acceptance Criteria:**
- [ ] SignUp form works
- [ ] Login form works
- [ ] Session persists across page reloads
- [ ] LogOut clears session

---

## Phase 5: Payment & Webhooks 💳

**Duration:** 2-3 days | **Goal:** Stripe integration complete

### 5.1 Stripe Setup

In Stripe Dashboard:
1. Create 3 products from Technical Doc Section 10.1:
   - Premium Report: $19 one-time
   - Elite Package: $49 one-time
   - Monthly Subscription: $9.99/month

2. Get Price IDs and add to `.env.local`:
   - `STRIPE_PREMIUM_PRICE_ID=price_...`
   - `STRIPE_ELITE_PRICE_ID=price_...`
   - `STRIPE_SUB_PRICE_ID=price_...`

3. Create Webhook Endpoint:
   - Endpoint URL: `https://soundarya.ai/api/webhooks/stripe`
   - Listen to: `checkout.session.completed`, `customer.subscription.*`
   - Copy Signing Secret to `STRIPE_WEBHOOK_SECRET`

**Acceptance Criteria:**
- [ ] 3 products created in Stripe
- [ ] All Price IDs in `.env.local`
- [ ] Webhook endpoint created
- [ ] All 3 env vars set

### 5.2 Stripe Client

Create:
- `lib/stripe.ts`

**Details:**
- Initialize Stripe client with secret key (server-only)

**Acceptance Criteria:**
- [ ] Stripe client exports initialized instance

### 5.3 `POST /api/payment/create-session`

Implement from Technical Doc Section 9.2:

**Details:**
- Accept JSON: `{ analysisId, tier, email }`
- Verify analysis exists and not already unlocked
- Create Stripe Checkout Session
- Return session URL (client redirects)

**Acceptance Criteria:**
- [ ] Creates valid Stripe session
- [ ] Stores metadata (analysis_id, tier)
- [ ] Returns checkout URL
- [ ] Test flow: click "Unlock" → redirected to Stripe Checkout

### 5.4 `POST /api/webhooks/stripe`

Implement from Technical Doc Section 9.3:

**Details:**
- Verify Stripe signature
- Idempotency check (don't process same event twice)
- On `checkout.session.completed`:
  - Get analysis from DB
  - Retrieve image from R2 (if still exists within 1hr window)
  - Call Grok API with premium prompt → get `premiumTips`
  - Update analysis: `premium_unlocked=true`, `premium_tips=[]`
  - Send confirmation email

**Acceptance Criteria:**
- [ ] Webhook signature verified (security)
- [ ] Idempotency: same event never processed twice
- [ ] Premium tips generated and stored after payment
- [ ] Analysis marked as unlocked
- [ ] Email sent on success
- [ ] Test: simulate payment → check DB update

### 5.5 Paywall Component

Create:
- `components/results/LockedPaywall.tsx`

**Details:**
- Show 3-4 locked premium features
- Display price ($19, $49, $9.99/month)
- Buttons to each tier
- Handle click → POST to `/api/payment/create-session` → redirect to Stripe

**Acceptance Criteria:**
- [ ] Displays paywall on free analyses
- [ ] All 3 tier options visible
- [ ] Click redirects to Stripe Checkout
- [ ] Works on mobile/desktop

### 5.6 Premium Report Page

Create:
- `app/(app)/report/[id]/page.tsx`
- Middleware protection: verify auth + payment

**Details:**
- Only accessible after logged in + premium_unlocked
- Display all 20 premium tips
- Full report customized to user
- Downloadable PDF option (optional)

**Acceptance Criteria:**
- [ ] Page requires login (redirects otherwise)
- [ ] Page requires payment (redirects if not paid)
- [ ] Shows all 20 tips
- [ ] Responsive design

---

## Phase 6: Analytics & Monitoring 📊

**Duration:** 2 days | **Goal:** PostHog and Sentry set up

### 6.1 PostHog Integration

Setup at posthog.com:
- Create organization
- Create Next.js project
- Copy `NEXT_PUBLIC_POSTHOG_KEY` to `.env.local`

Create:
- `lib/posthog.ts` (from Technical Doc Section 15.1)

**Acceptance Criteria:**
- [ ] PostHog key in `.env.local`
- [ ] `initPostHog()` called in app layout
- [ ] Events tracked: page_view, analysis_completed, payment_initiated, etc.

### 6.2 Track Critical Events

Implement event tracking from Technical Doc Section 15.2:

Events to track:
- `page_view` — landing, leaderboard, results
- `photo_upload_started`, `photo_upload_completed`
- `analysis_completed` — with score, category, percentile
- `paywall_viewed`, `payment_initiated`, `payment_completed`
- `share_clicked`, `challenge_created`, `challenge_accepted`

**Acceptance Criteria:**
- [ ] All 10+ critical events tracked
- [ ] Events visible in PostHog dashboard
- [ ] Can create funnels (Upload → Analysis → Payment)

### 6.3 Build PostHog Funnels

In PostHog Dashboard, create 3 funnels:

1. **Conversion:** Landing → Upload → Analysis → Paywall → Payment
2. **Viral:** Analysis → Share → Challenge Created → Challenge Accepted
3. **Retention:** Analysis → Email Captured → Day 3 Return → Day 7 Return

**Acceptance Criteria:**
- [ ] All 3 funnels created in PostHog
- [ ] Can see conversion rate %
- [ ] Track daily

### 6.4 Sentry Integration (Error Monitoring)

Setup at sentry.io:
- Create organization → project
- Choose "Next.js" template
- Copy DSN to `NEXT_PUBLIC_SENTRY_DSN`

Create:
- `lib/sentry.ts` (similar to Technical Doc Section 20.1)

**Acceptance Criteria:**
- [ ] Errors sent to Sentry dashboard
- [ ] Can see error stack traces
- [ ] Source maps working

### 6.5 Setup Alerts

Configure in Sentry/PostHog:

Alerts to set up:
- High error rate (>5% in 5min)
- Stripe webhook failures
- Database connection errors
- High rate-limit bypass attempts

**Acceptance Criteria:**
- [ ] Alerts configured
- [ ] Slack/email notifications working

---

## Phase 7: Testing & Optimization 🧪

**Duration:** 3 days | **Goal:** Performance, security, UX polished

### 7.1 Functional Testing

Manual test all critical paths:

Checklist:
- [ ] Free analysis: upload → score → view results
- [ ] Premium unlock: click unlock → Stripe → payment → premium tips appear
- [ ] Rate limiting: 3 analyses work, 4th fails with 429
- [ ] Leaderboard updates in real-time
- [ ] Challenge links work and prefill score
- [ ] Email sends on premium unlock
- [ ] Photos deleted after 1 hour

### 7.2 Security Audit

From Technical Doc Section 16, verify:

- [ ] Premium content never sent to client without payment check
- [ ] RLS policies prevent reading others' analyses
- [ ] Rate limiting prevents brute force
- [ ] Stripe signature verified on webhooks
- [ ] CRON_SECRET protects cleanup endpoint
- [ ] Input sanitization on all Grok text
- [ ] Security headers set (CSP, X-Frame-Options, etc.)

### 7.3 Performance Optimization

From Technical Doc Section 18:

- [ ] Images resized before Grok (1024px max)
- [ ] Caching headers set on API routes
- [ ] Materialized views refresh on schedule (5 min leaderboard, 1hr country)
- [ ] Database indexes created
- [ ] Lighthouse score > 90 on mobile

Run:
```bash
npm run build
# Check output for warnings
```

### 7.4 Mobile Testing

Test on real devices:
- [ ] iPhone SE (oldest)
- [ ] iPhone 15 (latest)
- [ ] Samsung S24

Check:
- [ ] Upload flow works (camera, gallery)
- [ ] Results page responsive
- [ ] Buttons clickable (not too small)
- [ ] No layout shift

### 7.5 A/B Testing Setup

Prepare variants for launch week:

Option 1: Paywall headline
- Variant A: "Unlock your personalized 20-point glow-up guide"
- Variant B: "See what experts see: your detailed beauty analysis"

Set up in PostHog:
- [ ] Create experiment
- [ ] 50/50 split
- [ ] Track conversion rate

---

## Phase 8: Launch Preparation 🚀

**Duration:** 2 days | **Goal:** Ready for production deployment

### 8.1 Pre-Launch Checklist

From Technical Doc Section 22:

Environment & Configuration:
- [ ] ALL environment variables set in Vercel production
- [ ] `.env.local` NOT committed to git
- [ ] Stripe in live mode (not test mode)
- [ ] Supabase RLS policies enforced
- [ ] Grok API key valid + has credits
- [ ] R2 CORS configured for production domain
- [ ] Resend account verified + API key working

Testing:
- [ ] Rate limiting works (3/day enforced)
- [ ] Premium content gated behind payment
- [ ] Grok error handling tested
- [ ] Stripe webhook endpoint verified
- [ ] Photos automatically deleted after 1hr
- [ ] Health check endpoint returns 200

Compliance:
- [ ] GDPR/Privacy policy published
- [ ] Email unsubscribe links working
- [ ] Terms of service published
- [ ] Photo deletion policy documented

### 8.2 Deploy to Vercel

1. Connect GitHub repo to Vercel
2. Set all production environment variables
3. Configure cron jobs in `vercel.json`
4. Deploy: `git push main`

**Verification:**
- [ ] Production URL healthy: GET `/api/health` → 200
- [ ] Landing page loads fast (Lighthouse > 90)
- [ ] Upload works on production
- [ ] Stripe Checkout redirects to live Stripe

### 8.3 Domain & DNS

1. Buy domain (e.g., soundarya.ai)
2. Point to Vercel nameservers
3. Add to Vercel project settings
4. SSL certificate auto-generated

**Verification:**
- [ ] Domain loads HTTPS (no warnings)
- [ ] Redirects to production app

### 8.4 Soft Launch

Share production URL with 20-50 beta testers:
- [ ] Post in private Discord/Slack
- [ ] Get early feedback
- [ ] Monitor PostHog funnel
- [ ] Monitor error rate in Sentry
- [ ] Read every support email personally

### 8.5 Final Launch Checklist

Day-of launch:

- [ ] PostHog funnels populated with data
- [ ] Leaderboard has recent analyses
- [ ] Country stats populated
- [ ] Check Grok error rate < 2%
- [ ] Monitor Stripe → no failed webhooks
- [ ] Announce on Twitter/social
- [ ] Watch dashboards (PostHog, Sentry, Vercel) for 2 hours

### 8.6 Post-Launch (Week 1)

Daily checks:
- [ ] Error rate stable < 2%
- [ ] Conversion funnel performing
- [ ] No Stripe failures
- [ ] R2 photos being deleted (check S3 usage)
- [ ] Read all support emails
- [ ] A/B test paywall headlines starting Day 3

---

## Dependency Timeline

```
Phase 1 Setup
    ↓
Phase 2 Database ← (needed for all API routes)
    ↓
Phase 3 API Routes ← (core functionality)
    ├→ Phase 4 Frontend (can work in parallel with 3)
    │
Phase 5 Payment ← (depends on Phase 3)
    │
Phase 6 Analytics (parallel with 5)
    │
Phase 7 Testing (after 3, 4, 5)
    │
Phase 8 Launch (after 7)
```

---

## Success Metrics

By launch, you should have:

| Metric | Target |
|--------|--------|
| Lighthouse Score (Mobile) | > 90 |
| Grok API Success Rate | > 98% |
| Free Analysis Upload-to-Result Time | < 30 sec |
| Page Load Time (Analyse Results) | < 2 sec |
| Conversion Rate (Free→Premium) | > 5% |
| Day 1 Retention | > 20% |

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Grok API quota exhausted | Monitor usage daily; set alerts; have fallback prompt |
| Rate limiting ineffective | Implement IP + session dual-rate-limit |
| Premium content leaks | Extensive RLS testing; never log sensitive data |
| Stripe webhook fails | Idempotency check; manual retry queue |
| R2 storage grows unbounded | Verify cron job deletes photos within 1hr |
| Database locked/slow | Monitor query performance; use partial indexes |

---

## Questions to Answer Before Starting Each Phase

**Phase 1:** Do you have Node.js 20+ installed?  
**Phase 2:** Do you have Supabase account ready?  
**Phase 3:** Do you have Grok API key with credits?  
**Phase 4:** Do you have design system/Figma mockups? (Or use Tailwind defaults)  
**Phase 5:** Do you have Stripe account verified?  
**Phase 6:** Do you have PostHog + Sentry accounts?  
**Phase 7:** Do you have iOS/Android devices for testing?  
**Phase 8:** Do you have domain name reserved?

---

## Next Steps

1. **Print or bookmark this document** — refer to it daily
2. **Start Phase 1** → Initialize Next.js project
3. **Complete each phase in sequence** — don't skip ahead
4. **Reference Technical Doc** for implementation details
5. **Track progress** — mark tasks complete as you go
6. **Update this document** with any deviations

---

*Uzoza Execution Plan · v1.0 · Follow this to build successfully.*
