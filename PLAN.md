# Uzoza Platform Upgrade Implementation Plan

## Overview
This plan upgrades Uzoza from the current 7-dimension scan flow into the newer onchain-aware product shape: 9-dimension analysis, relayer-backed scan attestations, email delivery, merged scan history, ETH-priced unlock tiers, and a rebuilt profile/dashboard experience. The work is staged so data model and API changes land before UI features that depend on them.

## Goals
- Upgrade the analysis engine and storage model to the new 9-dimension schema.
- Add the new API surface for relaying, unlock verification, email delivery, history, usernames, rescans, and assistant chat.
- Replace legacy payment assumptions with Base-native unlock flows and live ETH pricing.
- Rebuild result and profile UX around the new data model and contract capabilities.

## Non-Goals
- Re-deploy or modify contracts.
- Change the current wallet stack beyond what is required for the new flows.
- Fully redesign the landing page again.

## Assumptions and Constraints
- The updated ABI in [lib/abi/SoundaryaScore.json](/Users/0t41k1/Documents/soundarya/lib/abi/SoundaryaScore.json) is the correct deployed contract surface.
- Contract addresses provided by the user are the current deployed addresses.
- The relayer and minter keys will be supplied via environment variables; secret values are not committed.
- The current repo has unrelated local changes in [PROJECT_SUMMARY.md](/Users/0t41k1/Documents/soundarya/PROJECT_SUMMARY.md); those are not part of this work.
- We will preserve existing flows where possible and make degraded offchain fallbacks only when the contract surface does not expose enough state.

## Requirements

### Functional
- Store 9-dimension analysis results and scan metadata.
- Fire a non-blocking relayer attestation after successful analysis persistence.
- Store scan hashes client-side and support wallet-claim linking.
- Collect emails and deliver free or paid reports via Resend.
- Expose ETH pricing, unlock verification, score history, assistant, username, claim-scans, and rescan routes.
- Support unlock tiers 0/1/2/3 both in DB and UI.
- Rebuild profile into a history dashboard with wallet, username, rescan, and assistant sections.

### Non-Functional
- Analysis response should not block on relayer submission.
- New APIs must fail gracefully and return actionable errors.
- Onchain sync should be idempotent where possible.
- The app must continue to build cleanly under Next.js 16 + webpack mode.

## Technical Design

### Data Model
- Extend `analyses` with new dimension fields, confidence/archetype fields, scan linkage fields, unlock tier, email fields, relayer tx hash, and JSON arrays for premium insights.
- Extend `profiles` with wallet address and rescan credits.
- Add `assistant_messages` and simplified `nft_mints`.
- Remove Stripe-specific schema artifacts from the project schema file.

### API Design
- Update `/api/analyse` to write new columns, attach `user_id` when authenticated, compute `scan_hash`, and fire the relayer.
- Add `/api/collect-email`, `/api/eth-price`, `/api/onchain/verify-unlock`, `/api/onchain/claim-scans`, `/api/score-history`, `/api/assistant`, `/api/username/set`, `/api/username/check`, and `/api/analyse/rescan`.
- Update `/api/analyse/[id]`, `/api/profile`, and existing onchain routes to the new response contracts.

### Architecture
- Client uploads portrait to `/api/analyse`.
- API validates image, runs Gemini, persists the analysis, then asynchronously calls `attestScan`.
- Client stores `{ analysisId, scanHash }` locally for later wallet claiming.
- Wallet connect triggers claim-scans sync and optional onchain claim calls.
- Unlock buttons call `unlockReport` on the score contract, then `/api/onchain/verify-unlock` mirrors tier state into Supabase.
- Profile aggregates analyses by `user_id`, `wallet_address`, and `session_id`.

### UX Flow
- Free result shows email capture first, then unlock options with live ETH prices.
- Premium/Elite result exposes citations, extended insights, and predictions.
- Profile shows score history, scan list, minted NFTs, username controls, rescan state, and assistant access.

---

## Implementation Plan

### Serial Dependencies (Must Complete First)

#### Phase 0: Backend Foundation
**Prerequisite for:** All subsequent phases

| Task | Description | Output |
|------|-------------|--------|
| 0.1 | Update env templates, contract constants, and ABI consumers | New address/config baseline |
| 0.2 | Extend schema/types for 9-dimension analyses and profile additions | Updated SQL and TS types |
| 0.3 | Replace prompt/Gemini validation with the 9-dimension engine | New AI response contract |
| 0.4 | Add relayer module and wire non-blocking attestation into analysis persistence | Relayer-backed analysis route |
| 0.5 | Remove Stripe-specific routes/config from the codebase | Cleaned payment surface |

