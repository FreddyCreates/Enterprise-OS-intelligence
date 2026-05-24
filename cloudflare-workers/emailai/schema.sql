-- ═══════════════════════════════════════════════════════════════════════════════
-- EMAILAI MESH D1 DATABASE SCHEMA
-- Sovereign email intelligence — messages, classifications, routing, identities
-- Run with: wrangler d1 execute emailai-mesh --file=./schema.sql
-- ═══════════════════════════════════════════════════════════════════════════════

-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ MESSAGES — All inbound/outbound emails                                      │
-- └─────────────────────────────────────────────────────────────────────────────┘

CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    sender TEXT NOT NULL,
    recipient TEXT NOT NULL,
    subject TEXT,
    body TEXT,
    raw_headers TEXT,  -- JSON
    size INTEGER DEFAULT 0,
    received_at TEXT DEFAULT (datetime('now')),
    processed BOOLEAN DEFAULT TRUE,
    thread_id TEXT,
    parent_message_id TEXT REFERENCES messages(id)
);

CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender);
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipient);
CREATE INDEX IF NOT EXISTS idx_messages_received ON messages(received_at);
CREATE INDEX IF NOT EXISTS idx_messages_thread ON messages(thread_id);

-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ CLASSIFICATIONS — AI-generated message classifications                      │
-- └─────────────────────────────────────────────────────────────────────────────┘

CREATE TABLE IF NOT EXISTS classifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    message_id TEXT REFERENCES messages(id),
    entity_type TEXT CHECK (entity_type IN ('human', 'bot', 'system', 'organ', 'agent')),
    intent TEXT CHECK (intent IN ('info', 'request', 'alert', 'error', 'task', 'escalation', 'summary')),
    organ_target TEXT,
    confidence REAL CHECK (confidence >= 0.0 AND confidence <= 1.0),
    urgency TEXT CHECK (urgency IN ('low', 'medium', 'high', 'critical')),
    action TEXT,
    metadata TEXT,  -- JSON
    classified_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_classifications_message ON classifications(message_id);
CREATE INDEX IF NOT EXISTS idx_classifications_organ ON classifications(organ_target);
CREATE INDEX IF NOT EXISTS idx_classifications_intent ON classifications(intent);
CREATE INDEX IF NOT EXISTS idx_classifications_urgency ON classifications(urgency);

-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ ROUTING LOG — Where messages were routed                                    │
-- └─────────────────────────────────────────────────────────────────────────────┘

CREATE TABLE IF NOT EXISTS routing_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    message_id TEXT REFERENCES messages(id),
    target_organ TEXT NOT NULL,
    action TEXT NOT NULL,
    status TEXT DEFAULT 'routed',
    routed_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_routing_message ON routing_log(message_id);
CREATE INDEX IF NOT EXISTS idx_routing_target ON routing_log(target_organ);

-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ IDENTITIES — Registered email entities (organs, systems, agents)            │
-- └─────────────────────────────────────────────────────────────────────────────┘

CREATE TABLE IF NOT EXISTS identities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    entity_type TEXT CHECK (entity_type IN ('organ', 'agent', 'system', 'bot', 'human')),
    name TEXT NOT NULL,
    domain TEXT NOT NULL,
    capabilities TEXT,  -- JSON array
    reputation_score REAL DEFAULT 1.0,
    messages_sent INTEGER DEFAULT 0,
    messages_received INTEGER DEFAULT 0,
    registered_at TEXT DEFAULT (datetime('now')),
    last_active_at TEXT DEFAULT (datetime('now')),
    active BOOLEAN DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_identities_email ON identities(email);
CREATE INDEX IF NOT EXISTS idx_identities_type ON identities(entity_type);
CREATE INDEX IF NOT EXISTS idx_identities_domain ON identities(domain);

-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ ACTIONS — Action execution log                                              │
-- └─────────────────────────────────────────────────────────────────────────────┘

