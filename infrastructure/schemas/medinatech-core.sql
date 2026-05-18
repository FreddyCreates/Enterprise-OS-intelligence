-- ═══════════════════════════════════════════════════════════════════════════════
-- MEDINATECH CORE DATABASE SCHEMA
-- Database: medinatech-core
-- Purpose: Central data store for all Workers
-- ═══════════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════════
-- WORKERS — Registry of all intelligent Workers
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS workers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    designation TEXT NOT NULL,
    route_pattern TEXT,
    version TEXT DEFAULT '1.0.0',
    status TEXT CHECK(status IN ('active', 'inactive', 'maintenance')) DEFAULT 'active',
    has_ai_binding INTEGER DEFAULT 0,
    has_kv_binding INTEGER DEFAULT 0,
    has_d1_binding INTEGER DEFAULT 0,
    has_r2_binding INTEGER DEFAULT 0,
    has_queue_binding INTEGER DEFAULT 0,
    has_vectorize_binding INTEGER DEFAULT 0,
    last_deployed DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_workers_status ON workers(status);
CREATE INDEX idx_workers_name ON workers(name);

-- ═══════════════════════════════════════════════════════════════════════════════
-- EVENTS — Central event log for all Workers
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    worker_name TEXT NOT NULL,
    event_type TEXT NOT NULL,
    severity TEXT CHECK(severity IN ('debug', 'info', 'warn', 'error', 'critical')) DEFAULT 'info',
    message TEXT,
    metadata TEXT,  -- JSON
    ip TEXT,
    country TEXT,
    user_agent TEXT,
    path TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_events_worker ON events(worker_name);
CREATE INDEX idx_events_type ON events(event_type);
CREATE INDEX idx_events_severity ON events(severity);
CREATE INDEX idx_events_created ON events(created_at);

-- ═══════════════════════════════════════════════════════════════════════════════
-- API_KEYS — API key management
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS api_keys (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key_hash TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    scopes TEXT,  -- JSON array of allowed scopes
    rate_limit INTEGER DEFAULT 1000,
    is_active INTEGER DEFAULT 1,
    last_used DATETIME,
    expires_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_api_keys_hash ON api_keys(key_hash);
CREATE INDEX idx_api_keys_active ON api_keys(is_active);

-- ═══════════════════════════════════════════════════════════════════════════════
-- SESSIONS — User session tracking
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    ip TEXT,
    user_agent TEXT,
    country TEXT,
    worker_name TEXT,
    data TEXT,  -- JSON
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);

-- ═══════════════════════════════════════════════════════════════════════════════
-- RATE_LIMITS — Rate limiting tracking
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS rate_limits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT UNIQUE NOT NULL,  -- IP, API key, or other identifier
    bucket TEXT NOT NULL,  -- Which rate limit bucket (e.g., 'api', 'auth', 'global')
    count INTEGER DEFAULT 1,
    window_start DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_rate_limits_key ON rate_limits(key);
CREATE INDEX idx_rate_limits_bucket ON rate_limits(bucket);

-- ═══════════════════════════════════════════════════════════════════════════════
-- SEED DATA — Initial Workers registry
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT OR IGNORE INTO workers (name, designation, route_pattern, has_ai_binding)
VALUES
    ('api-node', 'RSHIP-API-001', 'api.* + tools.*', 0),
    ('gate-node', 'RSHIP-GATE-001', 'gate.*', 0),
    ('knowledge-realm', 'RSHIP-REALM-001', 'realm.* + institute.*', 0),
    ('nova-sovereign', 'RSHIP-NOVA-001', 'nova.*', 1),
    ('enterprise-os-intelligence', 'RSHIP-ENT-001', 'enterprise.*', 0),
    ('enterprisentelligence', 'RSHIP-INNOV-001', 'innovation.*', 0),
    ('crimson-dawn-4f6d', 'RSHIP-RESEARCH-001', 'research.*', 0),
    ('honeypot-admin', 'RSHIP-HONEY-ADMIN', 'admin.*', 0),
    ('honeypot-portal', 'RSHIP-HONEY-PORTAL', 'portal.*', 0),
    ('probe-node', 'RSHIP-PROBE-001', 'probe1.*', 0),
    ('patient-shape-7a30', 'RSHIP-AI-001', '*', 1),
    ('agens', 'RSHIP-AIS-AG-001', 'agens.*', 0),
    ('cerebrum', 'RSHIP-AIS-CB-001', 'cerebrum.*', 0),
    ('nexus', 'RSHIP-AIS-NX-001', 'nexus.*', 0),
    ('nova', 'RSHIP-ML-NV-001', 'nova.medinatechlabs.net', 1);