---

### Parallel Workstreams

#### Workstream A: API Surface
**Dependencies:** Phase 0
**Can parallelize with:** Workstreams B, C

| Task | Description | Output |
|------|-------------|--------|
| A.1 | Add email collection + Resend delivery route | `/api/collect-email` |
| A.2 | Add cached ETH price route | `/api/eth-price` + helper |
| A.3 | Add unlock verification and scan-claim routes | `/api/onchain/verify-unlock`, `/api/onchain/claim-scans` |
| A.4 | Add score history, assistant, username, and rescan routes | New APIs for profile UX |

#### Workstream B: Onchain Hooks and Client State
**Dependencies:** Phase 0
**Can parallelize with:** Workstreams A, C

| Task | Description | Output |
|------|-------------|--------|
| B.1 | Add local scan hash storage helpers | Session scan linking |
| B.2 | Add `useUnlockReport` and `useScoreHistory` hooks | Contract + query hooks |
| B.3 | Update existing mint/subscribe hooks to new addresses and sync routes | Consistent onchain behavior |

#### Workstream C: Result and Profile UI
**Dependencies:** Phase 0
**Can parallelize with:** Workstreams A, B

| Task | Description | Output |
|------|-------------|--------|
| C.1 | Add email capture, citations, predictions, and score comparison components | Result extensions |
| C.2 | Replace the paywall with ETH unlock tiers | Updated result modal |
| C.3 | Build claim-scans, username, graph, wallet, scan history, and assistant UI | New profile/dashboard components |

---

### Merge Phase

#### Phase N: Integration
**Dependencies:** Workstreams A, B, C

| Task | Description | Output |
|------|-------------|--------|
| N.1 | Rebuild profile page using new APIs and hooks | Integrated dashboard |
| N.2 | Verify end-to-end flows for free scan, unlock, username, claim-scans, and history | Working product flows |
| N.3 | Clean regressions, update docs/env templates, and finalize commits | Ready-to-test branch |

---

## Testing and Validation

- Build verification with `npm run build`
- Manual API verification:
  - `/api/test-db`
  - `/api/health`
  - `/api/eth-price`
- Manual flow checks:
  - free scan persists and stores local scan hash
  - relayer failure does not fail scan
  - email capture updates `analyses.user_email`
  - unlock transaction mirrors `unlock_tier`
  - wallet connect claims prior scans
  - profile merges `user_id`, `wallet_address`, and `session_id`

## Rollout and Migration

- Apply the updated SQL schema before deploying the new API layer.
- Add the new env vars for score NFT address, leaderboard address, minter key, relayer key, Base RPC, chain id, and Resend.
- Remove old Stripe env vars from deployment configuration.
- Roll back by reverting to the prior commit and re-deploying only if schema additions are backward compatible.

## Verification Checklist

- `npm run build`
- Confirm `/api/test-db` returns success after schema migration
- Run one analysis and confirm:
  - DB row written
  - `scan_hash` stored
  - localStorage contains `soundarya_scans`
- Execute one unlock flow and confirm `unlock_tier` sync
- Connect wallet and confirm claimed scans appear in score history

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Mint signature format differs from current assumptions | Med | High | Keep the existing mint path isolated and verify against contract behavior before changing signer logic |
| Relayer or Resend failures degrade user flow | Med | Med | Make both non-blocking and persist error state for retry/inspection |
| Profile merge logic duplicates scans | Med | Med | Deduplicate by analysis id after merging sources |
| Premium tier visibility drifts from onchain truth | Med | High | Centralize verification in `/api/onchain/verify-unlock` and refresh analysis after payment |

## Open Questions

- [ ] Exact signer payload for `mintScore` server signatures if the current mock signer is to be replaced in this pass.
- [ ] Whether assistant usage limits should be enforced per plan or left open for Premium/Elite initially.

## Decision Log

| Decision | Rationale | Alternatives Considered |
|----------|-----------|------------------------|
| Keep relayer fire-and-forget | User scans should not wait on extra onchain gas calls | Synchronous relayer execution |
| Use direct Resend HTTP calls instead of a new SDK dependency | Reduces package churn and works in server routes | Add `resend` package |
| Merge history from user id, wallet, and session | Matches the product requirement and fixes current fragmented history | User-id-only history |
