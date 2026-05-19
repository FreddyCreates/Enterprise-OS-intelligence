# Cloudflare DDoS Runbook (Normal / Elevated / Under Attack)

This runbook defines edge posture transitions and operator actions.

## Mode 1 — Normal

- Managed protections enabled
- Challenge passage: **30 minutes**
- Standard bot thresholds and baseline rate limits

### Actions

- Monitor baseline alerts
- Review daily offender IP/ASN list
- Keep emergency rule set pre-staged (disabled)

## Mode 2 — Elevated

Trigger when early attack indicators rise (challenge spikes, auth abuse, recon bursts).

- Reduce challenge passage to **10–15 minutes**
- Tighten bot score thresholds
- Increase strictness on auth and API write routes
- Lower rate-limit thresholds for abuse-prone endpoints

### Actions

- Enable elevated custom WAF policy set
- Increase alert sensitivity
- Start incident channel updates

## Mode 3 — Under Attack

Trigger when sustained abuse impacts origin performance or user path reliability.

- Enable **I’m Under Attack Mode**
- Apply emergency geo/ASN/IP controls
- Freeze or challenge non-essential routes
- Keep business-critical endpoints prioritized

### Actions

- Enable emergency rule pack
- Add temporary deny rules for active hostile sources
- Coordinate with app/on-call for graceful degradation
- Track decision log and revert plan

## Entry Criteria (Examples)

- Auth failure rate above normal baseline for sustained interval
- 404/403 recon bursts from clustered sources
- Significant origin latency/CPU pressure tied to abusive traffic
- Bot score distribution deteriorates across sensitive routes

## Exit Criteria

- Abuse indicators return to baseline for sustained period
- Origin health recovers
- Legitimate user success rates stabilized

### De-escalation order

1. Remove temporary geo/ASN/IP emergency blocks
2. Disable Under Attack Mode
3. Restore elevated thresholds to normal
4. Keep tuned persistent protections that improved posture

## Post-Incident

- Publish timeline + rule effectiveness summary
- Record false-positive impact and tuning changes
- Schedule simulation follow-up within 30 days
