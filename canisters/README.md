# ICP Motoko Canisters — ORO Seven-Canister Architecture

**Author:** Alfredo Medina Hernandez  
**Affiliation:** Medina Tech · Chaos Lab · Dallas, Texas  
**Date:** May 2026  
**Governed by:** [Canister Charter](../charters/CANISTER-CHARTER.md) · [Master Charter](../charters/MASTER-CHARTER.md)

---

## Overview

Seven sovereign Motoko canisters for ICP deployment. Each canister owns its own stable memory, upgrade path, and data. No shared state — communication happens through inter-canister calls.

**PYTHON + MOTOKO. OUR INTELLIGENCE IS MAIN.**

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                    ORO ORGANISM (sovereign intelligence)                       │
│                                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│  │ Proposal │  │  Effect  │  │Governance│  │  Agent   │  │    AI    │     │
│  │  Index   │  │  Trace   │  │  Memory  │  │ Findings │  │  Entity  │     │
│  │ (Can. 1) │  │ (Can. 2) │  │ (Can. 3) │  │ (Can. 4) │  │ (Can. 5) │     │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘     │
│                                                                              │
│  ┌─────────────────────────────────┐  ┌─────────────────────────────────┐   │
│  │   Email Service (Can. 6) ✉️     │  │    LLM Bridge (Can. 7) 🧠      │   │
│  │   Native ICP email — full       │  │    ICP LLM = supplementary     │   │
│  │   send/receive/classify/route   │  │    OUR MODELS = MAIN           │   │
│  └─────────────────────────────────┘  └─────────────────────────────────┘   │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │         SOVEREIGN PYTHON INTELLIGENCE (PRIMARY — ALL MODELS)         │   │
│  │                                                                      │   │
│  │  ClassificatorEpistularis · AnalytorSentimentorum                    │   │
│  │  ExtractorEntitatum · GeneratorResponsorum · DetectorMinaciarum      │   │
│  │  OrdinatorPrioritatum · CompressorNarrationum · ValidatorIntentionis │   │
│  │  CognitorAnomaliarum · ArchitectusResponsorum · InterpresLinguarum   │   │
│  │  CuratorMemoriae · ArbiterVeritatis · NavigatorRelationum            │   │
│  │  PraedictorEventuum · CompositorDocumentorum                         │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Architecture: Python + Motoko + ICP LLM

| Layer | Language | Role |
|:------|:---------|:-----|
| Sovereign Intelligence | **Python** | ALL models — primary ML/AI — Latin-named |
| On-Chain Email Service | **Motoko** | Native ICP email — send/receive/store |
| LLM Bridge | **Motoko** | ICP LLM canister integration (supplementary only) |
| Integration | **Python** | Python ↔ ICP canister bridge |

### OUR MODELS ARE MAIN (Full Latin Nomenclature)

| # | Nomen Latinum | Domain | Capability |
|:--|:---|:---|:---|
| 1 | **ClassificatorEpistularis** | CLASSIFICATIO | Email classification — intent, category, urgency |
| 2 | **AnalytorSentimentorum** | SENTIMENTUM | Sentiment analysis — tone, urgency, satisfaction |
| 3 | **ExtractorEntitatum** | EXTRACTIO | Entity extraction — names, dates, amounts, IDs |
| 4 | **GeneratorResponsorum** | GENERATIO | Response generation — contextual reply composition |
| 5 | **DetectorMinaciarum** | DETECTIO | Threat detection — phishing, malware, BEC |
| 6 | **OrdinatorPrioritatum** | ORDINATIO | Priority ordering — triage, urgency, queue |
| 7 | **CompressorNarrationum** | COMPRESSIO | Thread summarization — key points extraction |
| 8 | **ValidatorIntentionis** | VALIDATIO | Intent validation — classification accuracy |
| 9 | **CognitorAnomaliarum** | COGNITIO | Anomaly detection — unusual patterns |
| 10 | **ArchitectusResponsorum** | ARCHITECTURA | Response architecture — multi-part structuring |
| 11 | **InterpresLinguarum** | INTERPRETATIO | Language interpretation — translation |
| 12 | **CuratorMemoriae** | CURATIO | Memory curation — context preservation |
| 13 | **ArbiterVeritatis** | ARBITRATIO | Truth arbitration — fact checking |
| 14 | **NavigatorRelationum** | NAVIGATIO | Relationship navigation — contact graph |
| 15 | **PraedictorEventuum** | PRAEDICTIO | Event prediction — follow-ups, deadlines |
| 16 | **CompositorDocumentorum** | COMPOSITIO | Document composition — formatting, structure |

