-- ═══════════════════════════════════════════════════════════════════════════════
-- MEDINATECH HONEYPOT DATABASE SCHEMA
-- Database: medinatech-honeypot
-- Purpose: Store honeypot captures, attacker data, and trap statistics
-- ═══════════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════════
-- CAPTURES — Raw honeypot captures
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS captures (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    honeypot_name TEXT NOT NULL,
    capture_id TEXT UNIQUE NOT NULL,
    ip TEXT NOT NULL,
    country TEXT,
    asn TEXT,
    as_org TEXT,
    method TEXT DEFAULT 'GET',
    path TEXT NOT NULL,
    query_string TEXT,
    headers TEXT,  -- JSON
    body TEXT,
    user_agent TEXT,
    referer TEXT,
    threat_level TEXT CHECK(threat_level IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
    attack_type TEXT,
    is_tor INTEGER DEFAULT 0,
    is_vpn INTEGER DEFAULT 0,
    is_cloud INTEGER DEFAULT 0,
    is_scanner INTEGER DEFAULT 0,
    scanner_name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_captures_ip ON captures(ip);
CREATE INDEX idx_captures_honeypot ON captures(honeypot_name);
CREATE INDEX idx_captures_threat ON captures(threat_level);
CREATE INDEX idx_captures_attack ON captures(attack_type);
CREATE INDEX idx_captures_created ON captures(created_at);
CREATE INDEX idx_captures_path ON captures(path);

-- ═══════════════════════════════════════════════════════════════════════════════
-- ATTACKERS — Known attacker profiles
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS attackers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ip TEXT UNIQUE NOT NULL,
    codename TEXT,
    first_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
    total_captures INTEGER DEFAULT 1,
    threat_level TEXT CHECK(threat_level IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
    category TEXT,
    tactics TEXT,  -- JSON array
    notes TEXT,
    asn TEXT,
    as_org TEXT,
    country TEXT,
    is_tor INTEGER DEFAULT 0,
    is_vpn INTEGER DEFAULT 0,
    is_cloud INTEGER DEFAULT 0,
    is_blocked INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_attackers_ip ON attackers(ip);
CREATE INDEX idx_attackers_codename ON attackers(codename);
CREATE INDEX idx_attackers_threat ON attackers(threat_level);
CREATE INDEX idx_attackers_blocked ON attackers(is_blocked);

-- ═══════════════════════════════════════════════════════════════════════════════
-- HONEYPOTS — Honeypot configuration and statistics
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS honeypots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    worker_name TEXT NOT NULL,
    route_pattern TEXT,
    trap_type TEXT,
    is_active INTEGER DEFAULT 1,
    total_captures INTEGER DEFAULT 0,
    unique_attackers INTEGER DEFAULT 0,
    last_capture DATETIME,
    config TEXT,  -- JSON
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_honeypots_name ON honeypots(name);
CREATE INDEX idx_honeypots_active ON honeypots(is_active);

-- ═══════════════════════════════════════════════════════════════════════════════
-- ATTACK_PATTERNS — Detected attack patterns
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS attack_patterns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pattern_type TEXT NOT NULL,
    pattern_value TEXT NOT NULL,
    description TEXT,
    severity TEXT CHECK(severity IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
    occurrences INTEGER DEFAULT 1,
    first_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_patterns_type ON attack_patterns(pattern_type);
CREATE INDEX idx_patterns_severity ON attack_patterns(severity);

-- ═══════════════════════════════════════════════════════════════════════════════
-- SCANNER_SIGNATURES — Known scanner signatures
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
-- SEED DATA — Initial honeypot configuration and scanner signatures
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT OR IGNORE INTO honeypots (name, worker_name, route_pattern, trap_type)
VALUES
    ('admin-honeypot', 'honeypot-admin', 'admin.*', 'fake_admin'),
    ('portal-honeypot', 'honeypot-portal', 'portal.*', 'fake_portal'),
    ('probe-honeypot', 'probe-node', 'probe1.*', 'probe_trap');

INSERT OR IGNORE INTO scanner_signatures (name, patterns, category, threat_level)
VALUES
    ('leakix', '["l9scan", "l9explore", "leakix"]', 'vulnerability-scanner', 'medium'),
    ('chromeHeadless', '["HeadlessChrome", "Headless"]', 'automation-framework', 'medium'),
    ('masscan', '["masscan", "zgrab"]', 'port-scanner', 'high'),
    ('nuclei', '["nuclei", "Nuclei"]', 'vuln-scanner', 'high'),
    ('sqlmap', '["sqlmap"]', 'sql-injection', 'critical'),
    ('nikto', '["Nikto", "nikto"]', 'web-scanner', 'high'),
    ('nmap', '["Nmap", "nmap"]', 'port-scanner', 'medium'),
    ('gobuster', '["gobuster"]', 'directory-scanner', 'medium'),
    ('dirbuster', '["DirBuster"]', 'directory-scanner', 'medium'),
    ('wpscan', '["WPScan"]', 'wordpress-scanner', 'high');

INSERT OR IGNORE INTO attackers (ip, codename, threat_level, category, tactics)
VALUES
    ('45.88.138.44', 'APEX-PREDATOR', 'critical', 'aggressive-scanner', '["exploit-paths", "env-hunting", "git-theft"]'),
    ('203.159.90.116', 'SHADOW-CRAWLER', 'high', 'reconnaissance', '["path-enumeration", "schema-mapping"]'),
    ('64.227.70.2', 'DIGITAL-OCEAN-ALPHA', 'high', 'cloud-scanner', '["wordpress-probes", "cms-exploitation"]'),
    ('64.225.75.246', 'DIGITAL-OCEAN-BETA', 'high', 'cloud-scanner', '["api-probing", "graphql-introspection"]');
