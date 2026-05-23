/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║              E N T E R P R I S E   E M A I L   T E M P L A T E S             ║
 * ║                                                                              ║
 * ║  Pre-built Email Templates for Every Enterprise Use Case                     ║
 * ║  Ready-to-use AI prompts and response formats                               ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 * 
 * Official Designation: RSHIP-2026-TEMPLATES-EMAILAI-001
 * 
 * Template Categories:
 *   1. IT & Security         - membrane
 *   2. DevOps / SRE          - reflex
 *   3. Finance & Analytics   - brain
 *   4. Sales & Customer      - nova
 *   5. Legal & Compliance    - identity
 *   6. Research & Intel      - research
 *   7. Threat Intelligence   - probe
 *   8. System Operations     - infrastructure
 * 
 * © 2026 Alfredo Medina Hernandez · RSHIP AGI Systems · All Rights Reserved.
 */

'use strict';

// ═══════════════════════════════════════════════════════════════════════════════
// TEMPLATE ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

class TemplateEngine {
  constructor() {
    this.templates = new Map();
    this._registerAllTemplates();
  }
  
  /**
   * Get a template by category and name
   */
  get(category, name) {
    const key = `${category}:${name}`;
    return this.templates.get(key) || null;
  }
  
  /**
   * List all templates in a category
   */
  list(category = null) {
    const results = [];
    for (const [key, template] of this.templates) {
      if (!category || key.startsWith(`${category}:`)) {
        results.push({ key, ...template });
      }
    }
    return results;
  }
  
  /**
   * Render a template with variables
   */
  render(category, name, variables = {}) {
    const template = this.get(category, name);
    if (!template) {
      throw new Error(`Template not found: ${category}:${name}`);
    }
    
    let rendered = {
      subject: this._interpolate(template.subject, variables),
      body: this._interpolate(template.body, variables),
      to: template.to,
      headers: { ...template.headers }
    };
    
    // Add EAP-1 headers
    if (template.intent) rendered.headers['X-Agent-Intent'] = template.intent;
    if (template.urgency) rendered.headers['X-Agent-Urgency'] = template.urgency;
    if (template.type) rendered.headers['X-Agent-Type'] = template.type;
    
    return rendered;
  }
  
