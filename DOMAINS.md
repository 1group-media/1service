# 1group Domain Strategy & DNS Architecture

> **Notice to Autonomous Agents & Engineers:** This document records the architectural rationale, historical context, and security isolation rules governing all domain names across the 1group ecosystem. Always consult this before configuring endpoints, webhooks, CORS, or DNS records.

---

## 1. Domain Hierarchy & Environmental Separation

To prevent cross-environment contamination, protect brand reputation, and isolate public marketing from operational APIs, the ecosystem is partitioned into four distinct domain spaces:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        1group Domain Landscape                         │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
    ┌───────────────────┬───────────┴───────────┬───────────────────┐
    │                   │                       │                   │
┌───▼──────────────┐ ┌──▼──────────────┐ ┌──────▼─────────────┐ ┌───▼──────────────┐
│  1group.media    │ │   1group.tech   │ │    1group.dev      │ │  megafiesta.xyz  │
│  (Brand & Web)   │ │ (Prod APIs/MCP) │ │(Staging/Pre-prod)  │ │ (Chaos/Sandbox)  │
└──────────────────┘ └─────────────────┘ └─────────────────────┘ └──────────────────┘
```

### 1. `1group.media` — Brand, Landing, & Corporate Presence
- **Role:** Canonical public face of the company, product showcase, and legal entity branding.
- **Historic Context:** 1group is officially and legally registered in Venezuela as **1group.media C.A.** Rather than re-registering separate legal entities, `.media` serves as the public umbrella and consumer entry point.
- **Workloads:**
  - Main website (`https://1group.media`) deployed via Firebase Hosting (`.github/workflows/deploy.yml`).
  - Company narrative: *"Operado por 1group · 1 persona y un enjambre de agentes IA"*.
  - Pillar product showcase cards linking to live apps.
  - Official inbound email routing (`contacto@1group.media` / `contact@1group.media`) backed by Google Workspace.

### 2. `1group.tech` — Production APIs, Webhooks, & MCP Backbone
- **Role:** Production engineering backbone, API gateways, Cloud Run microservices, and agent orchestration.
- **Why Separate from `.media`:**
  - **Attack Surface Isolation:** Isolates backend API endpoints, CORS policies, and webhook handlers from the marketing website and public content caches.
  - **Strict CORS & CSP:** APIs hosted on `.tech` enforce explicit machine-to-machine and frontend origin validation without polluting consumer browser cookies.
  - **Model Context Protocol (MCP):** Acts as the canonical host for remote MCP servers (`1command`), Cloud Run dispatchers, and Firestore/PostgreSQL ledger event sync.
- **Workloads:**
  - `api.1group.tech` — Central API gateway for all 6 pillars (`1tab`, `1commerce`, `1service`, `1pay`, `1delivery`, `1command`).
  - `mcp.1group.tech` — Model Context Protocol bridge for AI agents.
  - `webhooks.1group.tech` — Inbound bank and payment verification receiver.

### 3. `1group.dev` — Staging & Pre-Production Testing
- **Role:** Staging, QA, integration testing, and pre-release validation.
- **Why Separate:**
  - **Air-Gapped State:** Mirrors production routing without sharing database state or live ledger credentials.
  - **Safe Automated CI/CD:** Feature branches and pull requests deploy ephemeral preview environments (`pr-123.1group.dev`) or unified staging (`staging.1group.dev`).
  - **Sandbox Payment Testing:** Mock Pago Móvil, simulated Banesco/Mercantil SMS payloads, and test webhooks execute here without triggering real accounting entries or courier dispatches.

### 4. `megafiesta.xyz` — Bogus / Chaos / Adversarial Sandbox
- **Role:** Disposable testbed, external mock service, adversarial simulation, and chaos testing.
- **Historic Context & Thought Process:**
  - Named after the founder's nostalgic first internet handle (`megafiesta@hotmail.com`).
  - **Zero Brand Risk:** Completely detached from the `1group` name and trademark. If test traffic gets blacklisted, flagged by anti-spam heuristics, or subjected to penetration fuzzing, the primary corporate and tech domains remain untarnished.
  - **Adversarial & Phishing Simulation:** Used to test webhook signature validation against spoofed headers, test rate-limiting against rogue callers, and verify that agents reject unauthorized callback URLs.

---

## 2. Infrastructure & DNS Governance

All domains and DNS zones are centrally hosted and managed within Google Cloud Platform (**GCP**):

- **Master GCP Project:** `admin-1group` (Project Number: `1025555791022`).
- **Registrar:** Google Cloud Domains (backed by Squarespace registrar partnership).
- **Authoritative Nameservers:** Google Cloud DNS managed zones (`ns-cloud-e[1-4].googledomains.com`).

| Domain | Cloud DNS Managed Zone | Status | Renewal Period | Registrant Contact |
| :--- | :--- | :--- | :--- | :--- |
| `1group.media` | `onegroup-media` | Active | March 2027 | Squarespace / Google Workspace |
| `1group.tech` | `onegroup-tech` | Active (GCP) | Sept 2027 | `contacto@1group.media` (`REDACTED_CONTACT_DATA`) |
| `1group.dev` | `onegroup-dev` | Pending Quota | Annual ($12 USD) | `contacto@1group.media` |
| `megafiesta.xyz`| `megafiesta-xyz` | Pending Quota | Annual ($12 USD) | `contacto@1group.media` |

### GCP Domain Quota Note
- GCP defaults `DomainRegistrationsPerProject` to 2 per project.
- A quota preference request (`6d6f45c9-9580-4ed2-8305-de1fa3b7bf8b`) to bump this to 10 is active on `admin-1group`.
- Staging domains can alternatively be provisioned under `onepay-dev-1group` if quota reconciliation is delayed.

---

## 3. Email & ICANN Verification Protocol

1. **Inbound Mail Routing:**
   - `onegroup-media` DNS zone contains Google Workspace MX records (`aspmx.l.google.com`, etc.) and SPF record (`v=spf1 include:_spf.google.com ~all`).
   - Inbound aliases: `contacto@1group.media` and `contact@1group.media` deliver to Super Admin `ron@1group.media`.
2. **ICANN Compliance:**
   - Any new domain registered with `contacto@1group.media` receives an ICANN registrant verification email from Squarespace/Google.
   - Operators or agents must ensure the verification link is clicked within 15 days to keep DNS resolution active.

---

## 4. Invariant Rules for Autonomous Agents

1. **Never use `localhost` in production.** All apps must point to their respective canonical subdomains on `1group.tech` (prod) or `1group.dev` (staging).
2. **Never expose test/bogus endpoints on `.media` or `.tech`.** Adversarial or mock tests belong strictly on `megafiesta.xyz` or mock servers.
3. **Never hardcode external IPs.** Always use Cloud DNS managed A/CNAME records.
