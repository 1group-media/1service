# Mandatory Security Protocol for All Agents
> [!IMPORTANT]
> **READ BEFORE TOUCHING ANY CODE:** Review [SECURITY.md](SECURITY.md) for ecosystem security history and mandatory architectural invariants.
> - **Zero Plaintext Secrets:** Never commit database credentials or keys in code or CI workflows (always use secrets).
> - **Cryptographic HMAC:** Never use public `storeId` as an HMAC key.
> - **Authenticated Mutations:** All payouts, dispatches, and settlements require authorization.
> - **No Localhost in Public Code:** Always use canonical production subdomains (`*.1group.media`).

---

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Operational & Deployment Policy
- **Direct CLI Deployments:** Deployments to production (`onepay-prod-1group`) and staging (`onepay-dev-1group`) are executed directly via `scripts/deploy-prod.sh` and `scripts/deploy-dev.sh` (or `gcloud run deploy` / `firebase deploy`).
- **Zero GitHub Actions Overhead:** GitHub Actions workflows are intentionally disabled (`.github/workflows/*.yml.disabled`) to operate under zero-cost organization limits without requiring paid runner quotas. All build and lint verifications run locally or via agent execution prior to deployment.
- **Declarative Edge & WAF (1infra):** All domain routing, Cloud Armor rate limits, and load balancers are codified in [1infra](../1infra) via OpenTofu. Never edit GCP edge configurations manually in the web console.
