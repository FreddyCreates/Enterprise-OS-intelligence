# Cloudflare Edge Hardening Blueprint (Production)

This blueprint operationalizes the Cloudflare hardening plan for this repository's edge workloads.

## 0) Critical Secrets Hygiene (Do First)

- Never paste `CLOUDFLARE_API_TOKEN` in chat, issue comments, PRs, or logs.
- Rotate any exposed token immediately.
- Use separate tokens per environment (`prod`, `stage`, `dev`) with least privilege.
- Prefer short-lived scoped tokens and owner-verified rotation cadence.

### Recommended token scopes

- **Workers deploy token:** Workers Scripts:Edit, Account settings read only as required.
- **Edge security token:** Zone WAF/Rulesets/Rate Limiting edit for target zone only.
- **Read-only ops token:** Zone analytics/logs read for dashboards and alerting only.

## 1) Baseline Bot Posture (Production Zones)

Set these controls in Cloudflare dashboard for production zones:

- `Block AI Bots`: **ON**
- `Bot Fight Mode`: **ON**
- `JS Detections`: **ON**
- `Browser Integrity Check`: **ON**
- `AI Labyrinth`: **ON** (deception layer only; not primary enforcement)

## 2) Edge Policy by Surface (WAF / Custom Rules)

Apply rules in this order (higher first):

1. **Admin/internal strict deny**
   - Paths: `/admin/*`, `/internal/*`
   - Action: `block` unless trusted source (`ip.src in $trusted_admin_ips`) or mTLS-authenticated.

2. **Auth surface strict challenge**
   - Paths: `/login`, `/auth/*`, `/oauth/*`
   - Action: `managed_challenge` for suspicious automation and high-risk scores.

3. **API write hardening**
   - Methods: `POST`, `PUT`, `PATCH`, `DELETE`
   - Action: stricter bot/anomaly controls than read traffic.

4. **Public page protection**
   - Action: allow normal browsers, challenge suspicious automation.

### Example expression patterns

```txt
# Auth endpoints
(http.request.uri.path eq "/login" or
 starts_with(http.request.uri.path, "/auth/") or
 starts_with(http.request.uri.path, "/oauth/"))

# Admin/internal
(starts_with(http.request.uri.path, "/admin/") or
 starts_with(http.request.uri.path, "/internal/"))

# API writes
(starts_with(http.request.uri.path, "/api/") and
 http.request.method in {"POST" "PUT" "PATCH" "DELETE"})
```

## 3) Rate Limiting (Separate Buckets Required)

Configure independent rules for:

- Login/password reset attempts
- Token/session creation endpoints
- Expensive search/report APIs
- 404/403 burst patterns (recon activity)

Use escalating actions per rule:

1. threshold-1: `log`
2. threshold-2: `managed_challenge`
3. threshold-3: `block`

## 4) Schema Validation Rollout (API Shield)

For high-risk APIs first:

1. Register JSON schemas for request payloads.
2. Start in monitor/log mode (short validation window).
3. Promote to block mode for non-compliant payloads once false positives are addressed.

Recommended initial scope:

- `/api/auth/*`
- `/api/session/*`
- `/api/token/*`
- `/api/search/*`
- `/api/report/*`

## 5) mTLS for Sensitive Paths

- Require mTLS for:
  - `/admin/*`
  - `/internal/*`
  - service-to-service API routes
- Keep public customer traffic on normal TLS.
- Enforce certificate rotation and revocation process with named owner.

## 6) Access & Trust Controls

- Maintain allowlist for trusted office/VPN/service IPs.
- Add deny policies for known hostile IP/ASN intel.
- Block known malicious automation UAs.
- Keep `robots.txt` AI directives as advisory only.

## 7) Monitoring & Alerting

Alert on:

- challenge-rate spikes
- bot score degradation
- auth failure spikes
- 4xx/5xx bursts
- origin CPU/latency stress

Operational checks:

- Log rule matches with action + path + source metadata.
- Review top offending IPs/ASNs daily during hardening period.

## 8) Validation Drills

- Controlled bot simulation against auth/API/admin routes.
- Confirm legitimate user paths still succeed.
- Monthly attack simulation and threshold tuning.

## 9) Minimum Implementation Checklist

- [ ] Production zone baseline toggles enabled
- [ ] Surface-based WAF rules deployed in ordered priority
- [ ] Multi-stage rate limits in place
- [ ] Schema validation configured for high-risk routes
- [ ] mTLS enforced for admin/internal/S2S
- [ ] DDoS runbook adopted (see `docs/CLOUDFLARE_DDOS_RUNBOOK.md`)
- [ ] Monitoring alerts wired and tested
- [ ] Validation drills executed and documented
