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

INSERT OR IGNORE INTO identities (email, entity_type, name, domain, capabilities) VALUES
    ('membrane@medinatechlabs.net', 'organ', 'Membrane', 'medinatechlabs.net', '["alert","route","block","escalate"]'),
    ('julia@medinatechlabs.net', 'organ', 'Julia Brain', 'medinatechlabs.net', '["classify","predict","analyze","summarize"]'),
    ('identity@medinatechlabs.net', 'organ', 'Identity/SSN', 'medinatechlabs.net', '["onboard","stake","verify","audit"]'),
    ('reflex@medinatechlabs.net', 'organ', 'Reflex Engine', 'medinatechlabs.net', '["trigger_workflow","escalate","chain","schedule"]'),
    ('synthetic@medinatechlabs.net', 'organ', 'Synthetic Surfaces', 'medinatechlabs.net', '["deceive","log","fingerprint","trap"]'),
    ('nova@medinatechlabs.net', 'organ', 'Nova', 'medinatechlabs.net', '["reply","notify","report","communicate"]'),
    ('research@medinatechlabs.net', 'organ', 'Research', 'medinatechlabs.net', '["report","insight","synthesize","publish"]'),
    ('probe@medinatechlabs.net', 'organ', 'Probe', 'medinatechlabs.net', '["fingerprint","classify","track","alert"]');