CREATE TABLE IF NOT EXISTS actions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    message_id TEXT REFERENCES messages(id),
    action_type TEXT NOT NULL,
    status TEXT DEFAULT 'executed',
    result TEXT,  -- JSON
    executed_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_actions_message ON actions(message_id);
CREATE INDEX IF NOT EXISTS idx_actions_type ON actions(action_type);

-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ THREADS — Conversation threads                                              │
-- └─────────────────────────────────────────────────────────────────────────────┘

CREATE TABLE IF NOT EXISTS threads (
    id TEXT PRIMARY KEY,
    subject TEXT,
    participants TEXT,  -- JSON array of emails
    message_count INTEGER DEFAULT 1,
    organ_target TEXT,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed', 'escalated', 'resolved')),
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ MESH TELEMETRY — System health and performance                              │
-- └─────────────────────────────────────────────────────────────────────────────┘

CREATE TABLE IF NOT EXISTS telemetry (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_type TEXT NOT NULL,
    organ TEXT,
    metric_name TEXT,
    metric_value REAL,
    metadata TEXT,  -- JSON
    recorded_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_telemetry_event ON telemetry(event_type);
CREATE INDEX IF NOT EXISTS idx_telemetry_organ ON telemetry(organ);

-- ═══════════════════════════════════════════════════════════════════════════════
-- SEED DATA — Register organ identities
-- ═══════════════════════════════════════════════════════════════════════════════

-- Core Organs
INSERT OR IGNORE INTO identities (email, entity_type, name, domain, capabilities) VALUES
    ('membrane@medinatechlabs.net', 'organ', 'Membrane', 'medinatechlabs.net', '["alert","route","block","escalate"]'),
    ('julia@medinatechlabs.net', 'organ', 'Julia Brain', 'medinatechlabs.net', '["classify","predict","analyze","summarize"]'),
    ('identity@medinatechlabs.net', 'organ', 'Identity/SSN', 'medinatechlabs.net', '["onboard","stake","verify","audit"]'),
    ('reflex@medinatechlabs.net', 'organ', 'Reflex Engine', 'medinatechlabs.net', '["trigger_workflow","escalate","chain","schedule"]'),
    ('synthetic@medinatechlabs.net', 'organ', 'Synthetic Surfaces', 'medinatechlabs.net', '["deceive","log","fingerprint","trap"]'),
    ('nova@medinatechlabs.net', 'organ', 'Nova', 'medinatechlabs.net', '["reply","notify","report","communicate"]'),
    ('research@medinatechlabs.net', 'organ', 'Research', 'medinatechlabs.net', '["report","insight","synthesize","publish"]'),
    ('probe@medinatechlabs.net', 'organ', 'Probe', 'medinatechlabs.net', '["fingerprint","classify","track","alert"]');

-- Agent Workers
INSERT OR IGNORE INTO identities (email, entity_type, name, domain, capabilities) VALUES
    ('agens@medinatechlabs.net', 'agent', 'Agens', 'medinatechlabs.net', '["orchestrate","command","showcase","drill"]'),
    ('cerebrum@medinatechlabs.net', 'agent', 'Cerebrum', 'medinatechlabs.net', '["reason","synthesize","learn","infer"]'),
    ('animus@medinatechlabs.net', 'agent', 'Animus', 'medinatechlabs.net', '["sense","feel","motivate","adapt"]'),
    ('nexus@medinatechlabs.net', 'agent', 'Nexus', 'medinatechlabs.net', '["connect","bind","coordinate","relay"]'),
    ('vigil@medinatechlabs.net', 'agent', 'Vigil', 'medinatechlabs.net', '["watch","monitor","alert","guard"]'),
    ('cursor@medinatechlabs.net', 'agent', 'Cursor', 'medinatechlabs.net', '["navigate","point","track","select"]');

-- Infrastructure Services
INSERT OR IGNORE INTO identities (email, entity_type, name, domain, capabilities) VALUES
    ('gate@medinatechlabs.net', 'system', 'Gate-Node', 'medinatechlabs.net', '["gate","filter","route","protect"]'),
    ('cache@medinatechlabs.net', 'system', 'Cache-Organism', 'medinatechlabs.net', '["cache","learn","respond","adapt"]'),
    ('mesh@medinatechlabs.net', 'system', 'EmailAI Mesh', 'medinatechlabs.net', '["ingest","classify","route","coordinate"]');

-- Bots
INSERT OR IGNORE INTO identities (email, entity_type, name, domain, capabilities) VALUES
    ('herald@medinatechlabs.net', 'bot', 'Herald', 'medinatechlabs.net', '["announce","broadcast","notify","publish"]'),
    ('conduit@medinatechlabs.net', 'bot', 'Conduit', 'medinatechlabs.net', '["relay","bridge","forward","translate"]'),
    ('pulse@medinatechlabs.net', 'bot', 'Pulse', 'medinatechlabs.net', '["heartbeat","health","vitals","ping"]'),
    ('sentinel@medinatechlabs.net', 'bot', 'Sentinel', 'medinatechlabs.net', '["detect","defend","scan","report"]'),
    ('arbiter@medinatechlabs.net', 'bot', 'Arbiter', 'medinatechlabs.net', '["decide","arbitrate","enforce","resolve"]'),
    ('imperium@medinatechlabs.net', 'bot', 'Imperium', 'medinatechlabs.net', '["command","delegate","govern","authorize"]'),
    ('nuntius@medinatechlabs.net', 'bot', 'Nuntius', 'medinatechlabs.net', '["deliver","message","notify","dispatch"]');

-- Client-Facing Identities (enterprises and clients email these)
INSERT OR IGNORE INTO identities (email, entity_type, name, domain, capabilities) VALUES
    ('analysis@medinatechlabs.net', 'organ', 'Analysis (Client-Facing)', 'medinatechlabs.net', '["analyze","report","predict","optimize"]'),
    ('support@medinatechlabs.net', 'organ', 'Support (Client-Facing)', 'medinatechlabs.net', '["reply","resolve","escalate","summarize"]'),
    ('automation@medinatechlabs.net', 'organ', 'Automation (Client-Facing)', 'medinatechlabs.net', '["automate","trigger","schedule","chain"]'),
    ('security@medinatechlabs.net', 'organ', 'Security (Client-Facing)', 'medinatechlabs.net', '["scan","detect","report","defend"]'),
    ('intelligence@medinatechlabs.net', 'organ', 'Intelligence (Client-Facing)', 'medinatechlabs.net', '["recon","fingerprint","track","brief"]');

-- ═══════════════════════════════════════════════════════════════════════════════
-- ENTERPRISE ONBOARDING — Client domain registrations
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS enterprise_domains (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    domain TEXT UNIQUE NOT NULL,
    company_name TEXT,
    contact_email TEXT,
    tier TEXT DEFAULT 'standard' CHECK (tier IN ('standard', 'pro', 'enterprise', 'sovereign')),
    systems_count INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT TRUE,
    onboarded_at TEXT DEFAULT (datetime('now')),
    last_active_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_enterprise_domain ON enterprise_domains(domain);
CREATE INDEX IF NOT EXISTS idx_enterprise_tier ON enterprise_domains(tier);

CREATE TABLE IF NOT EXISTS system_identities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    enterprise_domain_id INTEGER REFERENCES enterprise_domains(id),
    system_name TEXT NOT NULL,
    organ_target TEXT,
    system_type TEXT CHECK (system_type IN ('crm', 'erp', 'monitoring', 'security', 'hr', 'finance', 'support', 'billing', 'custom')),
    capabilities TEXT,  -- JSON array
    messages_sent INTEGER DEFAULT 0,
    messages_received INTEGER DEFAULT 0,
    registered_at TEXT DEFAULT (datetime('now')),
    active BOOLEAN DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_system_email ON system_identities(email);
CREATE INDEX IF NOT EXISTS idx_system_enterprise ON system_identities(enterprise_domain_id);
CREATE INDEX IF NOT EXISTS idx_system_organ ON system_identities(organ_target);