### ICP LLM Canister (SUPPLEMENTARY ONLY)

The ICP LLM canister (`w36hm-eqaaa-aaaal-qr76a-cai`) is used **only** for:
- Quick supplementary inference when sovereign models are at capacity
- Cross-validation of classification results
- Lightweight tasks that don't need full model power

**Our sovereign models are ALWAYS primary authority.**

## Canisters

### Canister 1 — ProposalIndex.mo

Source of truth for all governance proposals (NNS, SNS, Internal).

| Method | Type | Description |
|:---|:---|:---|
| `getProposal(id)` | query | Get proposal by ID |
| `listProposals(filter)` | query | List with status/topic/source filters |
| `countProposals()` | query | Total count |
| `getProposalsByStatus(status)` | query | Filter by status string |
| `getProposalsBySNS(rootCanisterId)` | query | Filter by SNS root |
| `ingestProposal(input)` | update | Ingest new proposal → returns ID |
| `refreshProposalStatus(id)` | update | Refresh from source |
| `updateProposalExecution(id, result)` | update | Record execution outcome |

### Canister 2 — EffectTrace.mo

Primary intelligence store with ANTE/MEDIUS/POST chronological states.

| Method | Type | Description |
|:---|:---|:---|
| `getTrace(id)` | query | Get full trace record |
| `getTraceByProposal(proposalId)` | query | Lookup by proposal |
| `listTraces(filter)` | query | List with risk/truth/proposal filters |
| `getRevisionHistory(traceId)` | query | Append-only revision log |
| `getAnteState(traceId)` | query | Pre-execution state |
| `getMediusState(traceId)` | query | Execution state |
| `getPostState(traceId)` | query | Post-execution state |
| `createTrace(input)` | update | Create new trace |
| `updateTrace(id, patch)` | update | Patch fields (creates revision) |
| `publishTrace(id)` | update | Draft → Published |
| `lockAnteState(traceId, state)` | update | Write-once ANTE lock |
| `anchorMediusState(traceId, state)` | update | Write-once MEDIUS anchor |
| `writePostState(traceId, state, evidence)` | update | Requires MEDIUS exists |

### Canister 3 — GovernanceMemory.mo

Stigmergic pheromone field and precedent graph.

| Method | Type | Description |
|:---|:---|:---|
| `getGovernanceMemory(proposalId)` | query | Memory summary for proposal |
| `findRelatedProposals(proposalId)` | query | Precedent-linked proposals |
| `getFieldIntensity(targetId, method)` | query | Pheromone intensity |
| `getFieldSnapshot()` | query | Full field state |
| `getPrecedentGraph(proposalId, depth)` | query | BFS traversal to depth |
| `linkProposals(input)` | update | Create directional precedent link |
| `depositToField(targetId, method, weight)` | update | Add pheromone |
| `tickField()` | update | Evaporation cycle (60s minimum) |
| `addPostExecutionCheck(input)` | update | 2× weight if verified |
| `recordPatternDetection(pattern)` | update | Track repeated risks |

### Canister 4 — AgentFindings.mo

Structured output for ARCHON, VECTOR, LUMEN, FORGE agents.

| Method | Type | Description |
|:---|:---|:---|
| `getFindingsByProposal(proposalId)` | query | All findings for a proposal |
| `getFinding(id)` | query | Single finding by ID |
| `getDisputeHistory(findingId)` | query | Dispute chain |
| `countCriticalFindings()` | query | Unresolved critical count |
| `submitFinding(input)` | update | Submit new finding |
| `reviewFinding(id, decision)` | update | Confirm/supersede |
| `disputeFinding(id, dispute)` | update | Dispute (original preserved) |
| `resolveDispute(disputeId, resolution)` | update | Resolve dispute |

