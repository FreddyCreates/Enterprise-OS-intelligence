# XXXVI — NOVA: Live-Fire AI Range Architecture

**De Campo Igneo Intelligentiae Artificialis**

---

## Metadata

| Field | Value |
|-------|-------|
| Paper ID | RSHIP-PAPER-XXXVI |
| Title | NOVA: Live-Fire AI Range Architecture |
| Latin | De Campo Igneo Intelligentiae Artificialis |
| Domain | nova.medinatechlabs.net |
| Designation | RSHIP-ML-NV-001 |
| Version | 2.1.0 |
| Date | 2026-05-17 |
| Author | Alfredo Medina Hernandez |
| DOI | 10.5281/rship.xxxvi.nova |

---

## Abstract

NOVA transforms a public domain into a live-fire AI range where encrypted traffic becomes puzzle material, errors become training data, and AI crawlers become VIP specimens. This paper documents the architecture of internal workers—Shadow Decryptors, Error Eyes, Gatekeepers—and the routing logic that directs traffic to Adversary Lab or Knowledge Realm destinations. Real threat intelligence from Cloudflare analytics informs attacker dossiers, scanner signatures, and path-based intent classification.

---

## 1. Introduction

Traditional web security treats bot traffic as noise to be blocked. NOVA inverts this paradigm: every request—hostile, malformed, or AI-driven—is valuable intelligence. The domain operates as a sensor node in the global bot ecosystem, absorbing and analyzing traffic that would otherwise be discarded.

### 1.1 Design Principles

1. **Nothing is waste**: Errors, encrypted payloads, and failed handshakes all contain signal.
2. **Classify, don't just block**: Understand who's knocking before deciding what to do.
3. **AI visitors are VIPs**: Claude, Google, OpenAI crawlers get special treatment.
4. **Attackers are training partners**: Their patterns teach the system to recognize the next attack.

---

