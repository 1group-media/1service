# 1group.media Security Policy & Architectural Invariants

**Applies to:** All repositories and agents in `1group-media` (`1pay`, `1tab`, `1commerce`, `1service`, `1delivery`, `1search`, `1command`, `1group.media`).  
**Status:** Mandatory & Active  
**Last Updated:** September 2026

---

## 1. Security Incident & Remediation History (September 2026 Audit)

During the September 2026 independent ecosystem audit, critical vulnerabilities were discovered and resolved across the suite. All future agents and engineers must understand these incidents to prevent regressions:

| Incident / Vulnerability | Affected Repos | Remediation Applied | Invariant Enforced |
| :--- | :--- | :--- | :--- |
| **Plaintext PostgreSQL Connection String in Public CI** | `1delivery`, `1service`, `1search` | Removed raw Supabase URL and password from `.github/workflows/ci.yml`. Replaced with `${{ secrets.DATABASE_URL }}`. | **Rule 1:** Zero credentials in Git or CI files. Always use GitHub Secrets. |
| **Insecure HMAC Fallback via Public `storeId`** | `1commerce` | Removed `storeId` from `possibleKeys` in `verify1PaySignature`. Endpoint fails closed (401) if no shared secret is configured. | **Rule 2:** Public slugs (`storeId`) must NEVER be used as HMAC keys. |
| **Unauthenticated Courier Payout Settlement & Dispatch** | `1delivery` | Added `isAuthorizedRequest()` middleware verifying Bearer tokens or secret headers (`x-delivery-key`). | **Rule 3:** Financial settlements and dispatch triggers require explicit authentication. |
| **Hardcoded `localhost` in Public Frontends** | `1search`, `1pay` | Replaced developer ports (`:3000`, `:3001`, `:3002`, `:3003`, `:8090`) with canonical subdomains (`*.1group.media`) and protocol-aware API callers. | **Rule 4:** No localhost URLs in production client bundles. |
| **Single-Target Webhook Omission** | `1pay` | Refactored `dispatchWebhookTo1tab` into multi-pillar dispatcher fanning out to `1tab`, `1commerce`, and `1service`. | **Rule 5:** Payment events must reach all consumer pillars. |

---

## 2. The 6 Non-Negotiable Invariants for AI Agents

Every agent operating in `1group` repositories MUST adhere to these 6 rules:

### Invariant 1: Zero Plaintext Secrets in Code or Workflows
- **Never** put database passwords, Supabase Service Role keys, API keys, or private tokens in `.env.example`, `.github/workflows/*.yml`, source code, or commit messages.
- Production and CI workflows must reference `${{ secrets.SECRET_NAME }}` exclusively.

### Invariant 2: Cryptographic Webhook Security (HMAC-SHA256)
- Webhooks between `1pay`, `1commerce`, `1tab`, and `1service` must use HMAC-SHA256 signatures (`X-1Pay-Signature`).
- Secret keys must be loaded from `ONEPAY_WEBHOOK_SECRET` or the merchant's private record.
- **NEVER** use `storeId`, store name, or URL parameters as HMAC secrets. If secret is missing or empty, reject with `401 Unauthorized`.

### Invariant 3: Zero Unauthenticated Financial Mutations
- Endpoints that disburse money, credit wallets, claim bank payments, dispatch couriers, or settle courier earnings must require valid authorization (API token, Bearer JWT, or HMAC signature).
- Never deploy an open POST endpoint that alters ledger state.

### Invariant 4: Canonical Domain Protocol & No Localhost in Production
- Always use canonical production subdomains for cross-service links (see [DOMAINS.md](DOMAINS.md) for full environmental separation and architecture):
  - Landing Portal: `https://1group.media`
  - Payments POS & Downloads: `https://pay.1group.media`
  - Gastro POS: `https://tab.1group.media`
  - WhatsApp Retail: `https://shop.1group.media`
  - Workshop SaaS: `https://service.1group.media`
  - Courier Dispatch: `https://delivery.1group.media`
  - Hyperlocal Radar: `https://search.1group.media`
  - Production APIs & MCP: `https://api.1group.tech` / `https://mcp.1group.tech`
- Never deploy hardcoded `http://localhost:*` or local LAN IPs (e.g. `192.168.*`) in public web applications.

### Invariant 5: Dual-Engine Data Architecture (ADR 0004)
- **Engine 1: Cloud Firestore** is the edge real-time ingestor for Android relay notifications, counter soundbox TTS audio, and sub-second push listeners. Do not remove Firestore from the Android relay.
- **Engine 2: Supabase PostgreSQL** is the canonical enterprise ledger for multi-store billing, cross-pillar joins, and audit queries.
- Payment events must be idempotently replicated (`pay_{bank}_{cleanRef}`).

### Invariant 6: Stateless Multi-Instance Scalability
- Do not store business-critical state (orders, customer wallets, invoices) exclusively in memory (`globalThis`).
- Always persist state transitions to PostgreSQL via Drizzle ORM so services survive serverless container restarts and multi-instance autoscaling.

---

## 3. Pre-Commit Security Checklist for Agents

Before completing any task or proposing changes:
- [ ] Are all `.env` files and credentials excluded from Git?
- [ ] Do any `.github/workflows` files contain raw passwords or tokens?
- [ ] Are all new API endpoints protected by authentication/rate limiting?
- [ ] Are URLs configurable via environment variables with HTTPS production fallbacks?
- [ ] Does `npm run build` or `flutter analyze` pass cleanly?
