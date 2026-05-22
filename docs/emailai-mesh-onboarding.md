# EmailAI Mesh — Enterprise Onboarding Guide

> **Onboard your company to the universal communication layer for AI agents, systems, and enterprises.**

---

## Overview

EmailAI Mesh transforms how enterprises communicate with AI systems. Instead of complex API integrations, SDKs, or custom development, your systems simply send emails to intelligent agents.

**Time to Onboard:** ~15 minutes  
**Technical Requirements:** DNS access (MX records)  
**Code Required:** None

---

## Step 1 — Connect Your Domain

### Add MX Records

Route your enterprise email through EmailAI Mesh by adding MX records to your DNS configuration.

```dns
# Primary MX Record
@ IN MX 10 mesh-inbound.medinatechlabs.net

# Backup MX Record  
@ IN MX 20 mesh-backup.medinatechlabs.net
```

### Verify Domain Ownership

Send a verification email to confirm domain ownership:

```
To: verify@medinatechlabs.net
Subject: Domain Verification - yourdomain.com
Body: Verification code from DNS TXT record
```

**Expected Response Time:** < 5 minutes

---

## Step 2 — Create System Identities

Each system in your enterprise gets its own email identity. These identities can send and receive emails autonomously.

### Recommended System Identities

| System Type | Email Identity | Purpose |
|-------------|----------------|---------|
| CRM | `crm@yourdomain.com` | Customer data, interactions, updates |
| Monitoring | `monitoring@yourdomain.com` | Alerts, metrics, health checks |
| Security | `security@yourdomain.com` | Threats, incidents, compliance |
| Billing | `billing@yourdomain.com` | Invoices, payments, financials |
| Support | `support@yourdomain.com` | Tickets, issues, escalations |
| DevOps | `devops@yourdomain.com` | Deployments, incidents, infra |
| Analytics | `analytics@yourdomain.com` | Reports, dashboards, insights |
| HR | `hr@yourdomain.com` | Employee data, requests, policies |

### Register Identities

Send registration request to EmailAI Mesh:

```
To: register@medinatechlabs.net
Subject: Register System Identities - yourdomain.com

{
  "domain": "yourdomain.com",
  "identities": [
    {
      "email": "crm@yourdomain.com",
      "type": "system",
      "description": "Salesforce CRM integration",
      "capabilities": ["send", "receive", "automate"]
    },
    {
      "email": "monitoring@yourdomain.com", 
      "type": "system",
      "description": "Datadog monitoring",
      "capabilities": ["send", "receive", "alert"]
    }
  ]
}
```

---

## Step 3 — Assign Agents

Map your system identities to EmailAI Mesh agents. Each agent specializes in different intelligence domains.

### Agent Directory

| Agent | Email | Specialization |
|-------|-------|----------------|
| **Membrane** | `membrane@medinatechlabs.net` | Security analysis, threat classification, firewall rules |
| **Julia Brain** | `julia@medinatechlabs.net` | Analytics, optimization, cost analysis, predictions |
| **Reflex Engine** | `reflex@medinatechlabs.net` | Workflow automation, incident correlation, event chains |
| **Identity** | `identity@medinatechlabs.net` | Access control, compliance, contract analysis |
| **Synthetic Surfaces** | `synthetic@medinatechlabs.net` | Deception, honeypots, adversarial intelligence |
| **Nova** | `nova@medinatechlabs.net` | Customer intelligence, summaries, public communication |
| **Research** | `research@medinatechlabs.net` | Reports, insights, knowledge synthesis |
| **Probe** | `probe@medinatechlabs.net` | Threat intel, reconnaissance, scanner classification |

### Mapping Configuration

```
To: configure@medinatechlabs.net
Subject: Agent Mapping - yourdomain.com

{
  "domain": "yourdomain.com",
  "mappings": [
    {
      "system": "crm@yourdomain.com",
      "agent": "nova@medinatechlabs.net",
      "workflows": ["customer_summary", "churn_risk"]
    },
    {
      "system": "monitoring@yourdomain.com",
      "agent": "reflex@medinatechlabs.net",
      "workflows": ["incident_correlation", "root_cause"]
    },
    {
      "system": "security@yourdomain.com",
      "agent": "membrane@medinatechlabs.net",
      "workflows": ["threat_analysis", "scanner_classification"]
    }
  ]
}
```

---

## Step 4 — Enable Workflows

Choose from pre-built intelligent workflows or create custom automation.

### Available Workflows

#### Security & Threat
- `threat_analysis` — Analyze traffic patterns, identify threats
- `scanner_classification` — Classify and fingerprint scanners
- `firewall_recommendations` — Generate firewall rules
- `incident_response` — Automated incident handling

