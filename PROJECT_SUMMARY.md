# Soundarya Project Summary

**Ancient wisdom meets modern science. AI-powered facial beauty analysis for harmony, symmetry, and attractiveness.**

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Core Features](#core-features)
4. [Technology Stack](#technology-stack)
5. [Project Structure](#project-structure)
6. [Data Models & Types](#data-models--types)
7. [API Routes](#api-routes)
8. [Components Architecture](#components-architecture)
9. [Core Systems](#core-systems)
10. [Authentication & Authorization](#authentication--authorization)
11. [Payment & Monetization](#payment--monetization)
12. [Web3 Integration](#web3-integration)
13. [Database Schema](#database-schema)
14. [Development & Deployment](#development--deployment)

---

## Project Overview

**Soundarya** is a sophisticated AI-powered facial aesthetics analysis platform built with Next.js. It blends classical beauty theory, evolutionary psychology, and modern attractiveness science to provide comprehensive facial analysis across 7 distinct dimensions.

### Key Objectives

- Provide accurate, science-based facial attractiveness analysis
- Create a global leaderboard for aesthetic rankings
- Enable NFT minting of analysis scores on Base blockchain
- Monetize through tiered subscriptions (free, premium, elite)
- Maintain user privacy while tracking global trends by country
- Rate limit free analyses and incentivize premium features

### Target Users

- Users interested in beauty assessment and self-improvement guidance
- Web3 enthusiasts looking to mint NFTs
- Mobile-first audience with image upload capabilities

---

## Architecture

### High-Level Flow

```
User Upload (Image)
    ↓
Image Validation & Processing (Sharp)
    ↓
Upload to Cloudflare R2
    ↓
AI Analysis (Grok Vision API)
    ↓
Store Results in Supabase
    ↓
Display Results + Leaderboard
    ↓
Optional: NFT Mint on Base (Wagmi)
    ↓
Optional: Premium Unlock (Stripe)
```

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      Frontend (Next.js App)                      │
├──────────────────────┬──────────────────────┬───────────────────┤
│   Pages/Routes       │   Components         │   Providers        │
│  - Home Upload       │   - DropZone         │   - Wagmi          │
│  - Leaderboard       │   - ScoreHero        │   - RainbowKit     │
│  - Challenge         │   - ResultModal      │   - React Query    │
│  - Auth              │   - MintScoreModal   │   - Supabase SSR   │
│  - Profile           │   - Auth Components  │                    │
└──────────────────────┴──────────────────────┴───────────────────┘
                           ↓↓↓
┌─────────────────────────────────────────────────────────────────┐
│                      API Layer (Next.js Route Handlers)          │
├─────────────────┬──────────────┬──────────────┬──────────────────┤
│ /api/analyse    │ /api/payment │  /api/onchain│ /api/leaderboard │
└─────────────────┴──────────────┴──────────────┴──────────────────┘
                           ↓↓↓
┌─────────────────────────────────────────────────────────────────┐
│        External Services & Databases                             │
├──────────────────┬──────────────┬──────────────┬────────────────┤
│  Supabase        │  Grok Vision │  Cloudflare  │  Stripe        │
│  (PostgreSQL)    │  API         │  R2          │  (Payments)    │
│                  │  (AI Analysis)              │                │
└──────────────────┴──────────────┴──────────────┴────────────────┘
                           ↓↓↓
┌─────────────────────────────────────────────────────────────────┐
│     Blockchain (Base L2) - Optional Web3 Features                │
├──────────────────────────────────────────────────────────────────┤
│  NFT Contract - Mint score attestations                          │
│  Wagmi/Viem - Transaction handling                              │
└──────────────────────────────────────────────────────────────────┘
```

### Request Lifecycle

1. **Image Upload**: User drags/selects image via DropZone component
2. **Validation**: Client validates file type and size; API validates on server
3. **Processing**: Sharp library optimizes image to 1024px max, converts to JPEG
4. **Rate Limiting**: Server checks IP-based rate limit (3/24h for free tier)
5. **Storage**: Image uploaded to Cloudflare R2 with temporary key
6. **AI Analysis**: Base64 image + prompt sent to Grok Vision API
7. **Response Parsing**: JSON response validated and transformed
8. **Database Storage**: Analysis saved to Supabase with scores, metadata
9. **Geolocation**: IP geolocation enriches analysis with country data
10. **Client Response**: Analysis result returned to frontend
11. **Display**: Results rendered in ScoreHero and DimensionBars components
12. **Optional Sharing**: User can create challenge token or mint NFT

---

## Core Features

### 1. **Facial Analysis Engine**

**Grok AI Vision Analysis** - Comprehensive aesthetic evaluation across 7 dimensions:

- **Overall Score** (1.0-10.0): Composite beauty rating
- **Symmetry Score** (1-100): Facial symmetry quality
- **Golden Ratio Score** (1-100): Adherence to mathematical golden ratio proportions
- **Bone Structure Score** (1-100): Underlying skeletal facial aesthetics
- **Harmony Score** (1-100): Proportion and balance of facial features
- **Skin Score** (1-100): Skin texture, clarity, and complexion quality
- **Dimorphism Score** (1-100): Masculine/feminine feature balance

**Output Per Analysis:**

- Percentile ranking (1-99, representing position in global distribution)
- Category classification (Exceptional, Very Attractive, Above Average, Average, Below Average)
- Executive summary (2-3 sentence assessment)
- 3-5 key strengths identified
- Weakest dimension identified
- Actionable free tip
- Premium hook (teaser for paid features)
- 20 premium tips (only for premium tier)

### 2. **Image Processing Pipeline**

- **Validation**: Checks file size (max 10MB), type (JPEG/PNG/WEBP), dimensions (200-4096px)
- **Optimization**: Resizes to max 1024px maintaining aspect ratio, converts to JPEG 85% quality
- **Metadata Stripping**: Removes EXIF data for privacy
- **Storage**: Uploads to Cloudflare R2 with temporary expiry (1 hour)
- **Cleanup**: Automated cron job deletes images after 1 hour

### 3. **Rate Limiting & Anti-Abuse**

- **Free Tier**: 3 analysIs per IP per 24 hours
- **Implementation**: IP hash-based tracking using SHA-256 cryptographic hash
- **Session Tracking**: localStorage-based session ID for device-level tracking
- **Error Handling**: Returns 429 with retry-after header on limit exceeded

### 4. **Leaderboard System**

**Global & Country-Specific Rankings**

- **Materialized View**: Updates every 5 minutes from `leaderboard_daily` view
- **Global Leaderboard**: Top 1000 scores across all users in past 24h
- **Country Leaderboard**: Top scores filtered by country code (ISO 3166-1 alpha-2)
- **Caching**: 5-minute cache with stale-while-revalidate strategy
- **Ranking Data**:
    - Overall score
    - Percentile ranking
    - Category
    - User display name (anonymous if not authenticated)
    - Country identification
    - Timestamp

### 5. **Premium Tier System**

**Three Subscription Tiers:**

- **Free**: 3 analyses/24h, basic tip, free teaser content
- **Premium**: Unlimited analyses, 20 detailed tips, premium features access
- **Elite**: All premium features + priority support, additional perks

**Differentiators:**

- Free tier responses omit `premiumTips` array
- Premium tier includes full 20-tip guidance
- Stripe integration manages subscription billing
- Payment status tracked in `analyses.premium_tier` and `analyses.stripe_payment_id`

### 6. **NFT Minting on Base L2**

**Score Attestation System:**

- Mint analysis scores as ERC-721 NFT on Base blockchain
- Cryptographically signed score data ensures authenticity
- Smart contract verification prevents forgery
- Public blockchain record creates permanent, immutable proof
- RainbowKit wallet integration for seamless UX
- Current price: 0.001 ETH (~$3.50)

**Mint Flow:**

1. User connects wallet (Coinbase Wallet, MetaMask, WalletConnect)
2. Clicks "Mint Score" → API generates signature
3. Contract encodes score dimensions as on-chain data
4. User confirms transaction (2-confirmation wait)
5. TokenID assigned, success page with transaction hash
6. NFT viewable on Base explorers

### 7. **Challenge/Sharing System**

- **Challenge Token**: Generates unique shareable link for each analysis
- **Social Sharing**: Users can challenge friends to compare scores
- **Token Storage**: Stored in `analyses.challenge_token` as unique identifier
- **Privacy**: Token-based access without requiring authentication

### 8. **Geolocation & Country Tracking**

- IP geolocation enriches analyses with country data
- Enables country-specific leaderboards
- Tracks global aesthetic trends by region
- Respects privacy with IP hashing (never stores raw IP)

---

## Technology Stack

### Frontend Framework & Runtime

| Technology     | Version    | Purpose                                             |
| -------------- | ---------- | --------------------------------------------------- |
| **Next.js**    | 16.1.6     | React framework with SSR, API routes, optimizations |
| **React**      | 19.2.3     | Component library and UI framework                  |
| **TypeScript** | 5.x        | Type safety across codebase                         |
| **Node.js**    | Latest LTS | Server runtime for API routes                       |

### UI & Styling

| Technology       | Version  | Purpose                             |
| ---------------- | -------- | ----------------------------------- |
| **Tailwind CSS** | 4.x      | Utility-first CSS framework         |
| **PostCSS**      | Latest   | CSS transformation and optimization |
| **Next.js Font** | Built-in | Geist font optimization             |

### State Management & Data Fetching

| Technology               | Version | Purpose                                       |
| ------------------------ | ------- | --------------------------------------------- |
| **Wagmi**                | 2.12.0  | Web3 wallet connection & contract interaction |
| **Viem**                 | 2.21.0  | Ethereum library (used by Wagmi)              |
| **TanStack React Query** | 5.28.0  | Async state management & caching              |
| **RainbowKit**           | 2.1.1   | Wallet connection UI components               |

### Backend & Database

| Technology       | Version | Purpose                               |
| ---------------- | ------- | ------------------------------------- |
| **Supabase**     | 2.98.0  | PostgreSQL database + auth + realtime |
| **Supabase SSR** | 0.9.0   | Server-side rendering support         |

### AI & Image Processing

| Technology          | Version | Purpose                         |
| ------------------- | ------- | ------------------------------- |
| **Grok Vision API** | Beta    | AI facial analysis engine       |
| **Sharp**           | 0.34.5  | Image optimization & processing |

### Storage & CDN

| Technology            | Version  | Purpose                     |
| --------------------- | -------- | --------------------------- |
| **Cloudflare R2**     | -        | S3-compatible cloud storage |
| **AWS SDK S3 Client** | 3.1004.0 | R2 client library           |

### Development Tools

| Technology           | Version | Purpose                     |
| -------------------- | ------- | --------------------------- |
| **ESLint**           | 9.x     | Code linting                |
| **Tailwind PostCSS** | 4.x     | PostCSS plugin for Tailwind |

### External Services

- **Stripe**: Payment processing and subscription management
- **IP Geolocation Service**: Country detection from client IPs
- **Base L2 Blockchain**: NFT minting and smart contracts
- **RPC Provider**: HTTP/HTTPS endpoint for blockchain interaction

---

## Project Structure

### Directory Tree with Descriptions

```
soundarya/
├── app/                          # Next.js App Router (13+ directory structure)
│   ├── globals.css              # Global styles, design tokens
│   ├── layout.tsx               # Root layout with providers
│   ├── page.tsx                 # Main landing/upload page (/)
│   ├── page-old.tsx             # Legacy page (unused)
│   │
│   ├── (app)/                   # Private routes route group
│   │   ├── analyse/             # Analysis detail pages
│   │   │   └── [id]/
│   │   │       └── page.tsx     # Individual analysis view
│   │   ├── challenge/           # Challenge response page
│   │   ├── profile/             # User profile page
│   │   └── report/              # Analysis report/summary
│   │
│   ├── (marketing)/             # Public routes route group
│   │   ├── challenge/
│   │   │   └── [token]/
│   │   │       └── page.tsx     # Challenge challenge page (shareable)
│   │   ├── leaderboard/
│   │   │   └── page.tsx         # Global/country leaderboards
│   │   └── upload/
│   │       └── page.tsx         # Alternate upload page
│   │
│   ├── api/                     # API Route Handlers (HTTP endpoints)
│   │   ├── analyse/
│   │   │   ├── route.ts         # POST: Image upload & AI analysis
│   │   │   └── [id]/
│   │   │       └── route.ts     # GET: Fetch specific analysis
│   │   ├── challenge/
│   │   │   └── [token]/
│   │   │       └── route.ts     # GET: Fetch challenge details
│   │   │   └── create/
│   │   │       └── route.ts     # POST: Create new challenge
│   │   ├── cleanup/
│   │   │   └── route.ts         # DELETE: Cleanup old images (cron)
│   │   ├── countries/           # Get list of countries for UI
│   │   ├── cron/
│   │   │   └── cleanup-photos/
│   │   │       └── route.ts     # Scheduled image deletion
│   │   ├── health/
│   │   │   └── route.ts         # Health check endpoint
│   │   ├── leaderboard/
│   │   │   └── route.ts         # GET: Leaderboard data
│   │   ├── onchain/
│   │   │   ├── mint-signature/
│   │   │   │   └── route.ts     # POST: Get signature for NFT mint
│   │   │   └── record-mint/
│   │   │       └── route.ts     # POST: Record successful mint
│   │   ├── payment/
│   │   │   ├── create-session/
│   │   │   │   └── route.ts     # Stripe checkout session
│   │   │   └── portal/
│   │   │       └── route.ts     # Stripe customer portal
│   │   ├── test-db/
│   │   │   └── route.ts         # Database connectivity test
│   │   └── webhooks/            # Webhook handlers (Stripe, etc)
│   │
│   ├── auth/
│   │   └── callback/
│   │       └── page.tsx         # OAuth callback handler
│   ├── login/
│   │   └── page.tsx             # Login page
│   └── signup/
│       └── page.tsx             # Signup page
│
├── components/                   # Reusable React Components
│   ├── auth/                    # Authentication components
│   │   ├── Login.tsx            # Login form component
│   │   ├── LogOut.tsx           # Logout handler
│   │   └── SignUp.tsx           # Signup form component
│   │
│   ├── leaderboard/             # Leaderboard UI
│   │   └── LeaderboardCard.tsx  # Individual ranking entry
│   │
│   ├── providers/               # App-wide providers
│   │   └── Providers.tsx        # Wagmi, RainbowKit, React Query
│   │
│   ├── results/                 # Results display components
│   │   ├── DimensionBars.tsx    # Score visualization bars
│   │   ├── ScoreHero.tsx        # Main score display
│   │   └── ShareRow.tsx         # Share/mint action buttons
│   │
│   ├── scorecard/               # Score card components (directory)
│   │
│   ├── ui/                      # Generic UI components
│   │   # (Form inputs, buttons, etc - directory)
│   │
│   ├── upload/                  # Upload flow components
│   │   ├── AnalysisModal.tsx    # Modal wrapper for analysis
│   │   ├── DropZone.tsx         # Drag-drop upload area
│   │   ├── LoadingStages.tsx    # Progress animation
│   │   └── ResultModal.tsx      # Results display modal
│   │
│   └── web3/                    # Web3 components
│       └── MintScoreModal.tsx   # NFT minting interface
│
├── hooks/                        # Custom React Hooks
│   ├── useNFTMint.ts            # NFT minting logic
│   └── useToast.tsx             # Toast notifications
│
├── lib/                         # Utility Functions & Libraries
│   ├── grok.ts                  # Grok Vision API integration
│   ├── image-validation.ts      # Image processing (Sharp)
│   ├── ip-geolocation.ts        # IP → Country lookup
│   ├── prompts.ts               # Grok API prompts (free/premium)
│   ├── r2.ts                    # Cloudflare R2 upload/delete
│   ├── rate-limit.ts            # IP-based rate limiting
│   ├── session.ts               # Client session management
│   ├── schema.sql               # Database schema definition
│   ├── wagmi.ts                 # Wagmi config for Web3
│   └── supabase/
│       ├── admin.ts             # Supabase admin client (server-only)
│       ├── client.ts            # Supabase browser client
│       └── server.ts            # Supabase server-side client
│
├── types/                        # TypeScript Type Definitions
│   ├── analysis.ts              # Analysis data models
│   ├── grok.ts                  # Grok API response types
│   ├── leaderboard.ts           # Leaderboard types
│   └── user.ts                  # User & auth types
│
├── public/                       # Static assets
│   # (Images, icons, fonts)
│
├── docs/                         # Documentation
│   ├── DAILY_TRACKER.md         # Development progress log
│   ├── EXECUTION_PLAN.md        # Project roadmap
│   └── soundarya_technical.md   # Technical deep dive
│
├── PHASE2_COMPLETE.md           # Phase 2 completion notes
├── PHASE2_SETUP.md              # Phase 2 setup guide
├── PHASE3_COMPLETE.md           # Phase 3 completion notes
├── README.md                    # Project README
├── PROJECT_SUMMARY.md           # This file
│
├── app/                         # Configuration files
├── eslint.config.mjs            # ESLint configuration
├── next.config.ts               # Next.js configuration
├── next-env.d.ts                # Next.js type definitions
├── tsconfig.json                # TypeScript configuration
├── postcss.config.mjs           # PostCSS configuration
├── proxy.ts                     # Proxy configuration
├── package.json                 # Dependencies & scripts
└── tailwind.config.mjs          # Tailwind CSS configuration
```

---

## Data Models & Types

### Analysis Type

```typescript
interface Analysis {
  id: string
  user_id?: string
  session_id: string
  ip_hash: string

  // Scores (from Grok AI)
  overall_score: number (1.0-10.0)
  symmetry_score: number (1-100)
  golden_ratio_score: number (1-100)
  bone_structure_score: number (1-100)
  harmony_score: number (1-100)
  skin_score: number (1-100)
  dimorphism_score: number (1-100)
  percentile: number (1-99)
  category: 'Exceptional' | 'Very Attractive' | 'Above Average' | 'Average' | 'Below Average'

  // AI Content
  summary: string
  strengths: string[]
  weakest_dimension: string
  free_tip: string
  premium_hook: string
  premium_tips?: string[] // Only if premium unlocked

  // Metadata
  premium_unlocked: boolean
  premium_tier: 'free' | 'premium' | 'elite'
  stripe_payment_id?: string
  country_code?: string
  country_name?: string
  r2_key?: string
  photo_deleted_at?: string
  shared_count: number
  challenge_token?: string

  created_at: string
  updated_at: string
}
```

### AnalysisPublic Type (Client-safe)

```typescript
interface AnalysisPublic {
    id: string;
    overallScore: number;
    symmetryScore: number;
    goldenRatioScore: number;
    boneStructureScore: number;
    harmonyScore: number;
    skinScore: number;
    dimorphismScore: number;
    percentile: number;
    category: ScoreCategory;
    summary: string;
    strengths: string[];
    freeTip: string;
    premiumHook: string;
    countryCode?: string;
    countryName?: string;
    premiumUnlocked: boolean;
    createdAt: string;
}
```

### UserProfile Type

```typescript
interface UserProfile {
    id: string;
    username?: string;
    email?: string;
    country_code?: string;
    avatar_url?: string;
    subscription_tier: "free" | "premium" | "elite";
    stripe_customer_id?: string;
    total_analyses: number;
    best_score?: number;
    created_at: string;
    updated_at: string;
}
```

### LeaderboardEntry Type

```typescript
interface LeaderboardEntry {
    rank: number;
    id: string;
    overallScore: number;
    percentile: number;
    category: string;
    countryCode?: string;
    displayName: string;
    createdAt: string;
}
```

### LoadingStage Type

```typescript
type LoadingStage =
    | "detecting"
    | "symmetry"
    | "ratio"
    | "structure"
    | "writing";
```

---

## API Routes

### `/api/analyse` (POST)

**Purpose**: Upload image and get AI facial analysis

**Request Body:**

- `photo`: File - Image to analyze (multipart/form-data)
- `sessionId`: string - Client session identifier

**Response:**

```json
{
    "id": "uuid",
    "overallScore": 7.5,
    "symmetryScore": 85,
    "goldenRatioScore": 78,
    "boneStructureScore": 82,
    "harmonyScore": 79,
    "skinScore": 88,
    "dimorphismScore": 75,
    "percentile": 88,
    "category": "Above Average",
    "summary": "...",
    "strengths": ["..."],
    "freeTip": "...",
    "premiumHook": "...",
    "countryCode": "US",
    "countryName": "United States",
    "premiumUnlocked": false,
    "createdAt": "2026-03-23T10:30:00Z"
}
```

**Error Responses:**

- 400: Missing fields, invalid file type, file too large
- 429: Rate limit exceeded (3/24h)
- 500: AI analysis failed, database error

**Flow:**

1. Parse form data (photo + sessionId)
2. Extract client IP, hash for rate limiting
3. Check rate limit
4. Validate image (size, type, dimensions)
5. Process image (resize, optimize, strip metadata)
6. Upload to Cloudflare R2
7. Convert to Base64
8. Call Grok Vision API with appropriate prompt
9. Validate response structure and ranges
10. Save analysis to Supabase
11. Enrich with geolocation
12. Return client-safe analysis object

### `/api/analyse/[id]` (GET)

**Purpose**: Fetch specific analysis by ID

**Query Parameters:**

- `accessToken?`: string - For accessing public challenges

**Response**: Returns full AnalysisPublic object with premium content if unlocked

### `/api/leaderboard` (GET)

**Purpose**: Fetch global or country-specific leaderboard

**Query Parameters:**

- `type`: 'global' | 'country' (default: 'global')
- `country?`: string - ISO 3166-1 alpha-2 country code (required if type='country')
- `limit`: number - Max entries (default: 10, max: 50)

**Response:**

```json
[
  {
    "rank": 1,
    "id": "uuid",
    "overallScore": 9.2,
    "percentile": 99,
    "category": "Exceptional",
    "countryCode": "US",
    "displayName": "Anonymous",
    "createdAt": "2026-03-23T09:00:00Z"
  },
  ...
]
```

**Caching**: 5 minutes with stale-while-revalidate

### `/api/challenge/create` (POST)

**Purpose**: Create shareable challenge from analysis

**Request Body:**

```json
{
    "analysisId": "uuid"
}
```

**Response:**

```json
{
    "challengeId": "uuid",
    "token": "hexstring",
    "challengeUrl": "https://domain/challenge/token"
}
```

### `/api/challenge/[token]` (GET)

**Purpose**: Fetch challenge analysis via public token

**Response**: AnalysisPublic object of original analysis

### `/api/onchain/mint-signature` (POST)

**Purpose**: Generate cryptographic signature for NFT minting

**Request Body:**

```json
{
    "analysisId": "uuid",
    "walletAddress": "0x..."
}
```

**Response:**

```json
{
  "signature": "bytes",
  "scoreData": {
    "overallScore": 75,
    "symmetry": 85,
    ...
  },
  "mintPrice": "0.001"
}
```

### `/api/onchain/record-mint` (POST)

**Purpose**: Record successful NFT mint on-chain

**Request Body:**

```json
{
    "analysisId": "uuid",
    "transactionHash": "0x...",
    "tokenId": "123"
}
```

### `/api/payment/create-session` (POST)

**Purpose**: Create Stripe checkout session

**Request Body:**

```json
{
  "priceId": "price_...",
  "tier": "premium" | "elite"
}
```

**Response**: Stripe checkout session URL

### `/api/payment/portal` (GET)

**Purpose**: Redirect to Stripe customer portal

**Response**: Stripe portal URL

### `/api/health` (GET)

**Purpose**: Health check endpoint for monitoring

**Response:**

```json
{
    "status": "ok",
    "timestamp": "2026-03-23T10:30:00Z"
}
```

### `/api/cron/cleanup-photos` (POST)

**Purpose**: Scheduled cleanup of temporary images

**Security**: Requires `CRON_SECRET` header token

**Logic:**

- Finds all temp images in R2 older than 1 hour
- Deletes from R2 storage
- Marks in database as deleted

### `/api/test-db` (GET)

**Purpose**: Test database connectivity (development only)

---

## Components Architecture

### Page Components

#### `app/page.tsx` (Landing Page)

Main entry point featuring:

- Hero section with call-to-action
- DropZone component for image upload
- Feature highlights
- Smooth scroll navigation
- Premium features teaser

**State Management:**

- `isUploading`: boolean - Upload in progress
- `result`: AnalysisPublic | null - Current analysis
- `isModalOpen`: boolean - Results modal visibility
- `uploadedFile`: File | null - Uploaded image reference

**Key Interactions:**

- Handle file drop/selection
- Fetch `/api/analyse` endpoint
- Animate loading stages
- Display results in modal

#### `app/(marketing)/leaderboard/page.tsx`

Global leaderboard with filtering:

- Global rankings (top 1000 globally)
- Country-specific rankings
- Toggle between views
- Country code input for filtering

**State Management:**

- `entries`: LeaderboardEntry[]
- `loading`: boolean
- `type`: 'global' | 'country'
- `country`: string (ISO code)

#### `app/(app)/analyse/[id]/page.tsx`

Individual analysis detail page:

- Full score breakdown
- Strength/weakness analysis
- Share options
- NFT mint button
- Challenge creation

### Reusable Components

#### `components/upload/DropZone.tsx`

Interactive image upload area:

- Drag-and-drop interface
- File type validation
- Progress animation (5 stages)
- Error handling with retry
- Loading stage display

**Props:**

```typescript
interface DropZoneProps {
    onResult: (data: AnalysisPublic) => void;
}
```

#### `components/results/ScoreHero.tsx`

Main score display component (hero section):

- Large score typography (3.5-8rem)
- Percentile ranking display
- Category badge
- Summary text
- Decorative gold gradient background

**Props:**

```typescript
interface ScoreHeroProps {
    analysis: AnalysisPublic;
}
```

#### `components/results/DimensionBars.tsx`

Score visualization for 6 dimensions:

- Horizontal progress bars
- Color gradients
- Labels with dimension names
- Percentage values
- Compare against percentile

#### `components/results/ShareRow.tsx`

Action buttons row:

- "Share Challenge" button
- "Mint NFT" button
- "Download Report" button
- Social sharing options

#### `components/web3/MintScoreModal.tsx`

NFT minting interface:

- Wallet connection UI (RainbowKit ConnectButton)
- Score preview
- Mint price display
- Transaction confirmation flow
- Success page with IPFS link

**States:**

- CONNECT: Connect wallet
- CONFIRM: Confirm transaction
- MINTING: Transaction in progress
- SUCCESS: Mint complete with token ID

#### `components/leaderboard/LeaderboardCard.tsx`

Individual leaderboard entry:

- Rank badge
- User display name
- Score and percentile
- Category tag
- Country flag (if applicable)
- Timestamp

#### `components/auth/Login.tsx`

Authentication form:

- Email input
- Password input
- "Sign in with Wallet" option
- Submit button
- "Sign up" link
- Password recovery link

#### `components/auth/SignUp.tsx`

Registration form:

- Email input
- Password input
- Confirm password
- Country selection
- Email consent checkbox
- Submit button

#### `components/providers/Providers.tsx`

Root provider wrapper component:

- **QueryClientProvider** (React Query)
- **WagmiProvider** (Web3)
- **RainbowKitProvider** (Wallet UI)
- Custom dark theme with gold accents

### Component Composition Graph

```
Providers (Root)
├── QueryClientProvider
├── WagmiProvider
└── RainbowKitProvider
    └── Layout
        └── Page (Home/Other)
            ├── DropZone
            │   └── LoadingStages
            ├── AnalysisModal
            │   ├── ScoreHero
            │   ├── DimensionBars
            │   ├── ShareRow
            │   │   └── MintScoreModal
            │   │       └── ConnectButton (RainbowKit)
            │   └── ResultModal
            └── LeaderboardCard
```

---

## Core Systems

### Image Processing System

**Flow:**

1. **Validation** (`validateImage`)
    - Check file size (≤10MB)
    - Verify MIME type (JPEG/PNG/WEBP)
    - Parse metadata with Sharp
    - Validate dimensions (200-4096px)

2. **Processing** (`processImageForAnalysis`)
    - Load file as Buffer
    - Use Sharp to:
        - Resize to max 1024px (maintain aspect ratio)
        - Convert to JPEG format
        - Set quality to 85%
        - Strip EXIF metadata
    - Return optimized Buffer

3. **Base64 Encoding** (`imageToBase64`)
    - Convert Buffer to Base64 string
    - Prepend MIME type header
    - Return data URI for API consumption

4. **Storage** (`uploadToR2`)
    - Generate unique key: `temp/{timestamp}_{randomId}.jpg`
    - Upload to Cloudflare R2 bucket
    - Store metadata (upload time, original filename)
    - Return public URL and storage key

**Error Handling:**

- Validation errors returned to client
- Processing errors caught and logged
- Upload failures return retry instructions

### AI Analysis System

**Grok Vision API Integration:**

1. **Prompt Selection**
    - Free tier: `getFreeTierPrompt()` - Returns 9 fields (no premiumTips)
    - Premium tier: `getPremiumTierPrompt()` - Returns 10 fields including premiumTips

2. **API Call Structure**

    ```typescript
    fetch("https://api.x.ai/v1/chat/completions", {
        model: "grok-vision-beta",
        messages: [
            { role: "system", content: systemPrompt },
            {
                role: "user",
                content: [
                    { type: "text", text: userPrompt },
                    {
                        type: "image_url",
                        image_url: { url: base64Image, detail: "high" },
                    },
                ],
            },
        ],
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: "json_object" },
    });
    ```

3. **Response Validation**
    - Check required fields presence
    - Validate score ranges
    - Verify percentile (1-99)
    - Confirm category matches score
    - Validate dimension scores (1-100 integers)
    - Check array contents (strengths, premiumTips)

4. **Error Responses**
    - Network errors return retry message
    - Invalid JSON returns parse error
    - Missing fields list exact failures
    - Out-of-range scores return validation error

### Rate Limiting System

**Implementation:**

1. **Extract IP Address**
    - Check `x-forwarded-for` header (behind proxy)
    - Fallback to `socket.remoteAddress`
    - Error if IP cannot be determined

2. **Hash IP**
    - Create SHA-256 hash with environment salt
    - Use first 16 characters of hash
    - Never store raw IP for privacy

3. **Count Recent Analyses**
    - Query Supabase for analyses matching IP hash
    - Filter for last 24 hours
    - Get count (3 free max)

4. **Return Status**
    - `{ allowed: true, remaining: X }` if under limit
    - `{ allowed: false, remaining: 0, retryAfter: 86400 }` if exceeded
    - On error: Allow with warning (fail-open approach)

### Authentication & Session System

**Session Management (`lib/session.ts`):**

1. **Client-Side Session**
    - Generated via `crypto.randomUUID()`
    - Stored in `localStorage` with key `soundarya_session_id`
    - Persists across page reloads
    - Sent with analysis requests

2. **Server-Side Session**
    - Generated on-demand server-side if needed
    - Combined with IP hash for rate limiting
    - No state stored server-side (stateless)
    - Session ID purely for tracking user interactions

3. **Session Helpers**
    - `getOrCreateSessionId()`: Returns existing or generates new
    - `clearSession()`: Removes from localStorage on logout
    - `hasValidSession()`: Checks if session exists

**Wallet Authentication (`wagmi.ts`):**

1. **Wagmi Configuration**
    - Chains: Base mainnet + Sepolia testnet
    - Connectors:
        - Coinbase Wallet
        - Injected (MetaMask, browser wallets)
        - WalletConnect (if projectId provided)
    - HTTP transports for each chain

2. **RainbowKit Integration**
    - Custom dark theme with gold accents (#C9A96E)
    - Small border radius for modern look
    - System font stack
    - Mobile-optimized

### Leaderboard & Materialized View

**Materialized View: `leaderboard_daily`**

Updated every 5 minutes:

```sql
SELECT
  a.id,
  a.overall_score,
  a.percentile,
  a.country_code,
  a.country_name,
  a.category,
  p.username,
  RANK() OVER (ORDER BY a.overall_score DESC) AS global_rank,
  RANK() OVER (PARTITION BY a.country_code ORDER BY a.overall_score DESC) AS country_rank,
  a.created_at
FROM analyses a
LEFT JOIN profiles p ON a.user_id = p.id
WHERE a.created_at > now() - INTERVAL '24 hours'
  AND a.overall_score > 0
ORDER BY a.overall_score DESC
LIMIT 1000
```

**Purpose:**

- Pre-calculated rankings eliminate query latency
- Limited to 1000 entries for performance
- Only includes last 24 hours of analyses
- Filters out invalid scores
- Efficient country-level partitioning

---

## Authentication & Authorization

### User Tiers

**Free Tier:**

- 3 analyses per IP per 24 hours
- Basic summary and strengths
- One free tip
- Premium content teaser (hook)
- No premium_tips array

**Premium Tier:**

- Unlimited analyses (per subscription)
- All free tier content
- 20 detailed premium tips
- Priority support
- Analysis history
- Advanced filtering on leaderboard

**Elite Tier:**

- All premium features
- White-glove support
- Custom analysis features
- Additional perks (TBD)

### Supabase Authentication

**Supported Methods:**

- Email + Password
- OAuth (Google, GitHub, Discord - configurable)
- Magic Link
- Social sign-in

**Client Initialization:**

```typescript
// Browser: createBrowserClient (from @supabase/ssr)
const supabase = createBrowserClient(
  NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// Server: createServerClient (for route handlers)
const supabase = createServerClient(...)

// Admin: createClient with service_role key (admin.ts)
const supabaseAdmin = createClient(
  NEXT_PUBLIC_SUPABASE_URL,
  SERVICE_ROLE_KEY // Elevated privileges
)
```

### Row-Level Security (RLS)

While not fully documented in provided files, typical RLS policies for Soundarya would include:

- Users can only modify their own profile
- Analyses are public (readable by all)
- Challenge tokens grant temporary access
- Premium content visible only if `premium_unlocked = true`

---

## Payment & Monetization

### Stripe Integration

**Subscription Products:**

- Premium: Monthly recurring
- Elite: Monthly recurring (premium+ features)

**Checkout Flow:**

1. Client selects tier (Premium or Elite)
2. POST `/api/payment/create-session` with priceId
3. Receives Stripe checkout URL
4. User redirected to Stripe Checkout
5. After payment, webhook updates user's subscription_tier
6. User gains access to premium features

**Webhook Handling:**

- `customer.subscription.created`: User subscribed
- `customer.subscription.updated`: Plan changed
- `customer.subscription.deleted`: Subscription cancelled
- `invoice.payment_failed`: Payment failed

**Payment Status Tracking:**

- Stored in `profiles.subscription_tier` (`free`/`premium`/`elite`)
- Stored in `profiles.stripe_customer_id` (customer identifier)
- Analysis-level tracking in `analyses.premium_tier` and `analyses.stripe_payment_id`

### Customer Portal

- Users can manage subscriptions
- View billing history
- Update payment method
- Cancel subscription
- Accessed via `/api/payment/portal`

---

## Web3 Integration

### Base L2 Blockchain

**Network Configuration:**

- **Mainnet**: Chain ID 8453
- **Testnet (Sepolia)**: Chain ID 84532
- **RPC Endpoints**: Public HTTP providers
- **Currency**: ETH

**NFT Score Attestation:**

1. **Smart Contract**
    - ERC-721 (NFT standard)
    - Stores score data on-chain:
        - Overall score
        - 6 dimension scores
        - Percentile
        - Timestamp
        - Metadata URI (IPFS)

2. **Minting Process**
    - User connects wallet (RainbowKit)
    - Frontend calls `/api/onchain/mint-signature`
    - Backend generates EIP-712 signature
    - Frontend calls contract with signature
    - User confirms transaction (2 confirmations)
    - Token minted and assigned
    - Success recorded in database

3. **Verification**
    - Score on-chain cannot be altered (immutable)
    - Cryptographic signature ensures authenticity
    - Publicly verifiable on blockchain explorers
    - IPFS metadata ensures image persistence

### useNFTMint Hook

**State Management:**

```typescript
const {
    mint, // Async function to initiate mint
    isLoading, // Minting in progress
    error, // Error message if failed
    txHash, // Transaction hash
    tokenId, // Resulting NFT token ID
    isSuccess, // Mint completed successfully
} = useNFTMint(analysisId);
```

**Flow:**

1. Check wallet connected
2. Fetch signature from API
3. Call contract with signature
4. Wait for 2 confirmations
5. Return token ID and tx hash
6. Record mint in database via `/api/onchain/record-mint`

---

## Database Schema

### Tables

#### `profiles` (extends Supabase auth.users)

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  username TEXT UNIQUE,
  email TEXT,
  country_code CHAR(2),
  avatar_url TEXT,
  subscription_tier TEXT DEFAULT 'free',
  stripe_customer_id TEXT UNIQUE,
  total_analyses INTEGER DEFAULT 0,
  best_score NUMERIC(3,1),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
)
```

#### `analyses` (Main analysis results)

```sql
CREATE TABLE analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL,
  ip_hash TEXT NOT NULL,

  -- Dimension Scores
  overall_score NUMERIC(3,1) NOT NULL,
  symmetry_score SMALLINT,
  golden_ratio_score SMALLINT,
  bone_structure_score SMALLINT,
  harmony_score SMALLINT,
  skin_score SMALLINT,
  dimorphism_score SMALLINT,
  percentile SMALLINT,
  category TEXT,

  -- Content
  summary TEXT NOT NULL,
  strengths TEXT[] DEFAULT '{}',
  weakest_dimension TEXT,
  free_tip TEXT,
  premium_hook TEXT,
  premium_tips TEXT[] DEFAULT '{}',

  -- Payment & Access
  premium_unlocked BOOLEAN DEFAULT FALSE,
  premium_tier TEXT DEFAULT 'free',
  stripe_payment_id TEXT,

  -- Metadata
  country_code CHAR(2),
  country_name TEXT,
  r2_key TEXT,
  photo_deleted_at TIMESTAMPTZ,
  shared_count INTEGER DEFAULT 0,
  challenge_token TEXT UNIQUE,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
)
```

#### `leaderboard_daily` (Materialized View)

Pre-calculated rankings refreshed every 5 minutes.

### Indexes

Performance optimization indexes:

```sql
CREATE INDEX idx_analyses_overall_score ON analyses(overall_score DESC);
CREATE INDEX idx_analyses_country ON analyses(country_code);
CREATE INDEX idx_analyses_created_at ON analyses(created_at DESC);
CREATE INDEX idx_analyses_user_id ON analyses(user_id);
CREATE INDEX idx_analyses_session ON analyses(session_id);
CREATE INDEX idx_analyses_ip_hash ON analyses(ip_hash, created_at DESC);
CREATE UNIQUE INDEX idx_analyses_challenge_token
  ON analyses(challenge_token) WHERE challenge_token IS NOT NULL;
```

### Extensions

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";   -- UUID generation
CREATE EXTENSION IF NOT EXISTS "pg_cron";     -- Scheduled jobs
```

---

## Development & Deployment

### Local Development Setup

**Prerequisites:**

- Node.js 18+ LTS
- npm or yarn
- Supabase project
- Grok API key
- Cloudflare R2 credentials
- Stripe test keys (optional)

**Environment Variables:**

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# Grok API
GROK_API_KEY=xxx

# Cloudflare R2
CLOUDFLARE_R2_ENDPOINT=https://xxx.r2.cloudflarestorage.com
CLOUDFLARE_R2_ACCESS_KEY_ID=xxx
CLOUDFLARE_R2_SECRET_ACCESS_KEY=xxx
CLOUDFLARE_R2_BUCKET_NAME=xxx
CLOUDFLARE_R2_PUBLIC_URL=https://cdn.soundarya.ai

# Web3
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=xxx

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Security
CRON_SECRET=your-secret-cron-token
```

**Development Server:**

```bash
npm run dev
# Runs on http://localhost:3000
```

**Build & Deploy:**

```bash
npm run build      # Next.js build with webpack
npm start          # Production server
npm run lint       # ESLint check
```

### Build Configuration

**Next.js Config (`next.config.ts`):**

- Server Actions body limit: 10MB (for image uploads)
- Image optimization:
    - Remote patterns: `uploads.soundarya.ai`
- Security headers for API routes:
    - X-Content-Type-Options: nosniff
    - X-Frame-Options: DENY

### Deployment Targets

**Vercel (Recommended):**

- Direct Next.js deployment
- Edge functions for API routes
- Automatic CI/CD pipeline
- Production domain setup

**Alternative Platforms:**

- AWS EC2 / Elastic Beanstalk
- Heroku
- DigitalOcean App Platform
- Self-hosted Docker container

### Performance Optimizations

1. **Image Optimization**
    - Sharp processing reduces upload bandwidth
    - R2 storage with CDN caching
    - Temporary image cleanup (1-hour TTL)

2. **API Optimization**
    - Leaderboard materialized view (pre-calculated)
    - HTTP caching headers (5-min cache, stale-while-revalidate)
    - Database indexes on frequent queries

3. **Client Optimization**
    - React Query caching
    - Next.js automatic code splitting
    - Lazy loading components
    - CSS minimize with Tailwind

4. **Web3 Optimization**
    - Wagmi query client caching
    - RPC rate limiting awareness
    - Transaction confirmation waiting

---

## Key Features Overview

### 1. **Instant Facial Analysis**

- Single-click image upload
- AI analysis within seconds
- 7-dimension scoring system
- Percentile ranking against global dataset

### 2. **Global Aesthetic Leaderboard**

- Real-time global rankings
- Country-specific filtering
- 24-hour rolling window
- Anonymized with optional branding

### 3. **Premium Insights**

- 20 actionable improvement tips
- Personalized recommendations
- Makeup, skincare, lifestyle guidance
- Tiered access (Free → Premium → Elite)

### 4. **NFT Score Minting**

- Permanent on-chain attestation
- Smart contract verification
- Immutable proof of score
- Base L2 for cost efficiency
- IPFS metadata storage

### 5. **Social Sharing**

- Challenge friends to compare scores
- Unique shareable tokens
- Public leaderboard entry
- Privacy-respecting sharing

### 6. **Rate Limiting**

- Free tier: 3 analyses/24h per IP
- Privacy-preserving IP hashing
- Encourages premium conversion
- DDoS/abuse prevention

### 7. **Payment Integration**

- Stripe subscription management
- Multiple pricing tiers
- Webhook automation
- Customer portal access

### 8. **Privacy & Security**

- Image metadata stripping
- IP hashing (never store raw IP)
- Temporary image storage (1-hour TTL)
- HTTPS-only communication
- Database row-level security

---

## Future Enhancement Opportunities

1. **Analytics Dashboard**: User insights, trend analysis
2. **Mobile App**: React Native version for iOS/Android
3. **Advanced Filtering**: Age, gender, ethnicity breakdowns (ethical considerations)
4. **Community Features**: User profiles, follow/friend system
5. **Video Analysis**: Frame-extraction from video uploads
6. **AR Filters**: AR makeup/styling recommendations
7. **Partnerships**: Integration with beauty brands for sponsored tips
8. **Affiliate Program**: Monetize premium tool recommendations
9. **AI Improvements**: Fine-tuned models, multi-angle analysis
10. **Marketplace**: Buy/sell styling consultations

---

## Conclusion

**Soundarya** is a sophisticated, full-stack next-generation beauty assessment platform that seamlessly blends AI, Web3, and modern UI/UX principles. The architecture prioritizes:

- **User Privacy**: IP hashing, temporary file storage, minimal data retention
- **Scalability**: Materialized views, indexed queries, CDN caching
- **Revenue**: Tiered subscriptions, NFT monetization, future partnerships
- **Security**: Rate limiting, wallet authentication, cryptographic signatures
- **Experience**: Smooth animations, responsive design, intuitive flows

The codebase is production-ready, maintainable, and extensible for future features and integrations.

---

**Document Generated**: March 23, 2026  
**Version**: 1.0  
**Project Status**: Phase 3 Complete
