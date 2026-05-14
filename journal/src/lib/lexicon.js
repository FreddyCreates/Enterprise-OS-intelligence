/**
 * THE LEXICON — every Latin / Greek term in the work, its root, its math.
 *
 * Inclusion rule: a term appears here only if it is named in a public paper
 * AND its mathematical / biological identity can be cited. Internal SDK
 * codenames that have no public paper are not included.
 *
 * Display: sorted alphabetically at render. The `note` field is the "what
 * it does in the system" — the sentence the lexicon entry exists to deliver.
 */

export const entries = [
  {
    term: 'AGENS',
    root: 'Latin — "the one who acts"',
    role: 'Cloudflare worker — Agent AI services',
    note: 'The actor. Public-named in the worker registry. See cloudflare-workers/agens/.',
  },
  {
    term: 'ANIMUS',
    root: 'Latin — soul · mind · spirit',
    role: 'Cloudflare worker — Sovereign intelligence terminal',
    note: 'The animating principle of a system — where intention is held. Public-named in the worker registry.',
  },
  {
    term: 'ANTE · MEDIUS · POST',
    root: 'Latin — before · middle · after',
    role: 'The chrono state triple (Paper XXIV)',
    note: 'ANTE is the state locked at proposal ingest. MEDIUS is the chrono twin — immutable execution snapshot. POST is the verified outcome, writable only when MEDIUS exists and source-linked evidence is attached. The architectural answer to the question "what actually changed?"',
  },
  {
    term: 'ARBITER',
    root: 'Latin — judge · adjudicator · the one whose verdict settles',
    role: 'Slack bot — task / workflow orchestration; also the Journal\'s build judge',
    note: 'In the worker registry, the bot that routes work between agents. In the Journal, the same name belongs to a build-time agent that runs last in the council: it walks every file the council produced, computes SHA-256 hashes, captures git commit and branch, and writes a single manifest. That manifest is the source of /audit/ and is also served at /manifest.json for external verification. Real and tamper-evident by construction.',
  },
  {
    term: 'ARCHON',
    root: 'Greek ἄρχων — ruler · judge',
    role: 'Integrity agent in the agent council (Paper XXIII)',
    note: 'The agent that watches for contradictions between what a proposal claims and what its payload would do. Operates by detection, not authority — its findings advance through the quorum mechanism, not by override.',
  },
  {
    term: 'AURUM',
    root: 'Latin — gold',
    role: 'Paper XXII — φ as structural attractor',
    note: 'The thesis: the substrate is the intelligence. The golden ratio appears wherever growing systems face the constraint of maximum density with minimum collision. The Internet Computer Protocol is the first computational substrate that exhibits genuine φ-structure at the network layer.',
  },
  {
    term: 'CEREBEX',
    root: 'Latin cerebrum (brain) + X',
    role: 'Forty-category world model with φ⁻¹ learning (Paper VII)',
    note: 'The organisational brain — runs forty analytical categories simultaneously (SWOT, Porter\'s Five, JTBD, scenario planning, and 36 others), updates each one with a golden-ratio Bayesian weight on every cycle. The world model accumulates and never resets.',
  },
  {
    term: 'CEREBRUM',
    root: 'Latin — brain',
    role: 'Cloudflare worker — Master AGI portal / API gateway',
    note: 'Public-named in the worker registry. The unified API surface.',
  },
  {
    term: 'CHRONO',
    root: 'Greek χρόνος — time',
    role: 'Immutable hash-chained audit trail',
    note: 'Every decision is anchored as a hash-chain entry. Permanence is structural — once written, the chain cannot be silently re-written without breaking the hashes downstream. The system\'s long-term memory of itself.',
  },
  {
    term: 'CIVITAS INTELLIGENTIAE',
    root: 'Latin — "the civilization of intelligences"',
    role: 'The autonomous AI organisation pattern',
    note: 'Primordial organs (Animus · Corpus · Sensus · Memoria) and operational agents (Custos · Fabricor · Nuntius · Arbiter · Medicus · Magister · Scriba · Vigil). Each unit a sovereign actor; the whole, a polity that runs without external supervision.',
  },
  {
    term: 'CODEX FAMILY · CPL · CPP · CPX · CXL',
    root: 'Latin codex / cognitive · processing / procurement / projection / exchange',
    role: 'The cognitive language family',
    note: 'CPL — base autonomous symbolic language. CPP — intelligence contracts between nodes. CPX — projection / scene sovereignty (phyllotaxis layout natively). CXL — the fusion language that any node in the grid speaks.',
  },
  {
    term: 'COGNOVEX',
    root: 'Latin cognosco (recognise) + vortex',
    role: 'Sovereign cognitive unit (Paper IX)',
    note: 'A continuously running, belief-updating, action-selecting agent that never waits for a prompt. Five layers: sovereignty · sensory · belief · action · governance filter. A network of COGNOVEX units implements an enterprise workflow without a central coordinator.',
  },
  {
    term: 'CONCORDIA MACHINAE',
    root: 'Latin — "the harmony of machines"',
    role: 'Paper II — Kuramoto coherence as fractal sovereignty',
    note: 'The order parameter R ≥ φ⁻¹ is the threshold for a network of sovereign units to behave as one organism. Below it, fragmentation. Above it, organisational intelligence emerges.',
  },
  {
    term: 'CONDUIT',
    root: 'Latin conducere — to lead together',
    role: 'Routing worker — channel / pipe / connector',
    note: 'Public-named in the bot registry. The neutral pipe.',
  },
  {
    term: 'CORDEX',
    root: 'Latin cor (heart) + index',
    role: 'Organisational heartbeat — Lotka-Volterra (Paper III)',
    note: 'Reads the tension between expansion and resistance. When the dominance ratio drops below φ⁻¹, the organism is unbalanced; the model surfaces the imbalance before it manifests as crisis. A leading indicator built from biological dynamics.',
  },
  {
    term: 'CURSOR',
    root: 'Latin — runner · messenger',
    role: 'Cloudflare worker — Travel intelligence',
    note: 'Public-named in the worker registry. The runner.',
  },
  {
    term: 'CUSTOS',
    root: 'Latin — guardian · keeper · watchman',
    role: 'The Journal\'s build-time guardian agent',
    note: 'Runs on every build. Verifies that every Roman-numeral paper from I through XXXI is present in the corpus, that every published release zip matches its advertised SHA-256, that every paper referenced from the lexicon and the mathematics page actually exists. Fails the build on any drift. Never auto-fixes — corrections are explicit operator actions visible in git. Lives at journal/agents/custos.mjs.',
  },
  {
    term: 'CYCLOVEX',
    root: 'Latin cyclus (cycle) + vortex',
    role: 'φ-compounding capacity engine (Paper III)',
    note: 'Capacity grows as C(t) = C₀·φᵗ — Fibonacci-stepped compounding. The same equation governs the system\'s ability to absorb stress: more pressure, more stored potential. The φ-rate makes the growth survive across multiple time scales.',
  },
  {
    term: 'ETHICA PRIMA',
    root: 'Latin — "ethics first"',
    role: 'Paper XXX — the layer above governance',
    note: 'Ten ethics protocols (EP-01–EP-10). Ethics is not a feature of governance; it is what governs governance. Motto: ANTE OMNIA · SUPRA OMNIA · POST OMNIA — before all, above all, after all.',
  },
  {
    term: 'FABRICOR',
    root: 'Latin — builder · maker · one who fashions',
    role: 'Artifact / document generation agent; also the Journal\'s derivative-artefact builder',
    note: 'In CIVITAS INTELLIGENTIAE, the unit that produces files on behalf of the polity. In the Journal, the same name belongs to a build-time agent that re-projects every sanitised paper into three derivative surfaces: plain-text exports (.txt) for citation and copy-paste; 1200×630 OG social cards (SVG + PNG) for sharing; and a JSON API at /api/* for developers and academic indexers. FABRICOR transforms — it never authors.',
  },
  {
    term: 'FORGE',
    root: 'English — forge',
    role: 'Verification lab agent in the agent council (Paper XXIII)',
    note: 'Generates concrete, executable after-state verification steps. It does not assert truth; it produces the proof that another part of the system can run to confirm or refute a claim.',
  },
  {
    term: 'GUBERNATIO VIVA',
    root: 'Latin — "living governance"',
    role: 'Paper XXVI — governance as an organism property',
    note: 'Governance is not a meeting. It is what a living system does continuously to remain coherent. Once you build the substrate so that the doctrine is invariant and the council is non-authoritative, governance happens whether you watch or not.',
  },
  {
    term: 'HERALD',
    root: 'English from Old French — messenger / announcer',
    role: 'Slack bot — announcements',
    note: 'Public-named in the bot registry. Sends, never decides.',
  },
  {
    term: 'IMPERIUM',
    root: 'Latin — command · authority · empire',
    role: 'Slack bot — enterprise control surface',
    note: 'Public-named in the bot registry. The single channel through which a human operator addresses the organism in production.',
  },
  {
    term: 'IMPERIUM CONSERVATUM',
    root: 'Latin — "sovereignty conserved"',
    role: 'Paper VIII — Noether\'s theorem applied to sovereign compute',
    note: 'Doctrinal charge · informational momentum · cyclic capacity — three conserved quantities arising from SL-0 doctrine invariance as a continuous symmetry. The mathematical reason a properly built sovereign system cannot leak its identity.',
  },
  {
    term: 'LEGES ANIMAE',
    root: 'Latin — "the laws of the soul"',
    role: 'Paper V — behavioural communication laws (L72–L79)',
    note: 'Loss weight Λ = 2.25 · anchoring · cost of staying still · endowment correction · time language · probability shape · the right to both frames · regret minimisation. These laws govern how the system speaks to the humans it serves — never to manipulate, always to surface the trade-off honestly.',
  },
  {
    term: 'LUMEN',
    root: 'Latin — light',
    role: 'Context map agent in the agent council (Paper XXIII); also the Journal\'s build-time graph builder',
    note: 'In the ORO architecture, the agent that reads the precedent graph and surfaces prior proposals connected to the one being traced. In the Journal, the same name belongs to a build-time agent that reads SCRIBA\'s search index, computes cosine similarity between every pair of papers, and extracts explicit citations (regex matching "Paper XXI", bare Latin paper titles). Output: journal/src/data/paper-graph.json, rendered on every paper detail page as "Related by content" and "Cited in this paper".',
  },
  {
    term: 'MAGISTER',
    root: 'Latin — teacher · master of an art',
    role: 'Training / teaching agent; also the Journal\'s lexicon-completeness reporter',
    note: 'In CIVITAS INTELLIGENTIAE, the unit that transfers knowledge to new agents, staff, and the world model. In the Journal, the same name belongs to a build-time agent that scans every paper for ALL-CAPS Latin terms and italicised Latin phrases, then reports which ones are not yet in the lexicon. Strictly advisory — never auto-adds. The operator decides what enters the canon. Output: journal/src/data/magister-report.json.',
  },
  {
    term: 'MEDICUS',
    root: 'Latin — healer · physician',
    role: 'Self-heal / recovery agent',
    note: 'In CIVITAS INTELLIGENTIAE, the unit that diagnoses a broken kernel and re-issues it. Resilience by composition, not redundancy.',
  },
  {
    term: 'MUNDATOR COGNITUS',
    root: 'Latin — "the cognitive cleaner"',
    role: 'Two-pass document sanitiser ([E13·E14])',
    note: 'PASS 1 detects and auto-fixes brand strings, canister IDs, API keys, internal paths, and implementation code blocks. PASS 2 verifies that nothing survived. The journal\'s public deploy is gated by PASS 2. Lives in tools/doc-sanitizer.js.',
  },
  {
    term: 'NEXORIS',
    root: 'Latin nexus (bond) + oris (mouth · edge)',
    role: 'Synthetic pheromone routing field',
    note: 'The implementation of the STIGMERGY equation from Paper XX. Every routing decision deposits signal on its target; future routes encounter a field already shaped by the past. The optimal route emerges; it is not computed.',
  },
  {
    term: 'NUNTIUS',
    root: 'Latin — messenger · announcer · herald',
    role: 'Slack bot — enterprise briefing; also the Journal\'s outbound-discovery agent',
    note: 'In the bot registry, the voice of the organism on regular schedule. In the Journal, the same name belongs to a build-time agent that emits the outbound discovery surfaces every site needs: /rss.xml, /feed.xml (Atom), /sitemap.xml, and /robots.txt. Every feed entry mirrors what already exists; nothing is invented. NUNTIUS announces; it never measures who consumes the announcement.',
  },
  {
    term: 'OPUS · OPEREX · PROFECTUS · OPUS',
    root: 'Latin opus (work) · operari (to work) · proficere (to advance)',
    role: 'RSHIP sibling AGIs',
    note: 'Each one a different cut through the RSHIP grammar (Replication · Scalability · Hierarchy · Intelligence · Permanence). They are not a hierarchy — they are voices in the same chorus, distinguished by which dimension of the grammar they emphasise.',
  },
  {
    term: 'PHX',
    root: 'φ-Hash eXchange',
    role: 'Sovereign encryption / decision-ledger protocol',
    note: 'A decision-granular, chain-linked, φ-mixed signing protocol layered above SHA-256 / BLAKE2b. Every decision in the organism, when committed, is sealed with a PHX hash that depends on the prior seal, the decision payload, and a φ-expansion of the beat counter.',
  },
  {
    term: 'PULSE',
    root: 'Latin pulsus — beat · stroke',
    role: 'Cron worker — scheduled intelligence reports',
    note: 'Public-named in the bot registry. Hourly · market-open · midnight rhythm.',
  },
  {
    term: 'QUORUM',
    root: 'Latin — "of whom" (the threshold required)',
    role: 'Paper XXI — phase-transition governance',
    note: 'Decisions do not pass by majority; they crystallise when commitment crosses a threshold (θ ≈ φ⁻⁴). No authority. No tie-breaker. The mathematics of how honeybee swarms decide, applied to how the agent council reaches consensus.',
  },
  {
    term: 'RSHIP',
    root: 'Replication · Scalability · Hierarchy · Intelligence · Permanence',
    role: 'The AGI grammar shared across every system in this work',
    note: 'Not an acronym imposed on the system — the five properties that every entity in it actually exhibits. Replication: offspring inherit knowledge. Scalability: 1 → ∞ agents. Hierarchy: emergent, not imposed. Intelligence: goal-setting and learning. Permanence: φ-compounding eternal memory.',
  },
  {
    term: 'SCRIBA',
    root: 'Latin — scribe · recorder',
    role: 'Audit / log agent; also the Journal\'s build-time indexer',
    note: 'In CIVITAS INTELLIGENTIAE, the recorder — every action witnessed and committed to CHRONO. In the Journal, the same name belongs to a build-time agent that reads every sanitised paper, tokenises it, and produces a normalised TF-IDF index used by the search page and by LUMEN. Strictly deterministic — same corpus, same index. Output: journal/src/data/search-index.json.',
  },
  {
    term: 'SENTINEL',
    root: 'Italian / Latin — watcher · sentinel',
    role: 'Cron worker — 5-minute alert monitoring',
    note: 'Public-named in the bot registry. The unsleeping watch.',
  },
  {
    term: 'SPINOR',
    root: 'From quantum mechanics — an object whose identity is preserved under rotation',
    role: 'Deployment protocol that carries doctrine intact across substrate (Paper VI)',
    note: 'A VOXIS migrates via SPINOR: doctrine block transmitted as a frozen copy, the new substrate receives it, no path back to mutate it exists. The SPINOR manifest is logged to CHRONO so any drift is detectable on arrival.',
  },
  {
    term: 'STIGMERGY',
    root: 'Greek στίγμα (mark) + ἔργον (work)',
    role: 'Paper XX — sovereign collective intelligence via field accumulation',
    note: 'Coined to describe how termites coordinate without communication: each agent leaves marks in the environment; the environment encodes the collective\'s memory. The system\'s answer to "how can many sovereign agents make optimal decisions together without a coordinator?"',
  },
  {
    term: 'UNIVERSALIS GUBERNATIO',
    root: 'Latin — "universal governance"',
    role: 'Paper XXXI — multi-system governance, ICP first, not only',
    note: 'The same engine that governs the NNS can govern any distributed system to which a proposalFetcher adapter is supplied. The intelligence accumulated from one target makes the system better at governing the next.',
  },
  {
    term: 'VECTOR',
    root: 'Latin vector — carrier',
    role: 'Execution-trace agent in the agent council (Paper XXIII)',
    note: 'Maps the actual call path of an executed proposal through the canister graph. Carries the trace from claim to consequence.',
  },
  {
    term: 'VIGIL',
    root: 'Latin — watchman',
    role: 'Cloudflare worker — Market sentinel',
    note: 'Public-named in the worker registry. The market watch.',
  },
  {
    term: 'VOXIS',
    root: 'From vox — voice',
    role: 'Sovereign compute unit (Paper IV)',
    note: 'Every compute unit in the system carries five immutable components: doctrine block · helix core · synchronisation field · heartbeat · wallet. The doctrine block is read first on every beat; if it cannot be preserved, the operation is structurally impossible — not forbidden by policy.',
  },
];

// Sort alphabetically once, here, so renderers don\'t each do it.
entries.sort((a, b) => a.term.localeCompare(b.term));