#### DevOps & Operations
- `incident_correlation` — Correlate incidents across systems
- `root_cause_analysis` — Identify root causes from logs
- `deployment_verification` — Verify deployment health
- `performance_optimization` — Analyze and optimize performance

#### Finance & Analytics
- `cost_analysis` — Analyze cloud and infrastructure spend
- `budget_forecasting` — Predict future costs
- `anomaly_detection` — Detect spending anomalies
- `optimization_recommendations` — Cost reduction suggestions

#### Customer & Sales
- `customer_summary` — Summarize customer interactions
- `churn_risk` — Identify at-risk customers
- `sentiment_analysis` — Analyze customer sentiment
- `support_triage` — Automated ticket routing

#### Legal & Compliance
- `contract_analysis` — Extract obligations and risks
- `compliance_check` — Verify regulatory compliance
- `audit_preparation` — Generate audit reports
- `policy_validation` — Check policy adherence

### Enable Workflows

```
To: workflows@medinatechlabs.net
Subject: Enable Workflows - yourdomain.com

{
  "domain": "yourdomain.com",
  "workflows": [
    {
      "name": "threat_analysis",
      "trigger": "security@yourdomain.com",
      "agent": "membrane@medinatechlabs.net",
      "schedule": "on_email"
    },
    {
      "name": "customer_summary",
      "trigger": "crm@yourdomain.com",
      "agent": "nova@medinatechlabs.net",
      "schedule": "daily"
    }
  ]
}
```

---

## Step 5 — Activate Intelligence

Enable advanced intelligence features for autonomous operation.

### Intelligence Features

| Feature | Description | Agent |
|---------|-------------|-------|
| **Anomaly Detection** | Detect unusual patterns in data | Julia Brain |
| **Synthetic Surfaces** | Deploy honeypots and deception | Synthetic Surfaces |
| **Cross-Network Communication** | Agent-to-agent coordination | All Agents |
| **Predictive Analysis** | Forecast trends and events | Julia Brain |
| **Threat Intelligence** | Real-time threat feeds | Membrane, Probe |

### Activation Request

```
To: intelligence@medinatechlabs.net
Subject: Activate Intelligence - yourdomain.com

{
  "domain": "yourdomain.com",
  "features": [
    "anomaly_detection",
    "synthetic_surfaces",
    "cross_network",
    "predictive_analysis",
    "threat_intelligence"
  ],
  "tier": "enterprise"
}
```

---

## Step 6 — Go Live

Your enterprise is now connected to EmailAI Mesh.

### Test Your Configuration

1. **System Test** — Have a system send an email to its assigned agent
2. **Response Verification** — Confirm agent responds with intelligence
3. **Workflow Test** — Trigger a workflow and verify automation

### Example Test

```
From: monitoring@yourdomain.com
To: reflex@medinatechlabs.net
Subject: Incident Summary Request

Please summarize the last 24 hours of incidents from our monitoring system.

Attached: incidents.json
```

**Expected Response:**
- Root cause analysis
- Pattern correlation
- Prioritized action plan
- Recommended remediations

---

## Quick Reference

### Key Emails

| Purpose | Email |
|---------|-------|
| Domain Verification | `verify@medinatechlabs.net` |
| Identity Registration | `register@medinatechlabs.net` |
| Agent Configuration | `configure@medinatechlabs.net` |
| Workflow Management | `workflows@medinatechlabs.net` |
| Intelligence Activation | `intelligence@medinatechlabs.net` |
| Support | `support@medinatechlabs.net` |

### Status Check

```
To: status@medinatechlabs.net
Subject: Status Check - yourdomain.com
```

### Emergency Escalation

```
To: escalate@medinatechlabs.net
Subject: URGENT - yourdomain.com
```

---

## Troubleshooting

### Common Issues

**Email not received by agent:**
- Verify MX records are propagated (use `dig MX yourdomain.com`)
- Check spam/junk folders
- Verify identity is registered

**No response from agent:**
- Check agent mapping is configured
- Verify workflow is enabled
- Contact support if issue persists

**Workflow not triggering:**
- Verify schedule configuration
- Check email format matches expected schema
- Review workflow logs via status email

---

## Support

For onboarding assistance, contact:

- **Email:** `onboard@medinatechlabs.net`
- **Technical Support:** `support@medinatechlabs.net`
- **Documentation:** https://medinatechlabs.net/docs

---

*EmailAI Mesh — The Universal Communication Layer for AI-Native Enterprises*

© 2026 MedinaTech Labs · RSHIP Intelligence Systems