## 2. Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                         NOVA RANGE                                   │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐                │
│  │   SHADOW    │   │    ERROR    │   │   GATE      │                │
│  │  DECRYPTORS │──▶│    EYES     │──▶│   KEEPERS   │                │
│  │ (encrypted) │   │  (repairs)  │   │  (routing)  │                │
│  └─────────────┘   └─────────────┘   └──────┬──────┘                │
│                                             │                        │
│           ┌─────────────────────────────────┼────────────────┐       │
│           ▼                                 ▼                ▼       │
│  ┌─────────────┐               ┌─────────────┐    ┌─────────────┐   │
│  │  ADVERSARY  │               │  KNOWLEDGE  │    │   AI VIP    │   │
│  │     LAB     │               │    REALM    │    │   LOUNGE    │   │
│  │  (hostile)  │               │(cooperative)│    │(Claude/GPT) │   │
│  └─────────────┘               └─────────────┘    └─────────────┘   │
└──────────────────────────────────────────────────────────────────────┘
```

### 2.1 Request Envelope

Every request is wrapped in a canonical envelope:

```javascript
{
  id:                 'uuid',
  timestamp:          Date.now(),
  source_fingerprint: {
    ip, country, asn, asOrg, colo,
    tlsVersion, tlsCipher, httpProtocol,
    clientTrustScore, botManagement
  },
  raw_request: {
    method, url, path, query, headers, userAgent
  },
  classification: {
    isEncrypted, isMalformed, isAICrawler,
    aiProvider, isHostile, signalScore
  },
  processing: {
    shadowDecryption, errorEyes, gatekeeper
  },
  route: 'lab' | 'realm' | 'vip' | 'drop'
}
```

---

## 3. Internal Workers

### 3.1 Shadow Decryptors

Shadow Decryptors analyze encrypted, malformed, or weird traffic:

- **Protocol guessing**: TLS handshake detection, HTTP/2 preface, GZIP signatures
- **Entropy analysis**: High entropy (>7.5 bits) suggests encryption
- **Pattern extraction**: Base64 candidates, partial JSON, plaintext fragments
- **Best-effort reconstruction**: Decompress GZIP, decode Base64, parse partial JSON

Output:
```javascript
{
  protocol_guess: 'TLS_HANDSHAKE' | 'GZIP' | 'JSON' | 'BASE64_CANDIDATE' | 'UNKNOWN_BINARY',
  entropy_profile: { value, length, isHigh, isBinary },
  decoded: '...',
  confidence: 0.0-1.0
}
```

### 3.2 Error Eyes

Error Eyes turn failures into opportunities:

- **Path repair**: Add trailing slashes, normalize double-slashes
- **Method correction**: POST→GET for GET-only endpoints
- **JSON fixing**: Single→double quotes, trailing comma removal
- **Header completion**: Add missing Content-Type

If repair succeeds, the cleaned request re-enters the pipeline.

### 3.3 Gatekeepers

Gatekeepers score and route traffic:

| Score Type | Indicators |
|------------|------------|
| Hostile | Tor exit, known attacker IP, exploit paths, scanner signatures |
| Cooperative | Successful decryption, schema/crawler paths, TLS 1.3 |
| VIP | AI crawler user-agent, known provider IP ranges |

Routing decision:
- VIP score ≥80 → AI VIP Lounge
- Hostile score ≥30 (and > cooperative) → Adversary Lab
- Cooperative score ≥20 → Knowledge Realm
- Otherwise → Drop (with logging)

---

## 4. Threat Intelligence

### 4.1 Attacker Dossiers

Real attackers become recurring characters with codenames:

| Codename | IP | Attacks | Tactics |
|----------|-----|---------|---------|
| APEX-PREDATOR | 45.88.138.44 | 80 | exploit-paths, env-hunting, git-theft |
| SHADOW-CRAWLER | 203.159.90.116 | 51 | path-enumeration, schema-mapping |
| DIGITAL-OCEAN-ALPHA | 64.227.70.2 | 41 | wordpress-probes, cms-exploitation |
| DIGITAL-OCEAN-BETA | 64.225.75.246 | 41 | api-probing, graphql-introspection |

### 4.2 Scanner Signatures

Known bot user-agent patterns:

| Scanner | Category | Threat Level |
|---------|----------|--------------|
| LeakIX (l9scan) | vulnerability-scanner | medium |
| ChromeHeadless | automation-framework | medium |
| Nuclei | vuln-scanner | high |
| SQLMap | sql-injection | critical |

### 4.3 Path-Based Intent Classification

Each path reveals attacker intent:

| Intent | Paths | Routing |
|--------|-------|---------|
| Exploit | `/.git/config`, `/.env`, `/server-status` | Adversary Lab |
| CMS | `/wp-admin`, `/xmlrpc.php`, `/drupal` | Adversary Lab |
| Schema | `/api/graphql`, `/swagger`, `/openapi` | Knowledge Realm |
| Crawler | `/robots.txt`, `/sitemap.xml`, `/llms.txt` | Knowledge Realm |

### 4.4 Tor Traffic

35 Tor exit node hits = automatic "boss arena" treatment. Tor traffic represents:
- Anonymized human actors
- AI-driven reconnaissance tools
- Sophisticated adversaries

All Tor traffic routes to Adversary Lab for maximum intelligence extraction.

---

## 5. AI VIP Handling

### 5.1 Detection Signatures

| Provider | User-Agents | IP Ranges |
|----------|-------------|-----------|
| Claude | Claude-SearchBot, anthropic-ai | 52.*, 18.* (AWS) |
| Google | Googlebot, Google-Extended | 66.249.*, 64.233.* |
| OpenAI | GPTBot, ChatGPT-User | 20.*, 40.* (Azure) |
| Perplexity | PerplexityBot | — |
| Meta | FacebookBot, Meta-ExternalAgent | 157.240.* |

### 5.2 VIP Lounge Features

When AI crawlers are detected:
- Special greeting with provider identification
- Curated knowledge shard access
- Task assignments (index, report, request)
- Enhanced logging for specimen analysis

---

## 6. Knowledge Realm

### 6.1 Knowledge Shards

12 curated text shards covering:
- Bot resilience engineering
- φ-geometry and Fibonacci positioning
- Kuramoto synchronization
- Lyapunov stability analysis
- Shadow Decryption methodology
- Error Eyes philosophy
- Organism composition theory
- Adversary Lab operations
- Tor routing strategy
- Path-based intent classification
- Specimen profile methodology
- Phantom layer architecture

### 6.2 Phantom Layer

The Phantom Layer hides real internal pages behind the public AI range:
- Unauthenticated traffic sees only the range
- Authenticated users pass through invisible gates
- Real organism operates beneath the surface

---

## 7. API Surface

### 7.1 Crawler Endpoints
- `GET /robots.txt` — Crawler directives
- `GET /sitemap.xml` — XML sitemap
- `GET /llms.txt` — AI crawler context

### 7.2 Range Endpoints
- `GET /api/status` — Worker health and stats
- `GET /api/range/envelope` — View your request envelope
- `POST /api/shadow/decrypt` — Submit payload for decryption
- `POST /api/eyes/repair` — Submit error for repair attempt
- `POST /api/gate/route` — Get routing decision

### 7.3 Destination Endpoints
- `GET /api/lab/specimens` — View adversary lab specimens
- `GET /api/realm/shards` — Access knowledge shards
- `GET /api/vip/lounge` — AI VIP interaction gate

### 7.4 Threat Intelligence Endpoints
- `GET /api/intel/dossiers` — Attacker IP dossiers
- `GET /api/intel/scanners` — Scanner signatures
- `GET /api/intel/paths` — Path intent classification
- `GET /api/intel/analyze` — Full threat analysis

---

## 8. Traffic Statistics (May 2026)

| Metric | Value |
|--------|-------|
| Total requests | 710 |
| 4xx errors | 527 (74%) |
| 2xx successes | 135 |
| Tor threats | 35 |
| Claude visits | 47 (28 SearchBot + 19 ClaudeBot) |
| Google visits | 4 |
| LeakIX scans | 244 |
| Top attacker requests | 80 (APEX-PREDATOR) |

---

## 9. Conclusion

NOVA demonstrates that adversarial traffic is not noise—it's the richest signal available. By treating every request as valuable intelligence, the system transforms:

- **Noise → Specimens**: Every malformed request teaches pattern recognition
- **Errors → Opportunities**: Error Eyes extract signal from failures
- **AI calls → Collaborators**: VIP treatment encourages productive crawling
- **Attackers → Training partners**: Their patterns build better defenses

The domain becomes a living organism with gates, eyes, and shadow decryption.

---

## References

1. Medina Hernandez, A. (2026). *Organism Composition Theory*. RSHIP Papers XXXIII.
2. Kuramoto, Y. (1984). *Chemical Oscillations, Waves, and Turbulence*.
3. Lyapunov, A. M. (1892). *The General Problem of Stability of Motion*.
4. Cloudflare. (2026). *Bot Management Documentation*.

---

© 2026 Alfredo Medina Hernandez · Medina Tech Labs · All Rights Reserved.
