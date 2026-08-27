# 🚀 Automation Hub — Production Deployment & Verification Checklist

This checklist must be executed and verified before launching Automation Hub to production.

---

## 1. Frontend & CDN Deployment
- [x] **Production Domain**: Deployed on SSL/HTTPS (`https://automation-testing-theta.vercel.app`).
- [x] **Next.js App Router**: Optimized production bundle compiled with zero build errors (35+ static and dynamic routes).
- [x] **Content Security Policy (CSP)** & Security Headers configured in middleware / proxy.
- [x] **Zero Mock Fallbacks in Production**: UI communicates exclusively with real backend API routes and verified platform adapters.

---

## 2. Backend & API Infrastructure
- [x] **Serverless Runtime**: Configured on Vercel / Edge Network.
- [x] **SSRF Guard**: `src/lib/security/ssrf.ts` actively validates all destination URLs and blocks loopback/private/metadata IP addresses.
- [x] **Sliding-Window Rate Limiting**: `src/lib/security/rate-limit.ts` enforces threshold limits on authentication and publishing endpoints.
- [x] **Input Validation**: Strict Zod schemas on all endpoints (`/api/campaigns`, `/api/media`, `/api/channels`, `/api/publishing/jobs`).

---

## 3. Database (Supabase PostgreSQL)
- [x] **Connection Pooling**: PgBouncer / Supabase connection pool configured.
- [x] **Row Level Security (RLS)**: Enabled across all operational tables (`users`, `organizations`, `campaigns`, `campaign_targets`, `content_items`, `content_variants`, `media_assets`, `connected_accounts`, `oauth_tokens`, `publishing_jobs`, `audit_logs`).
- [x] **Automated Backups**: Daily automated PITR (Point-in-Time Recovery) and database snapshots enabled in Supabase dashboard.
- [x] **Strict Secret Segregation**: Database connection string and service role key kept strictly in server-side environment variables.

---

## 4. Storage Infrastructure (Supabase Storage)
- [x] **Bucket Configuration**: `media` storage bucket configured with private access.
- [x] **Signed URLs**: Media assets accessible via time-limited signed URLs (TTL 3600s) generated on the fly for secure external ingestion.
- [x] **MIME Whitelisting**: Strict MIME validation (`image/jpeg`, `image/png`, `image/webp`, `image/gif`, `video/mp4`, `video/quicktime`).
- [x] **File Size Guard**: Enforced 50 MB hard limit on uploads.

---

## 5. Environment Variables & Secret Hygiene
- [x] **`.env.example` Template**: Created with full variable reference and placeholder definitions.
- [x] **`.gitignore` Protection**: All `.env*` files strictly excluded from git repository.
- [x] **Zero Secret Leakage**: Verified that no `NEXT_PUBLIC_*` variable contains API secrets, database passwords, or private encryption keys.
- [x] **AES-256-GCM Token Encryption**: `OAUTH_TOKEN_ENCRYPTION_KEY` configured as a 32-byte hex key for encrypting OAuth tokens.

---

## 6. Official OAuth Apps & Redirect URLs
- [x] **Instagram / Meta Graph API**:
  - Valid OAuth Redirect URI: `https://automation-testing-theta.vercel.app/api/oauth/instagram/callback`
  - Permissions: `instagram_basic`, `instagram_content_publish`, `pages_show_list`, `pages_read_engagement`
  - Graph API Version: `v25.0`
- [x] **Pinterest API v5**:
  - Valid OAuth Redirect URI: `https://automation-testing-theta.vercel.app/api/oauth/pinterest/callback`
  - Scopes: `boards:read,pins:read,pins:write,user_accounts:read`
- [x] **Medium API v1**:
  - Valid OAuth Redirect URI: `https://automation-testing-theta.vercel.app/api/oauth/medium/callback`
  - Scopes: `basicProfile,publishPost`
- [x] **OAuth Nonce State**: Cookie-based random nonce validation for CSRF defense.

---

## 7. Background Worker & Queue Infrastructure
- [x] **Asynchronous Execution**: Backend publishing engine processes jobs via background workers without client browser dependency.
- [x] **Automated Scheduler (Vercel Cron)**: Configured in `vercel.json` to execute `/api/scheduler/run` every minute.
- [x] **Timezone Accuracy**: Defaulting to `Asia/Jakarta (WIB · UTC+7)` with precise UTC conversion.
- [x] **Exponential Backoff**: Jeda percobaan ulang bertingkat (30s → 60s → 120s → 240s) for retryable transient errors.
- [x] **Duplicate Job Prevention**: Target lock prevention prevents duplicate publishing dispatches.

---

## 8. Logging, Auditing & Monitoring
- [x] **Zero-Credential Audit Trail**: Immutable logging across 15 action types in `/audit-logs`.
- [x] **Automatic Redaction**: Passwords, access tokens, refresh tokens, and client secrets are stripped before logging.
- [x] **Official Metrics Only**: Real-time analytics at `/analytics` strictly adheres to official API capabilities and shows `"Not available through API"` for unsupported services.
- [x] **CSV Compliance Export**: Instant export of activity logs for regulatory and enterprise auditing.
