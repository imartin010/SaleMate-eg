# OTP System Rebuild Plan

Prepared: 2025-11-13  
Owner: Core Platform Team  
Scope: Replace the existing ad-hoc OTP fallback stack with a clean, auditable, and extensible verification service.

---

## 1. Objectives

1. **Reliability** – guarantee deterministic behaviour whether telecom delivery succeeds or not, with explicit challenge state and retry flows.
2. **Security** – hash all OTP secrets at rest, enforce rate limits, and support multiple contexts (signup / password reset / 2FA) without code duplication.
3. **Observability** – log every request, response, and verification attempt so we can trace issues quickly.
4. **Extensibility** – support future channels (email, WhatsApp) and providers beyond Twilio with minimal changes.
5. **Compliance** – align with Supabase/Auth best practices, including token TTLs, RLS-safe tables, and minimal service role usage.

---

## 2. Functional Requirements

| Area | Requirement |
| --- | --- |
| Request OTP | Accept phone number + context, validate (E.164), create challenge, dispatch via SMS (primary) or fallback, respond with opaque `challenge_id` (UUID) and optional dev code when fallback engaged. |
| Verify OTP | Accept `challenge_id` + code (or phone + code for legacy compatibility), validate hash, enforce max attempts, mark challenge as `verified`, update domain state (e.g. `profiles.phone_verified_at`). |
| Retry | Allow resend after cooldown (default 30s), reuse same challenge while status = `pending`; create new challenge if previous expired. |
| Rate limiting | Per phone: max 3 requests / 15 min, cooldown 30s. Per IP: optional throttle via shared table. |
| Expiry | Default 5 minutes; configurable per context. Expired challenges automatically cleaned. |
| Admin visibility | Expose a Supabase SQL view for support teams to inspect latest challenges. |

---

## 3. Architecture Overview

```
Client (web / mobile)
    │
    ├── POST /functions/v1/otp-request
    │       └─ validates → writes challenge → dispatch provider → returns challenge_id (+ dev otp in fallback)
    │
    └── POST /functions/v1/otp-verify
            └─ validates → loads challenge → compares hash → marks verified → updates domain state
```

Key Components:

1. **Database** (new schema)
   - `otp_challenges`
   - `otp_attempts`
   - `otp_dispatch_events` (optional, but recommended for future analytics)
   - Helper views (`otp_challenges_recent`, `otp_challenges_pending`)
2. **Edge Functions**
   - `otp-request` (replaces `send-otp`)
   - `otp-verify` (replaces `verify-otp`)
   - Shared util module for hashing, formatting, Twilio client, fallback logging.
3. **Supabase Auth Integration**
   - PL/pgSQL function `mark_phone_verified(challenge_id uuid)` used by edge function.
   - Ensure RLS allows only service role to mutate tables.
4. **Frontend API Hook**
   - Replace direct `sendOTP` / `verifyOTP` calls with typed wrapper returning `{ challengeId, expiresIn, devCode }`.
   - Store `challengeId` in component state while user enters the code.

---

## 4. Data Model

### 4.1 `otp_challenges`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid (PK, default gen_random_uuid()) | Opaque challenge ID returned to clients |
| `context` | text | `signup`, `password_reset`, `2fa` |
| `channel` | text | `sms`, `email`, `whatsapp` |
| `phone` | text | Normalised E.164 (nullable if email channel) |
| `target` | text | Generic target (phone or email); duplicates allowed |
| `code_hash` | text | SHA-256 hash of OTP |
| `expires_at` | timestamptz | Challenge expiry |
| `status` | text | `pending`, `sent`, `verified`, `expired`, `cancelled` |
| `attempt_count` | integer | Incremented on verify attempts |
| `metadata` | jsonb | Provider response, gateway message ID, etc. |
| `created_at` | timestamptz default now() |  |
| `verified_at` | timestamptz |  |
| `verified_by` | uuid | Profile ID if available |
| `provider` | text | `twilio_verify`, `fallback_dev`, etc. |
| `send_count` | integer default 0 | Tracks resends |

Indexes:
- `idx_otp_challenges_target_created_at`
- `idx_otp_challenges_status_expires`
- Partial index on `(target)` where `created_at > now() - interval '15 minutes'` for rate limiting.

### 4.2 `otp_attempts`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | bigint | surrogate key |
| `challenge_id` | uuid (FK) |  |
| `attempted_code_hash` | text | hashed attempt (optional) |
| `result` | text | `success`, `mismatch`, `expired`, `rate_limited` |
| `ip_address` | inet | optional |
| `user_agent` | text | optional |
| `created_at` | timestamptz |  |

