-- ═══════════════════════════════════════════════════════════════════════════════
-- EmailAI Mesh — D1 Schema
-- Organism Email Communication Layer
-- 
-- Tables:
--   email_events        — All inbound/outbound/inter-organ email events
--   email_identities    — External system identities onboarded into the mesh
--   email_conversations — Threaded conversations between organs and external systems
--   email_routing_rules — Custom routing rules for the mesh
-- ═══════════════════════════════════════════════════════════════════════════════

-- Email events (all directions)
CREATE TABLE IF NOT EXISTS email_events (
  id TEXT PRIMARY KEY,
  timestamp INTEGER NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound', 'inter-organ')),
  sender TEXT NOT NULL,
  recipient TEXT NOT NULL,
  subject TEXT,
  classification TEXT,
  priority TEXT DEFAULT 'normal',
  organ TEXT,
  body_preview TEXT,
  message_id TEXT,
  in_reply_to TEXT,
  thread_id TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_email_events_timestamp ON email_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_email_events_sender ON email_events(sender);
CREATE INDEX IF NOT EXISTS idx_email_events_organ ON email_events(organ);
CREATE INDEX IF NOT EXISTS idx_email_events_classification ON email_events(classification);
CREATE INDEX IF NOT EXISTS idx_email_events_direction ON email_events(direction);

-- External system identities (cross-company agent communication)
CREATE TABLE IF NOT EXISTS email_identities (
  id TEXT PRIMARY KEY,
  system_name TEXT NOT NULL,
  system_email TEXT NOT NULL UNIQUE,
  system_type TEXT NOT NULL,
  company TEXT,
  permissions TEXT, -- JSON array of organs this system can communicate with
  reputation_score REAL DEFAULT 0.5,
  messages_sent INTEGER DEFAULT 0,
  messages_received INTEGER DEFAULT 0,
  last_activity INTEGER,
  onboarded_at TEXT DEFAULT (datetime('now')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'revoked'))
);

CREATE INDEX IF NOT EXISTS idx_email_identities_email ON email_identities(system_email);
CREATE INDEX IF NOT EXISTS idx_email_identities_type ON email_identities(system_type);

-- Conversations (threaded)
CREATE TABLE IF NOT EXISTS email_conversations (
  id TEXT PRIMARY KEY,
  thread_id TEXT NOT NULL,
  participants TEXT NOT NULL, -- JSON array of email addresses
  organ TEXT NOT NULL,
  subject TEXT,
  message_count INTEGER DEFAULT 1,
  last_message_at INTEGER,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'archived')),
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_email_conversations_thread ON email_conversations(thread_id);
CREATE INDEX IF NOT EXISTS idx_email_conversations_organ ON email_conversations(organ);

-- Custom routing rules
CREATE TABLE IF NOT EXISTS email_routing_rules (
  id TEXT PRIMARY KEY,
  rule_name TEXT NOT NULL,
  condition_type TEXT NOT NULL, -- 'sender_domain', 'subject_contains', 'from_address', 'system_type'
  condition_value TEXT NOT NULL,
  target_organ TEXT NOT NULL,
  priority INTEGER DEFAULT 0,
  auto_respond INTEGER DEFAULT 0,
  active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_routing_rules_active ON email_routing_rules(active);

-- ═══════════════════════════════════════════════════════════════════════════════
-- SEED DATA — Default routing rules
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT OR IGNORE INTO email_routing_rules (id, rule_name, condition_type, condition_value, target_organ, priority, auto_respond)
VALUES
  ('RULE-001', 'Security scanners to membrane', 'subject_contains', 'scan', 'membrane', 10, 1),
  ('RULE-002', 'Probe alerts to membrane', 'subject_contains', 'probe', 'membrane', 10, 1),
  ('RULE-003', 'Intel queries to intel', 'subject_contains', 'threat', 'intel', 8, 1),
  ('RULE-004', 'Identity requests to identity', 'subject_contains', 'ssn', 'identity', 8, 1),
  ('RULE-005', 'Analytics to julia', 'subject_contains', 'analytics', 'julia', 5, 1),
  ('RULE-006', 'Workflow triggers to reflex', 'subject_contains', 'workflow', 'reflex', 5, 1),
  ('RULE-007', 'System alerts to organism', 'subject_contains', 'critical', 'organism', 10, 1);
