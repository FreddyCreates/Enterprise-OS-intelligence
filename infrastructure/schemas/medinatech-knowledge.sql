-- ═══════════════════════════════════════════════════════════════════════════════
-- MEDINATECH KNOWLEDGE DATABASE SCHEMA
-- Database: medinatech-knowledge
-- Purpose: Knowledge base, AI training data, research corpus
-- ═══════════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════════
-- KNOWLEDGE_SHARDS — Individual knowledge units
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS knowledge_shards (
    id TEXT PRIMARY KEY,
    topic TEXT UNIQUE NOT NULL,
    content TEXT NOT NULL,
    summary TEXT,
    category TEXT,
    tags TEXT,  -- JSON array
    embedding_id TEXT,  -- Reference to Vectorize
    version INTEGER DEFAULT 1,
    times_accessed INTEGER DEFAULT 0,
    last_accessed DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_shards_topic ON knowledge_shards(topic);
CREATE INDEX idx_shards_category ON knowledge_shards(category);
CREATE INDEX idx_shards_accessed ON knowledge_shards(times_accessed DESC);

-- ═══════════════════════════════════════════════════════════════════════════════
-- RESEARCH_PAPERS — Research paper metadata
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS research_papers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    paper_id TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    abstract TEXT,
    authors TEXT,  -- JSON array
    doi TEXT,
    file_path TEXT,
    category TEXT,
    tags TEXT,  -- JSON array
    embedding_id TEXT,
    times_cited INTEGER DEFAULT 0,
    published_date DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_papers_id ON research_papers(paper_id);
CREATE INDEX idx_papers_category ON research_papers(category);
CREATE INDEX idx_papers_published ON research_papers(published_date);

-- ═══════════════════════════════════════════════════════════════════════════════
-- AI_CONVERSATIONS — AI interaction logs for training
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS ai_conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id TEXT NOT NULL,
    worker_name TEXT NOT NULL,
    role TEXT CHECK(role IN ('system', 'user', 'assistant')) NOT NULL,
    content TEXT NOT NULL,
    model TEXT,
    tokens_used INTEGER,
    latency_ms INTEGER,
    metadata TEXT,  -- JSON
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_conversations_id ON ai_conversations(conversation_id);
CREATE INDEX idx_conversations_worker ON ai_conversations(worker_name);
CREATE INDEX idx_conversations_created ON ai_conversations(created_at);

-- ═══════════════════════════════════════════════════════════════════════════════
-- EMBEDDINGS — Track embeddings stored in Vectorize
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS embeddings (
    id TEXT PRIMARY KEY,
    source_type TEXT NOT NULL,  -- 'shard', 'paper', 'conversation'
    source_id TEXT NOT NULL,
    vector_index TEXT NOT NULL,
    model TEXT,
    dimensions INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_embeddings_source ON embeddings(source_type, source_id);
CREATE INDEX idx_embeddings_index ON embeddings(vector_index);

-- ═══════════════════════════════════════════════════════════════════════════════
-- SEED DATA — Initial knowledge shards
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT OR IGNORE INTO knowledge_shards (id, topic, content, category)
VALUES
    ('shard-001', 'bot-resilience', 'Bot Resilience Engineering is the discipline of absorbing, classifying, and neutralizing adversarial bot traffic at scale. Unlike traditional WAFs that simply block, bot-resilience systems learn from attackers, turning hostile traffic into training data and behavioral signatures.', 'security'),
    ('shard-002', 'phi-geometry', 'φ-geometry applies the golden ratio (φ ≈ 1.618) to system architecture. Agent positioning follows Fibonacci spirals; decision boundaries use golden-section search; resource allocation mirrors φ-based proportions.', 'architecture'),
    ('shard-003', 'kuramoto-sync', 'Kuramoto synchronisation models how oscillators (agents) naturally align phases. In multi-agent systems, each agent adjusts its internal rhythm based on neighbors, producing emergent global coherence without central coordination.', 'coordination'),
    ('shard-004', 'lyapunov-stability', 'Lyapunov stability analysis proves system boundedness: if a Lyapunov function V(x) decreases along trajectories, the system cannot diverge. In AI agents, we construct V from error metrics and resource usage.', 'stability'),
    ('shard-005', 'shadow-decryption', 'Shadow Decryption is best-effort protocol reconstruction for encrypted or malformed traffic. Even without keys, entropy analysis, header fingerprinting, and pattern matching can reveal protocol type and structure hints.', 'security'),
    ('shard-006', 'error-eyes', 'Error Eyes turn failures into opportunities. Instead of dropping malformed requests, Error Eyes attempt repairs: JSON syntax fixes, path normalization, method correction. Repaired requests re-enter the pipeline.', 'resilience'),
    ('shard-007', 'organism-composition', 'Organism Composition Theory models multi-agent systems as biological organisms. Agents are cells; communication channels are neural pathways; resource flows are metabolic processes.', 'architecture'),
    ('shard-008', 'adversary-lab', 'The Adversary Lab is where hostile traffic becomes training data. Exploit attempts, jailbreak patterns, and scanner signatures are dissected, fingerprinted, and catalogued.', 'security'),
    ('shard-009', 'tor-routing', 'Tor traffic represents anonymized actors — the boss arena of adversarial traffic. 35 Tor exit nodes hitting a domain means serious reconnaissance is underway.', 'threat-intel'),
    ('shard-010', 'path-intent', 'Path-based intent classification: each requested path is a self-report of attacker intent. /.git/config = repo theft. /.env = secret extraction. /api/graphql = schema introspection.', 'threat-intel'),
    ('shard-011', 'specimen-profiles', 'Recurring attackers deserve dossiers. APEX-PREDATOR (45.88.138.44) sent 80 attacks. SHADOW-CRAWLER (203.159.90.116) sent 51. Track their tactics over time.', 'threat-intel'),
    ('shard-012', 'phantom-layer', 'The Phantom Layer hides real internal pages behind the public AI range. Authenticated users pass through invisible gates to protected resources.', 'architecture');
