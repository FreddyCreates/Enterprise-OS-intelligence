# Threat Operations Playbook (Defense + Offense)

This repository operates with dual posture: **defense and offense**.

## Mission

- **Defense:** protect availability, integrity, and reliability across edge + application surfaces.
- **Offense:** continuously emulate adversaries, expose weaknesses early, and force improvements.

## Core Operating Model

1. **Prevent**: WAF, bot controls, mTLS, schema validation, rate-limiting.
2. **Detect**: anomaly alerts, auth abuse alerts, reconnaissance pattern detection.
3. **Disrupt**: managed challenge/block, temporary emergency controls, attacker cost inflation.
4. **Adapt**: convert attack learnings into permanent controls and better detection logic.

## Offensive Program (Continuous)

### Adversary emulation tracks

- Credential stuffing simulation on `/login` + `/auth/*`.
- API abuse simulation on write and high-cost search/report endpoints.
- Recon simulation (404/403 bursts, endpoint discovery patterns).
- Bot framework simulation with rotating UA and request cadence.
- Layer-7 saturation drills on non-critical paths.

### Required outputs per exercise

- Detection hit/miss report
- Rules that fired (or failed) with timing
- False-positive notes from legitimate traffic checks
- Action items converted into backlog with owner and due date

## Defensive Control Lifecycle

For every repeated offensive finding:

1. Add detection rule (log mode)
2. Validate on controlled traffic
3. Promote to challenge
4. Promote to block where safe
5. Add runbook entry for recurrence handling

## Priority Targets

- Auth and identity surfaces
- Token/session creation paths
- Admin/internal routes
- Cost-heavy API routes
- Integration endpoints and webhooks

## Daily Operations Cadence

- Review top attacking IP/ASN clusters
- Review challenge/block conversion rates
- Review failed auth + recon activity
- Tune false positives for legitimate user traffic

## Weekly Cadence

- Run at least one adversary simulation scenario
- Perform rule quality review (coverage, drift, noise)
- Update DDoS mode thresholds based on latest telemetry

## Monthly Cadence

- Full attack simulation (auth abuse + API abuse + recon + L7 pressure)
- Verify that business-critical user flows remain functional
- Publish improvements and unresolved gaps

## Metrics of Readiness

- Mean time to detect (MTTD)
- Mean time to mitigate (MTTM)
- Challenge-to-block conversion effectiveness
- False-positive rate on critical user journeys
- Percentage of repeated findings permanently mitigated

## Escalation Doctrine

- Enter **Elevated** mode on sustained abuse indicators.
- Enter **Under Attack** mode on origin/user impact or attack persistence.
- De-escalate only after sustained recovery and verification.

Refer to:

- `docs/CLOUDFLARE_EDGE_HARDENING_BLUEPRINT.md`
- `docs/CLOUDFLARE_DDOS_RUNBOOK.md`