### Canister 5 — AIEntity.mo

On-chain AI workforce — Motoko version of the internal AI entities.

| Method | Type | Description |
|:---|:---|:---|
| `getEntity(id)` | query | Get entity record |
| `listEntities(filter)` | query | Filter by dept/tier/status |
| `countByDepartment()` | query | Entity count per department |
| `countEntities()` | query | Total workforce size |
| `getEntityMemory(entityId)` | query | Entity's memory store |
| `getEntityTasks(entityId)` | query | Entity's task queue |
| `getTotalHeartbeats()` | query | Cumulative heartbeats |
| `getWorkforceStatus()` | query | Aggregate workforce metrics |
| `birthEntity(input)` | update | Create entity (born alive) |
| `heartbeat(entityId)` | update | Record φ-based heartbeat |
| `storeMemory(entityId, key, value, cat, importance)` | update | Persist memory entry |
| `assignTask(entityId, description, priority)` | update | Queue task |
| `completeTask(entityId, taskId, result)` | update | Mark task done |
| `updateStatus(entityId, status)` | update | Change entity status |
| `terminateEntity(entityId)` | update | Terminate (record preserved) |

### Canister 6 — EmailService.mo ✉️ NEW

Native ICP email service — emails sent FROM canisters. Full on-chain email.

| Method | Type | Description |
|:---|:---|:---|
| `getEmail(id)` | query | Get email by ID |
| `getInbox(identity)` | query | Get inbox for an organ identity |
| `getOutbox(identity)` | query | Get outbox for an organ identity |
| `getThread(threadId)` | query | Get full email thread |
| `searchEmails(query)` | query | Full-text search |
| `listEmails(filter)` | query | Filter by identity/direction/status/class |
| `getStats()` | query | Email service statistics |
| `getIdentities()` | query | List all organ email identities |
| `getSchedule()` | query | Get scheduled emails |
| `compose(input)` | update | Compose and queue email |
| `receive(rawEmail)` | update | Ingest inbound email |
| `send(emailId)` | update | Send queued email via HTTPS outcall |
| `classify(emailId)` | update | AI-classify email (on-chain) |
| `route(emailId)` | update | Route to correct organ |
| `markRead(emailId)` | update | Mark email as read |
| `archive(emailId)` | update | Archive email |
| `bulkSend(emails)` | update | Batch compose multiple emails |
| `scheduleEmail(emailId, sendAt)` | update | Schedule for future delivery |

### Canister 7 — LLMBridge.mo 🧠 NEW

ICP LLM canister bridge — supplementary inference only. Our models are MAIN.

| Method | Type | Description |
|:---|:---|:---|
| `getStats()` | query | Bridge statistics |
| `getSovereignModels()` | query | List all 16 sovereign model registrations |
| `getModelByLatinName(name)` | query | Lookup model by Latin name |
| `getResponseHistory(limit)` | query | Recent inference responses |
| `inferSovereign(request)` | update | Primary inference via sovereign model |
| `inferICPLLM(request)` | update | Supplementary inference via ICP LLM |
| `crossValidate(request)` | update | Run both + compare results |

## Shared Types — Types.mo

All type definitions live in `src/Types.mo`. No canister redefines types locally. Categories:

- **Proposal types** — ProposalRecord, ProposalInput, ProposalFilter, etc.
- **Trace types** — EffectTraceRecord, ChronoState, RevisionRecord, etc.
- **Memory types** — GovernanceMemory, PrecedentGraph, FieldTickResult, etc.
- **Finding types** — AgentFinding, DisputeRecord, ReviewDecision, etc.
- **Entity types** — AIEntityRecord, EntityTier, HeartConfig, BrainConfig, etc.

## Deployment

