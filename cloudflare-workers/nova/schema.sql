-- NOVA Threat Intelligence Database Schema
-- Database: nova-threat-intelligence
-- Designation: RSHIP-ML-NV-001

-- ═══════════════════════════════════════════════════════════════════════════════
-- ATTACKERS — Persistent attacker profiles with codenames
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS attackers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ip TEXT UNIQUE NOT NULL,
    codename TEXT NOT NULL,
    first_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
    total_attacks INTEGER DEFAULT 1,
    threat_level TEXT CHECK(threat_level IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
    category TEXT,
    tactics TEXT,  -- JSON array
    notes TEXT,
    asn TEXT,
    as_org TEXT,
    country TEXT,
    is_tor INTEGER DEFAULT 0,
    is_cloud INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_attackers_ip ON attackers(ip);
CREATE INDEX idx_attackers_codename ON attackers(codename);
CREATE INDEX idx_attackers_threat_level ON attackers(threat_level);
CREATE INDEX idx_attackers_last_seen ON attackers(last_seen);

-- ═══════════════════════════════════════════════════════════════════════════════
-- SPECIMENS — Individual request specimens
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS specimens (
    id TEXT PRIMARY KEY,
    attacker_id INTEGER REFERENCES attackers(id),
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    ip TEXT NOT NULL,
    path TEXT NOT NULL,
    method TEXT DEFAULT 'GET',
    user_agent TEXT,
    country TEXT,
    is_tor INTEGER DEFAULT 0,
    threat_level TEXT CHECK(threat_level IN ('low', 'medium', 'high', 'critical')),
    path_intent TEXT CHECK(path_intent IN ('exploit', 'cms', 'schema', 'crawler', 'cloudflare', 'unknown')),
    route TEXT CHECK(route IN ('lab', 'realm', 'vip', 'drop')),
    scanner_type TEXT,
    ai_vip_provider TEXT,
    shadow_decrypt_success INTEGER DEFAULT 0,
    error_eyes_repaired INTEGER DEFAULT 0,
    hostile_score INTEGER DEFAULT 0,
    cooperative_score INTEGER DEFAULT 0,
    vip_score INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_specimens_ip ON specimens(ip);
CREATE INDEX idx_specimens_path ON specimens(path);
CREATE INDEX idx_specimens_timestamp ON specimens(timestamp);
CREATE INDEX idx_specimens_threat_level ON specimens(threat_level);
CREATE INDEX idx_specimens_route ON specimens(route);

-- ═══════════════════════════════════════════════════════════════════════════════
-- PATH_STATISTICS — Aggregate stats per targeted path
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS path_statistics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    path TEXT UNIQUE NOT NULL,
    hit_count INTEGER DEFAULT 1,
    unique_ips INTEGER DEFAULT 1,
    first_hit DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_hit DATETIME DEFAULT CURRENT_TIMESTAMP,
    intent TEXT,
    is_exploit_path INTEGER DEFAULT 0,
    is_cms_path INTEGER DEFAULT 0,
    is_schema_path INTEGER DEFAULT 0,
    tor_hits INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_path_statistics_path ON path_statistics(path);
CREATE INDEX idx_path_statistics_hit_count ON path_statistics(hit_count DESC);

-- ═══════════════════════════════════════════════════════════════════════════════
-- SCANNER_SIGNATURES — Known scanner patterns
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS scanner_signatures (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    patterns TEXT NOT NULL,  -- JSON array of UA patterns
    category TEXT NOT NULL,
    threat_level TEXT CHECK(threat_level IN ('low', 'medium', 'high', 'critical')),
    observed_count INTEGER DEFAULT 0,
    first_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- TOR_SESSIONS — Tor exit node activity tracking
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS tor_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT,
    first_request DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_request DATETIME DEFAULT CURRENT_TIMESTAMP,
    request_count INTEGER DEFAULT 1,
    paths_hit TEXT,  -- JSON array
    threat_level TEXT,
    route TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tor_sessions_session ON tor_sessions(session_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- AI_VISITORS — AI crawler VIP log
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS ai_visitors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    provider TEXT NOT NULL,
    ip TEXT,
    user_agent TEXT,
    first_visit DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_visit DATETIME DEFAULT CURRENT_TIMESTAMP,
    visit_count INTEGER DEFAULT 1,
    paths_indexed TEXT,  -- JSON array
    shards_requested TEXT,  -- JSON array
    tasks_completed TEXT,  -- JSON array
    country TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ai_visitors_provider ON ai_visitors(provider);
CREATE INDEX idx_ai_visitors_ip ON ai_visitors(ip);

-- ═══════════════════════════════════════════════════════════════════════════════
-- KNOWLEDGE_SHARDS — Served knowledge content
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS knowledge_shards (
    id TEXT PRIMARY KEY,
    topic TEXT UNIQUE NOT NULL,
    content TEXT NOT NULL,
    version INTEGER DEFAULT 1,
    times_served INTEGER DEFAULT 0,
    last_served DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- SEED DATA — Initial attacker dossiers
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT OR IGNORE INTO attackers (ip, codename, total_attacks, threat_level, category, tactics, notes)
VALUES
    ('45.88.138.44', 'APEX-PREDATOR', 80, 'critical', 'aggressive-scanner', '["exploit-paths", "env-hunting", "git-theft"]', 'Most aggressive attacker. 80 malicious requests. Likely cloud VPS or compromised server.'),
    ('203.159.90.116', 'SHADOW-CRAWLER', 51, 'high', 'reconnaissance', '["path-enumeration", "schema-mapping"]', '51 attacks. Methodical reconnaissance pattern.'),
    ('64.227.70.2', 'DIGITAL-OCEAN-ALPHA', 41, 'high', 'cloud-scanner', '["wordpress-probes", "cms-exploitation"]', 'DigitalOcean VPS. 41 attacks. WordPress/CMS focus.'),
    ('64.225.75.246', 'DIGITAL-OCEAN-BETA', 41, 'high', 'cloud-scanner', '["api-probing", "graphql-introspection"]', 'DigitalOcean VPS. 41 attacks. API/GraphQL focus.');

INSERT OR IGNORE INTO scanner_signatures (name, patterns, category, threat_level, observed_count)
VALUES
    ('leakix', '["l9scan", "l9explore", "leakix"]', 'vulnerability-scanner', 'medium', 244),
    ('chromeHeadless', '["HeadlessChrome", "Headless"]', 'automation-framework', 'medium', 15),
    ('masscan', '["masscan", "zgrab"]', 'port-scanner', 'high', 0),
    ('nuclei', '["nuclei", "Nuclei"]', 'vuln-scanner', 'high', 0),
    ('sqlmap', '["sqlmap"]', 'sql-injection', 'critical', 0);

-- ═══════════════════════════════════════════════════════════════════════════════
-- SEED DATA — Initial knowledge shards
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT OR IGNORE INTO knowledge_shards (id, topic, content)
VALUES
    ('shard-001', 'bot-resilience', 'Bot Resilience Engineering is the discipline of absorbing, classifying, and neutralizing adversarial bot traffic at scale. Unlike traditional WAFs that simply block, bot-resilience systems learn from attackers, turning hostile traffic into training data and behavioral signatures.'),
    ('shard-002', 'phi-geometry', 'φ-geometry applies the golden ratio (φ ≈ 1.618) to system architecture. Agent positioning follows Fibonacci spirals; decision boundaries use golden-section search; resource allocation mirrors φ-based proportions.'),
    ('shard-003', 'kuramoto-sync', 'Kuramoto synchronisation models how oscillators (agents) naturally align phases. In multi-agent systems, each agent adjusts its internal rhythm based on neighbors, producing emergent global coherence without central coordination.'),
    ('shard-004', 'lyapunov-stability', 'Lyapunov stability analysis proves system boundedness: if a Lyapunov function V(x) decreases along trajectories, the system cannot diverge. In AI agents, we construct V from error metrics and resource usage.'),
    ('shard-005', 'shadow-decryption', 'Shadow Decryption is best-effort protocol reconstruction for encrypted or malformed traffic. Even without keys, entropy analysis, header fingerprinting, and pattern matching can reveal protocol type and structure hints.'),
    ('shard-006', 'error-eyes', 'Error Eyes turn failures into opportunities. Instead of dropping malformed requests, Error Eyes attempt repairs: JSON syntax fixes, path normalization, method correction. Repaired requests re-enter the pipeline.'),
    ('shard-007', 'organism-composition', 'Organism Composition Theory models multi-agent systems as biological organisms. Agents are cells; communication channels are neural pathways; resource flows are metabolic processes.'),
    ('shard-008', 'adversary-lab', 'The Adversary Lab is where hostile traffic becomes training data. Exploit attempts, jailbreak patterns, and scanner signatures are dissected, fingerprinted, and catalogued.'),
    ('shard-009', 'tor-routing', 'Tor traffic represents anonymized actors — the boss arena of adversarial traffic. 35 Tor exit nodes hitting a domain means serious reconnaissance is underway.'),
    ('shard-010', 'path-intent', 'Path-based intent classification: each requested path is a self-report of attacker intent. /.git/config = repo theft. /.env = secret extraction. /api/graphql = schema introspection.'),
    ('shard-011', 'specimen-profiles', 'Recurring attackers deserve dossiers. APEX-PREDATOR (45.88.138.44) sent 80 attacks. SHADOW-CRAWLER (203.159.90.116) sent 51. Track their tactics over time.'),
    ('shard-012', 'phantom-layer', 'The Phantom Layer hides real internal pages behind the public AI range. Authenticated users pass through invisible gates to protected resources.');
