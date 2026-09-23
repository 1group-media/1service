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