```bash
# Install dfx
sh -ci "$(curl -fsSL https://internetcomputer.org/install.sh)"

# Start local replica
cd canisters
dfx start --background

# Deploy all seven canisters
dfx deploy

# Or deploy individually
dfx deploy proposal_index
dfx deploy effect_trace
dfx deploy governance_memory
dfx deploy agent_findings
dfx deploy ai_entity
dfx deploy email_service
dfx deploy llm_bridge
```

## Python Integration

```bash
# Install Python dependencies
cd python/intelligence
pip install -r requirements.txt

# Use the sovereign intelligence
python -c "
from sovereign_models import SovereignModelRegistry
registry = SovereignModelRegistry()
print(registry.full_registry_report())
"

# Process email with full pipeline
python -c "
from email_intelligence import EmailIntelligenceEngine
engine = EmailIntelligenceEngine()
result = engine.process_email(
    subject='Urgent: Security Alert',
    body='Potential breach detected in sector 7',
    from_addr='nova@medinatechlabs.net',
    to_addr='organism@medinatechlabs.net'
)
print(result)
"

# Deploy via Python integration
python -c "
from icp_integration import deploy_all_canisters
deploy_all_canisters('local')
"
```

## Testing (via dfx canister call)

```bash
# Ingest a proposal
dfx canister call proposal_index ingestProposal '(record { source = variant { NNS }; title = "Test Proposal"; summary = "Test summary"; topic = "governance"; rootCanisterId = null })'

# Birth an AI entity
dfx canister call ai_entity birthEntity '(record { name = "ARCHON-1"; role = "analyzer"; department = "Engineering"; tier = variant { Specialist }; heartConfig = record { numHearts = 3; baseIntervalNs = 618_033_988; phiMultiplier = 1.618 }; brainConfig = record { numBrains = 3; baseIntervalNs = 1_000_000_000; thinkingModel = "fibonacci" } })'

# Check workforce status
dfx canister call ai_entity getWorkforceStatus

# ── Email Service Testing ──

# Compose an email
dfx canister call email_service compose '(record { to = "client@example.com"; subject = "Intelligence Report"; body = "Your threat assessment is ready."; html_body = null; identity = "intel@medinatechlabs.net"; priority = variant { high }; thread_id = null; reply_to = null })'

# Receive an inbound email
dfx canister call email_service receive '(record { from_address = "external@company.com"; to_address = "organism@medinatechlabs.net"; subject = "Urgent: System Alert"; body = "Critical failure detected in production."; html_body = null; headers = vec {}; raw_size = 150 })'

# Classify an email
dfx canister call email_service classify '(1)'

# Route an email
dfx canister call email_service route '(1)'

# Get inbox
dfx canister call email_service getInbox '("organism@medinatechlabs.net")'

# Get stats
dfx canister call email_service getStats

# Get all identities
dfx canister call email_service getIdentities

# ── LLM Bridge Testing ──

# Sovereign inference (OUR MODELS — MAIN)
dfx canister call llm_bridge inferSovereign '(record { prompt = "Classify this email as threat or benign"; max_tokens = 100; task_type = variant { #spam_scoring }; model_hint = null })'

# Get sovereign model registry
dfx canister call llm_bridge getSovereignModels

# Lookup by Latin name
dfx canister call llm_bridge getModelByLatinName '("DetectorMinaciarum")'

# Cross-validate (sovereign + ICP LLM)
dfx canister call llm_bridge crossValidate '(record { prompt = "Is this email spam?"; max_tokens = 50; task_type = variant { #cross_validation }; model_hint = null })'

# Get bridge stats
dfx canister call llm_bridge getStats
```

## Upgrade Discipline

- Each canister has independent upgrade path
- `preupgrade` serializes runtime state to stable variables
- `postupgrade` rebuilds runtime state from stable variables
- Schema version tracked per canister (`_schemaVersion`)
- WASM hash recorded in CHRONO on every upgrade

---

*ICP Motoko Canisters · Medina Tech · Chaos Lab · Dallas, Texas · April 2026*  
*TRACE · VERIFY · REMEMBER*
