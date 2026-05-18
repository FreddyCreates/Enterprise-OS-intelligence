-- ═══════════════════════════════════════════════════════════════════════════════
-- MEDINATECH INTELLIGENCE D1 DATABASE SCHEMA
-- Shared intelligence database for all Workers
-- Run with: wrangler d1 execute medinatech-intelligence --file=./schema.sql
-- ═══════════════════════════════════════════════════════════════════════════════

-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ THREAT INTELLIGENCE TABLES                                                   │
-- └─────────────────────────────────────────────────────────────────────────────┘

CREATE TABLE IF NOT EXISTS attackers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ip_address TEXT UNIQUE NOT NULL,
    codename TEXT,
    threat_level TEXT CHECK (threat_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL', 'APEX')),
    classification TEXT,
    first_seen_at TEXT DEFAULT (datetime('now')),
    last_seen_at TEXT DEFAULT (datetime('now')),
    total_requests INTEGER DEFAULT 1,
    blocked BOOLEAN DEFAULT FALSE,
    notes TEXT,
    metadata TEXT  -- JSON blob for additional data
);

CREATE INDEX IF NOT EXISTS idx_attackers_ip ON attackers(ip_address);
CREATE INDEX IF NOT EXISTS idx_attackers_threat_level ON attackers(threat_level);

CREATE TABLE IF NOT EXISTS specimens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    attacker_id INTEGER REFERENCES attackers(id),
    request_method TEXT,
    request_path TEXT,
    request_headers TEXT,  -- JSON
    request_body TEXT,
    user_agent TEXT,
    country TEXT,
    asn TEXT,
    threat_score INTEGER,
    intent_classification TEXT,
    ai_analysis TEXT,
    captured_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_specimens_attacker ON specimens(attacker_id);
CREATE INDEX IF NOT EXISTS idx_specimens_captured ON specimens(captured_at);