### 4.3 Cleanup

Function `purge_expired_otp()` scheduled daily to remove challenges older than 24h and attempts older than 7d.

---

## 5. Edge Function Responsibilities

### `otp-request`
1. Parse input (phone/email, context, optional resend token).
2. Enforce rate limits (by target + IP) using recent rows from `otp_challenges`.
3. Create or update challenge row (reuse existing pending challenge if within cooldown).
4. Generate OTP (default numeric 6 digits) and hash it (`crypto.subtle`).
5. Dispatch via provider:
   - Twilio Verify (default)
   - Fallback development mode (if env `OTP_FALLBACK_ENABLED=true` or Twilio error)
6. Update challenge `status`, `provider`, `send_count`.
7. Return payload: `{ challengeId, expiresIn, resendAvailableAt, fallback: { devOtp?, reason? } }`.

### `otp-verify`
1. Accept `{ challengeId, code }` (legacy support: `{ phone, code, context }`).
2. Look up challenge (status pending/sent, not expired).
3. Increment attempt count, log to `otp_attempts`.
4. Compare hashed code.
5. On success: set `status='verified'`, `verified_at=now()`, call `mark_phone_verified()` (if context supports), optionally emit event (webhook).
6. On failure: return standard error messages, apply attempt limit (max 5).

Shared module: `supabase/functions/_shared/otp.ts`
- `hashOTP(code)`
- `generateOTP(length, alphabet)`
- `shouldFallback(err)`
- `prettifyPhone(phone)`

---

## 6. Frontend Changes

1. **Auth Store**
   - Replace `sendOTP` and `verifyOTP` with new endpoints returning `challengeId`.
   - Persist `challengeId` in SignUp state.

2. **Signup Page**
   - Show `devOtp` + helper message when fallback triggered.
   - Respect `resendAvailableAt`, disable resend until allowed.
   - Display specific error (e.g., “Maximum attempts reached”).

3. **Reusable Hook**
   - `useOtpChallenge(context: 'signup' | 'password_reset')` returning helpers to request/resend/verify.

4. **Error Handling**
   - Map API codes to human-friendly messages (use enumerated error codes: `OTP_RATE_LIMIT`, `OTP_EXPIRED`, etc.).

---

## 7. Migration & Rollout Plan

1. **Phase 0 – Prep (current)**
   - Document plan (this file).
   - Capture existing environment variables & Twilio credentials.

2. **Phase 1 – Schema**
   - Create new tables via migration `20251114080000_create_otp_challenges.sql`.
   - Add RLS policies (service role only).

3. **Phase 2 – Edge Functions**
   - Implement shared util module.
   - Create new `otp-request` and `otp-verify` functions.
   - Deploy to staging project.

4. **Phase 3 – Frontend Integration**
   - Update auth store & signup flow.
   - Add fallback messaging & improved timers.

5. **Phase 4 – Testing**
   - Unit: Hashing, TTL, attempted limit functions.
   - Integration: cURL tests for request/verify (normal, fallback, rate limited, expired).
   - E2E: Playwright scenario for signup.

6. **Phase 5 – Cutover**
   - Switch environment variables to new endpoints.
   - Monitor Supabase logs & analytics for anomaly.
   - Once stable, archive legacy tables/functions.

7. **Phase 6 – Cleanup**
   - Remove old `otp_verifications` table after data export (if required).
   - Update docs (`AUTH_SYSTEM_IMPLEMENTATION_COMPLETE.md`, README).

---

## 8. Open Questions

1. **Use Cases Beyond Signup** – Should we support password reset or 2FA immediately, or scope to signup now?
2. **Multi-channel** – Any near-term requirement for email/WhatsApp OTPs? If yes, design `channel` column carefully.
3. **Dev Fallback** – Should fallback be enabled per environment via config (`ALLOW_DEV_OTP_FALLBACK`)?
4. **Observability** – Do we need to push challenge events to Logflare/Sentry?
5. **Localization** – OTP SMS templates, should we support Arabic text?

---

## 9. Next Actions

1. Confirm requirements & open questions with stakeholders.
2. Author schema migration & shared function scaffolding.
3. Implement and deploy new edge functions.
4. Update frontend & run QA.
5. Schedule production cutover and cleanup.

---

*End of document.*