  _interpolate(text, variables) {
    return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return variables[key] !== undefined ? variables[key] : match;
    });
  }
  
  _registerAllTemplates() {
    // Register all template categories
    this._registerSecurityTemplates();
    this._registerDevOpsTemplates();
    this._registerFinanceTemplates();
    this._registerSalesTemplates();
    this._registerLegalTemplates();
    this._registerResearchTemplates();
    this._registerThreatIntelTemplates();
    this._registerSystemTemplates();
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // IT & SECURITY TEMPLATES (membrane)
  // ─────────────────────────────────────────────────────────────────────────────
  
  _registerSecurityTemplates() {
    // Traffic Analysis
    this.templates.set('security:traffic-analysis', {
      to: 'membrane@medinatechlabs.net',
      subject: '[ANALYSIS] Traffic Analysis Request - {{source}}',
      body: `## Traffic Analysis Request

**Source:** {{source}}
**Time Range:** {{timeRange}}
**Concern:** {{concern}}

### Data Points
{{dataPoints}}

### Required Analysis
1. Scanner classification
2. Risk scores
3. Recommended firewall rules
4. Pattern identification

Please provide:
- Threat level assessment
- IOC extraction
- Mitigation recommendations`,
      intent: 'task',
      urgency: 'high',
      type: 'system'
    });
    
    // Security Alert
    this.templates.set('security:alert', {
      to: 'membrane@medinatechlabs.net',
      subject: '[ALERT] {{severity}} - {{title}}',
      body: `## Security Alert

**Severity:** {{severity}}
**Title:** {{title}}
**Detected:** {{timestamp}}
**Source:** {{source}}

### Details
{{details}}

### Immediate Actions Required
{{actions}}`,
      intent: 'alert',
      urgency: 'critical',
      type: 'system'
    });
    
    // Firewall Rule Request
    this.templates.set('security:firewall-rules', {
      to: 'membrane@medinatechlabs.net',
      subject: '[FIREWALL] Rule Generation Request',
      body: `## Firewall Rule Request

**Environment:** {{environment}}
**Current Rules:** {{currentRules}}
**Traffic Patterns:** {{trafficPatterns}}

### Requirements
{{requirements}}

Please generate:
1. Optimized firewall rules
2. Rate limiting recommendations
3. Geo-blocking suggestions
4. WAF configuration`,
      intent: 'task',
      urgency: 'medium',
      type: 'system'
    });
    
    // Vulnerability Report
    this.templates.set('security:vulnerability-report', {
      to: 'membrane@medinatechlabs.net',
      subject: '[VULN] Vulnerability Assessment - {{system}}',
      body: `## Vulnerability Assessment Request

**System:** {{system}}
**Scan Date:** {{scanDate}}
**Scanner:** {{scanner}}

### Raw Findings
{{findings}}

Please provide:
1. Prioritized vulnerability list
2. Risk scoring (CVSS context)
3. Remediation timeline
4. Patch recommendations`,
      intent: 'task',
      urgency: 'high',
      type: 'system'
    });
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // DEVOPS / SRE TEMPLATES (reflex)
  // ─────────────────────────────────────────────────────────────────────────────
  
  _registerDevOpsTemplates() {
    // Incident Report
    this.templates.set('devops:incident-report', {
      to: 'reflex@medinatechlabs.net',
      subject: '[INCIDENT] {{severity}} - {{service}}',
      body: `## Incident Report

**Severity:** {{severity}}
**Service:** {{service}}
**Start Time:** {{startTime}}
**Status:** {{status}}

### Impact
{{impact}}

### Timeline
{{timeline}}

### Actions Taken
{{actions}}

Please provide:
1. Root cause analysis
2. Pattern correlation
3. Recommended next steps
4. Prevention measures`,
      intent: 'escalation',
      urgency: 'critical',
      type: 'system'
    });
    
    // Deployment Request
    this.templates.set('devops:deployment', {
      to: 'reflex@medinatechlabs.net',
      subject: '[DEPLOY] {{environment}} - {{service}} v{{version}}',
      body: `## Deployment Request

**Service:** {{service}}
**Version:** {{version}}
**Environment:** {{environment}}
**Requester:** {{requester}}

### Changes
{{changes}}

### Rollback Plan
{{rollbackPlan}}

Please:
1. Validate deployment readiness
2. Check dependency compatibility
3. Schedule deployment window
4. Prepare monitoring alerts`,
      intent: 'task',
      urgency: 'medium',
      type: 'system'
    });
    
    // Alert Correlation
    this.templates.set('devops:alert-correlation', {
      to: 'reflex@medinatechlabs.net',
      subject: '[ALERTS] Correlation Analysis Request',
      body: `## Alert Correlation Request

**Time Range:** {{timeRange}}
**Alert Count:** {{alertCount}}
**Services Affected:** {{services}}

### Raw Alerts
{{alerts}}

Please provide:
1. Alert clustering
2. Root cause identification
3. Noise reduction recommendations
4. Actionable summary`,
      intent: 'task',
      urgency: 'high',
      type: 'system'
    });
    
    // Capacity Planning
    this.templates.set('devops:capacity-planning', {
      to: 'reflex@medinatechlabs.net',
      subject: '[CAPACITY] Planning Request - {{service}}',
      body: `## Capacity Planning Request

**Service:** {{service}}
**Current Load:** {{currentLoad}}
**Growth Projection:** {{growthProjection}}
**Timeline:** {{timeline}}

### Current Metrics
{{metrics}}

Please provide:
1. Scaling recommendations
2. Resource optimization
3. Cost projections
4. Implementation timeline`,
      intent: 'request',
      urgency: 'medium',
      type: 'system'
    });
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // FINANCE & ANALYTICS TEMPLATES (brain)
  // ─────────────────────────────────────────────────────────────────────────────
  
  _registerFinanceTemplates() {
    // Cost Analysis
    this.templates.set('finance:cost-analysis', {
      to: 'julia@medinatechlabs.net',
      subject: '[COST] {{period}} Cloud Spend Analysis',
      body: `## Cost Analysis Request

**Period:** {{period}}
**Total Spend:** {{totalSpend}}
**Budget:** {{budget}}

### Breakdown by Provider
{{providerBreakdown}}

### Top Cost Centers
{{costCenters}}

Please provide:
1. Cost optimization recommendations
2. Waste identification
3. Reserved pricing opportunities
4. ROI projections`,
      intent: 'task',
      urgency: 'medium',
      type: 'system'
    });
    
    // Budget Forecast
    this.templates.set('finance:budget-forecast', {
      to: 'julia@medinatechlabs.net',
      subject: '[FORECAST] {{quarter}} Budget Projection',
      body: `## Budget Forecast Request

**Quarter:** {{quarter}}
**Current Run Rate:** {{runRate}}
**YTD Spend:** {{ytdSpend}}

### Historical Data
{{historicalData}}

### Growth Assumptions
{{assumptions}}

Please provide:
1. Quarterly forecast
2. Confidence intervals
3. Risk factors
4. Scenario analysis`,
      intent: 'task',
      urgency: 'low',
      type: 'system'
    });
    
    // ROI Analysis
    this.templates.set('finance:roi-analysis', {
      to: 'julia@medinatechlabs.net',
      subject: '[ROI] Investment Analysis - {{project}}',
      body: `## ROI Analysis Request

**Project:** {{project}}
**Investment:** {{investment}}
**Timeline:** {{timeline}}

### Expected Benefits
{{benefits}}

### Costs
{{costs}}

Please provide:
1. ROI calculation
2. Payback period
3. NPV analysis
4. Risk-adjusted returns`,
      intent: 'task',
      urgency: 'medium',
      type: 'system'
    });
    
    // Anomaly Detection
    this.templates.set('finance:anomaly-detection', {
      to: 'julia@medinatechlabs.net',
      subject: '[ANOMALY] Spending Pattern Analysis',
      body: `## Anomaly Detection Request

**Detection Period:** {{period}}
**Threshold:** {{threshold}}
**Services Monitored:** {{services}}

### Flagged Items
{{flaggedItems}}

Please provide:
1. Anomaly classification
2. Root cause analysis
3. Impact assessment
4. Recommended actions`,
      intent: 'alert',
      urgency: 'high',
      type: 'system'
    });
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // SALES & CUSTOMER SUCCESS TEMPLATES (nova)
  // ─────────────────────────────────────────────────────────────────────────────
  
  _registerSalesTemplates() {
    // Customer Health Report
    this.templates.set('sales:customer-health', {
      to: 'nova@medinatechlabs.net',
      subject: '[HEALTH] Customer Analysis - {{customer}}',
      body: `## Customer Health Analysis

**Customer:** {{customer}}
**Account Tier:** {{tier}}
**Contract Value:** {{contractValue}}

### Recent Activity
{{activity}}

### Support Tickets
{{tickets}}

Please provide:
1. Health score
2. Churn risk assessment
3. Expansion opportunities
4. Recommended actions`,
      intent: 'task',
      urgency: 'medium',
      type: 'system'
    });
    
    // Complaint Analysis
    this.templates.set('sales:complaint-analysis', {
      to: 'nova@medinatechlabs.net',
      subject: '[COMPLAINTS] {{period}} Analysis',
      body: `## Complaint Analysis Request

**Period:** {{period}}
**Total Complaints:** {{totalComplaints}}
**Resolution Rate:** {{resolutionRate}}

### Raw Complaints
{{complaints}}

Please provide:
1. Theme clustering
2. Sentiment analysis
3. Priority ranking
4. Process improvements`,
      intent: 'task',
      urgency: 'medium',
      type: 'system'
    });
    
    // Support Response
    this.templates.set('sales:support-response', {
      to: 'support@medinatechlabs.net',
      subject: '[SUPPORT] {{ticketId}} - {{subject}}',
      body: `## Support Request

**Ticket ID:** {{ticketId}}
**Customer:** {{customer}}
**Priority:** {{priority}}

### Issue Description
{{description}}

### Customer History
{{history}}

Please:
1. Draft response
2. Identify resolution
3. Suggest escalation if needed
4. Update knowledge base`,
      intent: 'request',
      urgency: 'high',
      type: 'client-facing'
    });
    
    // NPS Analysis
    this.templates.set('sales:nps-analysis', {
      to: 'nova@medinatechlabs.net',
      subject: '[NPS] {{period}} Survey Analysis',
      body: `## NPS Analysis Request

**Period:** {{period}}
**Responses:** {{responses}}
**Current NPS:** {{nps}}

### Survey Data
{{surveyData}}

### Comments
{{comments}}

Please provide:
1. NPS trend analysis
2. Detractor insights
3. Promoter characteristics
4. Improvement recommendations`,
      intent: 'task',
      urgency: 'low',
      type: 'system'
    });
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // LEGAL & COMPLIANCE TEMPLATES (identity)
  // ─────────────────────────────────────────────────────────────────────────────
  
  _registerLegalTemplates() {
    // Contract Review
    this.templates.set('legal:contract-review', {
      to: 'identity@medinatechlabs.net',
      subject: '[CONTRACT] Review Request - {{contractName}}',
      body: `## Contract Review Request

**Contract:** {{contractName}}
**Counterparty:** {{counterparty}}
**Value:** {{value}}
**Deadline:** {{deadline}}

### Contract Type
{{contractType}}

### Key Concerns
{{concerns}}

Please provide:
1. Risk clause identification
2. Obligation extraction
3. Liability assessment
4. Negotiation points`,
      intent: 'task',
      urgency: 'high',
      type: 'system'
    });
    
    // Compliance Check
    this.templates.set('legal:compliance-check', {
      to: 'identity@medinatechlabs.net',
      subject: '[COMPLIANCE] {{framework}} Assessment',
      body: `## Compliance Assessment Request

**Framework:** {{framework}}
**Scope:** {{scope}}
**Deadline:** {{deadline}}

### Current Controls
{{controls}}

### Evidence
{{evidence}}

Please provide:
1. Compliance gaps
2. Remediation priorities
3. Evidence requirements
4. Timeline to compliance`,
      intent: 'task',
      urgency: 'medium',
      type: 'system'
    });
    
    // Policy Review
    this.templates.set('legal:policy-review', {
      to: 'identity@medinatechlabs.net',
      subject: '[POLICY] Review - {{policyName}}',
      body: `## Policy Review Request

**Policy:** {{policyName}}
**Last Updated:** {{lastUpdated}}
**Owner:** {{owner}}

### Policy Content
{{content}}

### Regulatory Changes
{{regulatoryChanges}}

Please provide:
1. Gap analysis
2. Update recommendations
3. Risk assessment
4. Implementation guidance`,
      intent: 'task',
      urgency: 'low',
      type: 'system'
    });
    
    // Audit Preparation
    this.templates.set('legal:audit-prep', {
      to: 'identity@medinatechlabs.net',
      subject: '[AUDIT] Preparation - {{auditType}}',
      body: `## Audit Preparation Request

**Audit Type:** {{auditType}}
**Auditor:** {{auditor}}
**Date:** {{date}}

### Scope
{{scope}}

### Previous Findings
{{previousFindings}}

Please provide:
1. Document checklist
2. Control validation
3. Evidence compilation
4. Interview preparation`,
      intent: 'task',
      urgency: 'high',
      type: 'system'
    });
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // RESEARCH & INTELLIGENCE TEMPLATES (research)
  // ─────────────────────────────────────────────────────────────────────────────
  
  _registerResearchTemplates() {
    // Research Brief
    this.templates.set('research:brief', {
      to: 'research@medinatechlabs.net',
      subject: '[RESEARCH] Brief Request - {{topic}}',
      body: `## Research Brief Request

**Topic:** {{topic}}
**Deadline:** {{deadline}}
**Audience:** {{audience}}

### Research Questions
{{questions}}

### Context
{{context}}

Please provide:
1. Executive summary
2. Key findings
3. Data sources
4. Recommendations`,
      intent: 'task',
      urgency: 'medium',
      type: 'system'
    });
    
    // Market Analysis
    this.templates.set('research:market-analysis', {
      to: 'research@medinatechlabs.net',
      subject: '[MARKET] Analysis - {{market}}',
      body: `## Market Analysis Request

**Market:** {{market}}
**Scope:** {{scope}}
**Timeline:** {{timeline}}

### Focus Areas
{{focusAreas}}

### Competitors
{{competitors}}

Please provide:
1. Market sizing
2. Competitive landscape
3. Trend analysis
4. Opportunity assessment`,
      intent: 'task',
      urgency: 'low',
      type: 'system'
    });
    
    // Trend Report
    this.templates.set('research:trend-report', {
      to: 'research@medinatechlabs.net',
      subject: '[TRENDS] {{industry}} Report',
      body: `## Trend Report Request

**Industry:** {{industry}}
**Period:** {{period}}
**Format:** {{format}}

### Data Sources
{{dataSources}}

### Key Questions
{{questions}}

Please provide:
1. Trend identification
2. Impact analysis
3. Future projections
4. Strategic implications`,
      intent: 'task',
      urgency: 'low',
      type: 'system'
    });
    
    // Knowledge Synthesis
    this.templates.set('research:synthesis', {
      to: 'research@medinatechlabs.net',
      subject: '[SYNTHESIS] Knowledge Compilation',
      body: `## Knowledge Synthesis Request

**Topic:** {{topic}}
**Sources:** {{sources}}
**Output Format:** {{format}}

### Source Materials
{{materials}}

### Synthesis Goals
{{goals}}

Please provide:
1. Synthesized summary
2. Key insights
3. Conflicting viewpoints
4. Knowledge gaps`,
      intent: 'task',
      urgency: 'low',
      type: 'system'
    });
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // THREAT INTELLIGENCE TEMPLATES (probe)
  // ─────────────────────────────────────────────────────────────────────────────
  
  _registerThreatIntelTemplates() {
    // Threat Brief
    this.templates.set('threat:brief', {
      to: 'probe@medinatechlabs.net',
      subject: '[THREAT] Intelligence Brief - {{threatActor}}',
      body: `## Threat Intelligence Brief

**Threat Actor:** {{threatActor}}
**Classification:** {{classification}}
**First Seen:** {{firstSeen}}

### IOCs
{{iocs}}

### TTPs
{{ttps}}

Please provide:
1. Actor profile
2. Target analysis
3. Mitigation recommendations
4. Detection signatures`,
      intent: 'task',
      urgency: 'high',
      type: 'system'
    });
    
    // Scanner Fingerprint
    this.templates.set('threat:scanner-fingerprint', {
      to: 'probe@medinatechlabs.net',
      subject: '[SCANNER] Fingerprint Analysis',
      body: `## Scanner Fingerprint Request

**Source IP:** {{sourceIP}}
**User Agent:** {{userAgent}}
**Request Patterns:** {{patterns}}

### Raw Logs
{{logs}}

Please provide:
1. Scanner identification
2. Intent classification
3. Risk assessment
4. Blocking recommendations`,
      intent: 'task',
      urgency: 'high',
      type: 'system'
    });
    
    // IOC Feed
    this.templates.set('threat:ioc-feed', {
      to: 'probe@medinatechlabs.net',
      subject: '[IOC] Feed Processing Request',
      body: `## IOC Feed Processing

**Feed Source:** {{feedSource}}
**IOC Count:** {{iocCount}}
**Time Range:** {{timeRange}}

### Raw IOCs
{{iocs}}

Please provide:
1. Validated IOCs
2. Confidence scores
3. Context enrichment
4. Detection rules`,
      intent: 'task',
      urgency: 'medium',
      type: 'system'
    });
    
    // Attack Surface
    this.templates.set('threat:attack-surface', {
      to: 'probe@medinatechlabs.net',
      subject: '[SURFACE] Attack Surface Analysis',
      body: `## Attack Surface Analysis

**Target:** {{target}}
**Scope:** {{scope}}
**Last Scan:** {{lastScan}}

### Known Assets
{{assets}}

### Recent Changes
{{changes}}

Please provide:
1. Exposed services
2. Vulnerability mapping
3. Risk prioritization
4. Hardening recommendations`,
      intent: 'task',
      urgency: 'medium',
      type: 'system'
    });
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // SYSTEM OPERATIONS TEMPLATES
  // ─────────────────────────────────────────────────────────────────────────────
  
  _registerSystemTemplates() {
    // Health Check
    this.templates.set('system:health-check', {
      to: 'pulse@medinatechlabs.net',
      subject: '[HEALTH] System Status Check',
      body: `## System Health Check

**Systems:** {{systems}}
**Check Type:** {{checkType}}
**Timestamp:** {{timestamp}}

Please provide:
1. System status
2. Performance metrics
3. Anomaly detection
4. Recommendations`,
      intent: 'info',
      urgency: 'low',
      type: 'system'
    });
    
    // Broadcast
    this.templates.set('system:broadcast', {
      to: 'herald@medinatechlabs.net',
      subject: '[BROADCAST] {{title}}',
      body: `## System Broadcast

**Title:** {{title}}
**Priority:** {{priority}}
**Audience:** {{audience}}

### Message
{{message}}

### Distribution
- Channels: {{channels}}
- Schedule: {{schedule}}`,
      intent: 'info',
      urgency: 'medium',
      type: 'system'
    });
    
    // Escalation
    this.templates.set('system:escalation', {
      to: 'imperium@medinatechlabs.net',
      subject: '[ESCALATE] {{severity}} - {{title}}',
      body: `## Escalation Request

**Severity:** {{severity}}
**Title:** {{title}}
**Requester:** {{requester}}

### Situation
{{situation}}

### Actions Taken
{{actionsTaken}}

### Decision Required
{{decision}}`,
      intent: 'escalation',
      urgency: 'critical',
      type: 'system'
    });
    
    // Decision Request
    this.templates.set('system:decision', {
      to: 'arbiter@medinatechlabs.net',
      subject: '[DECISION] {{topic}}',
      body: `## Decision Request

**Topic:** {{topic}}
**Deadline:** {{deadline}}
**Stakeholders:** {{stakeholders}}

### Context
{{context}}

### Options
{{options}}

### Criteria
{{criteria}}

Please provide:
1. Option analysis
2. Risk assessment
3. Recommendation
4. Implementation plan`,
      intent: 'request',
      urgency: 'high',
      type: 'system'
    });
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// RESPONSE TEMPLATES - Standard AI Response Formats
// ═══════════════════════════════════════════════════════════════════════════════

const RESPONSE_FORMATS = {
  standard: {
    structure: `## {{title}}

### Summary
{{summary}}

### Key Findings
{{findings}}

### Recommendations
{{recommendations}}

---

\`\`\`json
{{jsonData}}
\`\`\``,
    fields: ['title', 'summary', 'findings', 'recommendations', 'jsonData']
  },
  
  alert: {
    structure: `## ⚠️ ALERT: {{title}}

**Severity:** {{severity}}
**Detected:** {{timestamp}}
**Status:** {{status}}

### Details
{{details}}

### Immediate Actions
{{actions}}

### Mitigation
{{mitigation}}

---

\`\`\`json
{{jsonData}}
\`\`\``,
    fields: ['title', 'severity', 'timestamp', 'status', 'details', 'actions', 'mitigation', 'jsonData']
  },
  
  analysis: {
    structure: `## 📊 Analysis: {{title}}

### Executive Summary
{{summary}}

### Methodology
{{methodology}}

### Findings

{{findings}}

### Data

| Metric | Value | Change |
|--------|-------|--------|
{{tableData}}

### Recommendations
{{recommendations}}

### Next Steps
{{nextSteps}}

---

\`\`\`json
{{jsonData}}
\`\`\``,
    fields: ['title', 'summary', 'methodology', 'findings', 'tableData', 'recommendations', 'nextSteps', 'jsonData']
  },
  
  report: {
    structure: `## 📋 Report: {{title}}

**Period:** {{period}}
**Generated:** {{timestamp}}
**Author:** {{author}}

### Overview
{{overview}}

### Key Metrics

{{metrics}}

### Highlights
{{highlights}}

### Concerns
{{concerns}}

### Appendix
{{appendix}}

---

\`\`\`json
{{jsonData}}
\`\`\``,
    fields: ['title', 'period', 'timestamp', 'author', 'overview', 'metrics', 'highlights', 'concerns', 'appendix', 'jsonData']
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

module.exports = {
  TemplateEngine,
  RESPONSE_FORMATS,
  
  // Factory
  createTemplateEngine: () => new TemplateEngine(),
  
  // Categories
  CATEGORIES: [
    'security',
    'devops',
    'finance',
    'sales',
    'legal',
    'research',
    'threat',
    'system'
  ]
};