CREATE TABLE IF NOT EXISTS scanner_signatures (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    pattern TEXT NOT NULL,
    pattern_type TEXT CHECK (pattern_type IN ('USER_AGENT', 'PATH', 'HEADER', 'BODY')),
    threat_level TEXT DEFAULT 'MEDIUM',
    description TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ INTELLIGENCE & KNOWLEDGE TABLES                                              │
-- └─────────────────────────────────────────────────────────────────────────────┘

CREATE TABLE IF NOT EXISTS knowledge_shards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    worker_source TEXT NOT NULL,
    shard_type TEXT NOT NULL,
    title TEXT,
    content TEXT NOT NULL,
    embedding_id TEXT,  -- Reference to Vectorize
    confidence REAL DEFAULT 1.0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_knowledge_worker ON knowledge_shards(worker_source);
CREATE INDEX IF NOT EXISTS idx_knowledge_type ON knowledge_shards(shard_type);

CREATE TABLE IF NOT EXISTS intelligence_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_type TEXT NOT NULL,
    source_worker TEXT NOT NULL,
    target_worker TEXT,
    severity TEXT CHECK (severity IN ('INFO', 'NOTICE', 'WARNING', 'ALERT', 'CRITICAL')),
    title TEXT,
    description TEXT,
    metadata TEXT,  -- JSON
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_events_type ON intelligence_events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_source ON intelligence_events(source_worker);
CREATE INDEX IF NOT EXISTS idx_events_created ON intelligence_events(created_at);

-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ WORKFLOW & TASK TABLES                                                       │
-- └─────────────────────────────────────────────────────────────────────────────┘

CREATE TABLE IF NOT EXISTS workflows (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT CHECK (status IN ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED')),
    owner_worker TEXT,
    steps TEXT,  -- JSON array of step definitions
    current_step INTEGER DEFAULT 0,
    metadata TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    completed_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_workflows_status ON workflows(status);

CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    workflow_id INTEGER REFERENCES workflows(id),
    name TEXT NOT NULL,
    description TEXT,
    status TEXT CHECK (status IN ('PENDING', 'ASSIGNED', 'RUNNING', 'COMPLETED', 'FAILED')),
    assigned_worker TEXT,
    priority INTEGER DEFAULT 5,
    input_data TEXT,  -- JSON
    output_data TEXT,  -- JSON
    error_message TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    started_at TEXT,
    completed_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_tasks_workflow ON tasks(workflow_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_worker ON tasks(assigned_worker);

-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ MESSAGING & COMMUNICATION TABLES                                             │
-- └─────────────────────────────────────────────────────────────────────────────┘

CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    from_worker TEXT NOT NULL,
    to_worker TEXT,
    channel TEXT,
    message_type TEXT NOT NULL,
    subject TEXT,
    body TEXT NOT NULL,
    priority TEXT CHECK (priority IN ('LOW', 'NORMAL', 'HIGH', 'URGENT')),
    status TEXT CHECK (status IN ('QUEUED', 'SENT', 'DELIVERED', 'READ', 'FAILED')),
    metadata TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    delivered_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_messages_from ON messages(from_worker);
CREATE INDEX IF NOT EXISTS idx_messages_to ON messages(to_worker);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at);

CREATE TABLE IF NOT EXISTS briefings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    briefing_type TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    ai_generated BOOLEAN DEFAULT TRUE,
    source_workers TEXT,  -- JSON array
    audience TEXT,
    scheduled_for TEXT,
    delivered_at TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_briefings_type ON briefings(briefing_type);
CREATE INDEX IF NOT EXISTS idx_briefings_scheduled ON briefings(scheduled_for);

-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ SESSION & STATE TABLES                                                       │
-- └─────────────────────────────────────────────────────────────────────────────┘

CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    worker TEXT NOT NULL,
    user_id TEXT,
    state TEXT,  -- JSON
    created_at TEXT DEFAULT (datetime('now')),
    expires_at TEXT,
    last_active_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_sessions_worker ON sessions(worker);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

CREATE TABLE IF NOT EXISTS worker_state (
    worker_name TEXT PRIMARY KEY,
    status TEXT CHECK (status IN ('ONLINE', 'OFFLINE', 'DEGRADED', 'MAINTENANCE')),
    version TEXT,
    last_heartbeat TEXT,
    config TEXT,  -- JSON
    metrics TEXT,  -- JSON
    updated_at TEXT DEFAULT (datetime('now'))
);

-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ ANALYTICS & TELEMETRY TABLES                                                 │
-- └─────────────────────────────────────────────────────────────────────────────┘

CREATE TABLE IF NOT EXISTS telemetry (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    worker TEXT NOT NULL,
    event_type TEXT NOT NULL,
    metric_name TEXT,
    metric_value REAL,
    dimensions TEXT,  -- JSON
    timestamp TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_telemetry_worker ON telemetry(worker);
CREATE INDEX IF NOT EXISTS idx_telemetry_timestamp ON telemetry(timestamp);

-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ SEED DATA                                                                    │
-- └─────────────────────────────────────────────────────────────────────────────┘

-- Insert known attacker profiles
INSERT OR IGNORE INTO attackers (ip_address, codename, threat_level, classification, notes) VALUES
('45.88.138.44', 'APEX-PREDATOR', 'APEX', 'PERSISTENT_SCANNER', 'Known botnet scanner, high-volume automated probing'),
('203.159.90.116', 'SHADOW-CRAWLER', 'HIGH', 'SPIDER', 'Southeast Asian proxy, rotates through known vulnerable paths'),
('64.227.70.2', 'DIGITAL-OCEAN-ALPHA', 'MEDIUM', 'VPS_SCANNER', 'DigitalOcean-hosted scanner, opportunistic attacks'),
('64.225.75.246', 'DIGITAL-OCEAN-BETA', 'MEDIUM', 'VPS_SCANNER', 'DigitalOcean-hosted scanner, similar pattern to ALPHA');

-- Insert scanner signatures
INSERT OR IGNORE INTO scanner_signatures (name, pattern, pattern_type, threat_level, description) VALUES
('LeakIX', 'LeakIX', 'USER_AGENT', 'HIGH', 'LeakIX vulnerability scanner'),
('ChromeHeadless', 'HeadlessChrome', 'USER_AGENT', 'MEDIUM', 'Headless Chrome automation'),
('Nuclei', 'Nuclei', 'USER_AGENT', 'HIGH', 'Nuclei vulnerability scanner'),
('SQLMap', 'sqlmap', 'USER_AGENT', 'CRITICAL', 'SQLMap injection tool'),
('Nmap', 'Nmap', 'USER_AGENT', 'HIGH', 'Nmap network scanner'),
('Nikto', 'Nikto', 'USER_AGENT', 'HIGH', 'Nikto web scanner'),
('Zgrab', 'zgrab', 'USER_AGENT', 'MEDIUM', 'Zgrab TLS scanner');

-- Initialize worker state
INSERT OR IGNORE INTO worker_state (worker_name, status, version) VALUES
('AGENS', 'ONLINE', '2.0.0'),
('CEREBRUM', 'ONLINE', '2.0.0'),
('VIGIL', 'ONLINE', '2.0.0'),
('NEXUS', 'ONLINE', '2.0.0'),
('ANIMUS', 'ONLINE', '2.0.0'),
('CURSOR', 'ONLINE', '2.0.0'),
('ARBITER', 'ONLINE', '2.0.0'),
('SENTINEL', 'ONLINE', '2.0.0'),
('HERALD', 'ONLINE', '2.0.0'),
('CONDUIT', 'ONLINE', '2.0.0'),
('IMPERIUM', 'ONLINE', '2.0.0'),
('NUNTIUS', 'ONLINE', '2.0.0'),
('PULSE', 'ONLINE', '2.0.0');
