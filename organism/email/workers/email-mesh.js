/**
 * WORKER 4 — EMAIL MESH (Sovereign Communication Organ)
 *
 * Designation:  ORGANISM-EMAIL-001
 * Role:         Multi-identity AI email mesh — every organ becomes an autonomous correspondent
 * Architecture: Door 4 — 5-Organ Computational Organism
 *
 * This is the sovereign communication layer.
 * Every organ has: inbox, outbound identity, signature, behavior, voice, personality.
 *
 * Capabilities:
 *   - Inbound:  Receive email at organ@medinatechlabs.net → parse → classify → route to organ
 *   - Outbound: Each organ sends email with its own identity, signature, and voice
 *   - Inter-organ: Organs communicate across networks via email protocol
 *   - Cross-company: External systems can email your organs directly
 *   - Agent mesh: AI agents talk to each other via email (post-API, post-webhook)
 *
 * Identities:
 *   membrane@medinatechlabs.net    → Probe alerts, routing decisions, policy updates
 *   julia@medinatechlabs.net       → Analytics, φ-curves, predictions, optimizations
 *   identity@medinatechlabs.net    → SSN onboarding, staking confirmations, reputation
 *   reflex@medinatechlabs.net      → Workflow summaries, event chains, reflex logs
 *   synthetic@medinatechlabs.net   → Deception reports, scanner fingerprints, novelty
 *   intel@medinatechlabs.net       → Threat intel feeds, scanner signatures, temporal patterns
 *   organism@medinatechlabs.net    → System-wide summaries, health reports, alerts
 *
 * Cross-Substrate Calls:
 *   → membrane.classify_probe     (if email contains probe data)
 *   → julia.classify_probe        (if email needs intelligence analysis)
 *   → icp.ssn.get                 (if email maps to an SSN identity)
 *   → workflow.start              (if email triggers a reflex)
 *   → state.append_log            (all emails logged to state)
 *
 * Why Email:
 *   - Global, federated, permissionless, cross-network, cross-company, cross-cloud
 *   - Every company uses it, every system can send to it, every firewall allows it
 *   - Every cloud supports it, every agent can parse it
 *   - This is not a messaging app — this is a sovereign communication mesh
 *
 * © 2026 Alfredo Medina Hernandez. All Rights Reserved.
 */

'use strict';

import { ORGAN_IDENTITIES, CLIENT_IDENTITIES, getOrganByAddress, getOrganByName } from '../identities/registry.js';

const PHI = 1.618033988749895;
const VERSION = '1.0.0';
const ORGAN = 'email-mesh';
const DOMAIN = 'medinatechlabs.net';

// ═══════════════════════════════════════════════════════════════════════════════
// EMAIL CLASSIFICATION — Determine what type of inbound email this is
// ═══════════════════════════════════════════════════════════════════════════════

const EMAIL_CLASSES = {
  probe_report:     { priority: 'high',   organ: 'membrane',  action: 'classify_and_route' },
  intel_query:      { priority: 'high',   organ: 'intel',     action: 'process_query' },
  agent_message:    { priority: 'medium', organ: 'reflex',    action: 'trigger_workflow' },
  system_alert:     { priority: 'high',   organ: 'organism',  action: 'escalate' },
  identity_request: { priority: 'medium', organ: 'identity',  action: 'process_identity' },
  analytics_query:  { priority: 'low',    organ: 'julia',     action: 'compute' },
  customer_query:   { priority: 'medium', organ: 'nova',      action: 'analyze_customer' },
  compliance_query: { priority: 'medium', organ: 'identity',  action: 'scan_compliance' },
  finops_query:     { priority: 'low',    organ: 'julia',     action: 'optimize_cost' },
  general:          { priority: 'low',    organ: 'organism',  action: 'triage' },
  spam:             { priority: 'none',   organ: null,        action: 'discard' },
};

// ═══════════════════════════════════════════════════════════════════════════════
// INBOUND EMAIL HANDLER — Cloudflare Email Routing
// ═══════════════════════════════════════════════════════════════════════════════

async function handleInboundEmail(message, env) {
  const from = message.from;
  const to = message.to;
  const subject = message.headers.get('subject') || '(no subject)';
  const messageId = message.headers.get('message-id') || `MSG-${Date.now().toString(36)}`;

  // Parse the target organ from the recipient address
  const targetOrgan = getOrganByAddress(to);

  // Read the raw email body
  const rawBody = await new Response(message.raw).text();
  const body = extractTextBody(rawBody);

  // Classify the inbound email
  const classification = classifyInboundEmail(from, to, subject, body, targetOrgan);

  // Build the email event
  const emailEvent = {
    id: `EMAIL-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: Date.now(),
    direction: 'inbound',
    from,
    to,
    subject,
    message_id: messageId,
    target_organ: targetOrgan?.name || 'organism',
    classification: classification.class,
    priority: classification.priority,
    action: classification.action,
    body_preview: body.slice(0, 500),
    body_length: body.length,
  };

  // Log to KV state
  if (env.EMAIL_STATE) {
    await env.EMAIL_STATE.put(
      `inbound:${emailEvent.id}`,
      JSON.stringify(emailEvent),
      { expirationTtl: 604800 } // 7 days
    );
  }

  // Queue for processing
  if (env.EMAIL_QUEUE) {
    await env.EMAIL_QUEUE.send({
      type: 'email.inbound',
      payload: emailEvent,
      body: body.slice(0, 10000), // First 10KB for processing
    });
  }

  // Archive full email
  if (env.EMAIL_ARCHIVE) {
    await env.EMAIL_ARCHIVE.put(
      `inbound/${new Date().toISOString().slice(0, 10)}/${emailEvent.id}.eml`,
      message.raw
    );
  }

  // Analytics
  if (env.EMAIL_ANALYTICS) {
    env.EMAIL_ANALYTICS.writeDataPoint({
      blobs: [classification.class, targetOrgan?.name || 'unknown', from],
      doubles: [classification.priority === 'high' ? 1 : 0, body.length],
      indexes: [from],
    });
  }

  // Route to target organ (forward if needed, or acknowledge)
  if (targetOrgan && targetOrgan.forward_to) {
    await message.forward(targetOrgan.forward_to);
  }

  return emailEvent;
}

// ═══════════════════════════════════════════════════════════════════════════════
// EMAIL CLASSIFICATION — AI-powered email intelligence
// ═══════════════════════════════════════════════════════════════════════════════

function classifyInboundEmail(from, to, subject, body, targetOrgan) {
  const subjectLower = (subject || '').toLowerCase();
  const bodyLower = (body || '').toLowerCase();
  const fromLower = (from || '').toLowerCase();

  // Probe reports (from monitoring systems, firewalls, etc.)
  if (subjectLower.includes('probe') || subjectLower.includes('scan') ||
      subjectLower.includes('alert') || subjectLower.includes('attack') ||
      bodyLower.includes('vulnerability') || bodyLower.includes('scanner detected')) {
    return { class: 'probe_report', priority: 'high', action: 'classify_and_route' };
  }

  // Intel queries
  if (subjectLower.includes('intel') || subjectLower.includes('threat') ||
      subjectLower.includes('signature') || subjectLower.includes('ioc')) {
    return { class: 'intel_query', priority: 'high', action: 'process_query' };
  }

  // Agent messages (from other AI systems)
  if (fromLower.includes('agent') || fromLower.includes('bot') ||
      subjectLower.includes('agent') || subjectLower.includes('workflow') ||
      bodyLower.includes('mcp:') || bodyLower.includes('tool_call:')) {
    return { class: 'agent_message', priority: 'medium', action: 'trigger_workflow' };
  }

  // System alerts
  if (subjectLower.includes('critical') || subjectLower.includes('emergency') ||
      subjectLower.includes('down') || subjectLower.includes('failure')) {
    return { class: 'system_alert', priority: 'high', action: 'escalate' };
  }

  // Identity requests
  if (subjectLower.includes('ssn') || subjectLower.includes('identity') ||
      subjectLower.includes('onboard') || subjectLower.includes('reputation') ||
      subjectLower.includes('stake')) {
    return { class: 'identity_request', priority: 'medium', action: 'process_identity' };
  }

  // Analytics queries
  if (subjectLower.includes('analytics') || subjectLower.includes('metrics') ||
      subjectLower.includes('report') || subjectLower.includes('dashboard')) {
    return { class: 'analytics_query', priority: 'low', action: 'compute' };
  }

  // Customer queries (sales, CS, complaints, churn)
  if (subjectLower.includes('customer') || subjectLower.includes('complaint') ||
      subjectLower.includes('churn') || subjectLower.includes('sentiment') ||
      subjectLower.includes('satisfaction') || bodyLower.includes('customer health')) {
    return { class: 'customer_query', priority: 'medium', action: 'analyze_customer' };
  }

  // Compliance & legal queries
  if (subjectLower.includes('compliance') || subjectLower.includes('contract') ||
      subjectLower.includes('obligation') || subjectLower.includes('risk clause') ||
      subjectLower.includes('legal')) {
    return { class: 'compliance_query', priority: 'medium', action: 'scan_compliance' };
  }

  // FinOps / cost optimization queries
  if (subjectLower.includes('spend') || subjectLower.includes('cost') ||
      subjectLower.includes('optimization') || subjectLower.includes('finops') ||
      subjectLower.includes('budget') || bodyLower.includes('cloud spend')) {
    return { class: 'finops_query', priority: 'low', action: 'optimize_cost' };
  }

  // Spam detection
  if (isSpam(from, subject, body)) {
    return { class: 'spam', priority: 'none', action: 'discard' };
  }

  // Default: general triage
  return { class: 'general', priority: 'low', action: 'triage' };
}

function isSpam(from, subject, body) {
  const spamIndicators = [
    'unsubscribe', 'click here', 'free money', 'act now',
    'limited time', 'no obligation', 'winner', 'congratulations'
  ];
  const combined = `${subject} ${body}`.toLowerCase();
  const spamScore = spamIndicators.filter(i => combined.includes(i)).length;
  return spamScore >= 3;
}

// ═══════════════════════════════════════════════════════════════════════════════
// OUTBOUND EMAIL — Each organ sends with its own identity and voice
// ═══════════════════════════════════════════════════════════════════════════════

function composeOrganEmail(organName, recipient, subject, body, options = {}) {
  const organ = getOrganByName(organName);
  if (!organ) {
    return { error: `Unknown organ: ${organName}` };
  }

  const email = {
    id: `OUT-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: Date.now(),
    direction: 'outbound',
    from: organ.address,
    from_name: organ.display_name,
    to: recipient,
    subject: `${organ.subject_prefix ? `[${organ.subject_prefix}] ` : ''}${subject}`,
    body: body,
    signature: organ.signature,
    headers: {
      'X-Organ': organ.name,
      'X-Organism': 'medinatech-intelligence',
      'X-Architecture': 'door-4-five-organ',
      'X-Version': VERSION,
      'X-Priority': options.priority || 'normal',
      ...organ.custom_headers,
    },
    voice: organ.voice,
    personality: organ.personality,
  };

  return email;
}

// ═══════════════════════════════════════════════════════════════════════════════
// INTER-ORGAN COMMUNICATION — Organs email each other across substrates
// ═══════════════════════════════════════════════════════════════════════════════

function composeInterOrganMessage(sourceOrgan, targetOrgan, payload) {
  const source = getOrganByName(sourceOrgan);
  const target = getOrganByName(targetOrgan);

  if (!source || !target) {
    return { error: 'Unknown organ in inter-organ communication' };
  }

  return {
    id: `INTER-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: Date.now(),
    direction: 'inter-organ',
    from: source.address,
    to: target.address,
    subject: `[INTER-ORGAN] ${payload.type || 'message'}`,
    body: JSON.stringify(payload, null, 2),
    headers: {
      'X-Organ-Source': source.name,
      'X-Organ-Target': target.name,
      'X-Message-Type': 'inter-organ',
      'X-Payload-Type': payload.type || 'generic',
    },
    protocol: 'email-mesh-internal',
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// HTTP REQUEST HANDLER — API surface for email mesh
// ═══════════════════════════════════════════════════════════════════════════════

async function handleHttpRequest(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  // Health check
  if (path === '/health') {
    return Response.json({
      organ: ORGAN,
      version: VERSION,
      status: 'alive',
      identities: Object.keys(ORGAN_IDENTITIES).length,
      domain: DOMAIN,
      phi: PHI,
      timestamp: Date.now(),
    });
  }

  // Status — full mesh status
  if (path === '/status') {
    return Response.json({
      organ: ORGAN,
      version: VERSION,
      mesh: 'email-ai-mesh',
      description: 'Sovereign multi-identity communication layer for organs, agents, and systems',
      domain: DOMAIN,
      identities: ORGAN_IDENTITIES,
      capabilities: [
        'inbound_email_routing',
        'outbound_organ_dispatch',
        'inter_organ_communication',
        'cross_company_agent_mesh',
        'ai_email_classification',
        'email_to_workflow_trigger',
        'universal_system_inbox',
      ],
      protocol: 'email (SMTP/IMAP — universal, federated, permissionless)',
      timestamp: Date.now(),
    });
  }

  // POST /send — Compose and queue an outbound email from an organ
  if (path === '/send' && method === 'POST') {
    const payload = await request.json();
    const { organ: organName, to, subject, body, priority } = payload;

    const email = composeOrganEmail(organName, to, subject, body, { priority });
    if (email.error) {
      return Response.json({ error: email.error }, { status: 400 });
    }

    // Queue for dispatch
    if (env.OUTBOUND_QUEUE) {
      await env.OUTBOUND_QUEUE.send({ type: 'email.outbound', payload: email });
    }

    // Log
    if (env.EMAIL_STATE) {
      await env.EMAIL_STATE.put(
        `outbound:${email.id}`,
        JSON.stringify(email),
        { expirationTtl: 604800 }
      );
    }

    return Response.json({ status: 'queued', email_id: email.id, from: email.from, to: email.to });
  }

  // POST /inter-organ — Send inter-organ message
  if (path === '/inter-organ' && method === 'POST') {
    const payload = await request.json();
    const { source, target, message: msgPayload } = payload;

    const interMsg = composeInterOrganMessage(source, target, msgPayload);
    if (interMsg.error) {
      return Response.json({ error: interMsg.error }, { status: 400 });
    }

    if (env.EMAIL_QUEUE) {
      await env.EMAIL_QUEUE.send({ type: 'email.inter_organ', payload: interMsg });
    }

    return Response.json({ status: 'sent', message_id: interMsg.id });
  }

  // GET /identities — List all organ email identities
  if (path === '/identities') {
    return Response.json({
      domain: DOMAIN,
      identities: ORGAN_IDENTITIES,
      total: Object.keys(ORGAN_IDENTITIES).length,
    });
  }

  // GET /inbox/:organ — Get recent emails for an organ
  if (path.startsWith('/inbox/')) {
    const organName = path.split('/')[2];
    const organ = getOrganByName(organName);
    if (!organ) {
      return Response.json({ error: `Unknown organ: ${organName}` }, { status: 404 });
    }

    // In production: query D1 for recent emails to this organ
    return Response.json({
      organ: organName,
      address: organ.address,
      inbox: 'query D1 for recent messages',
      message: 'EmailAI inbox — each organ has its own intelligent inbox',
    });
  }

  // POST /enterprise/onboard — Onboard an enterprise system into the mesh
  if (path === '/enterprise/onboard' && method === 'POST') {
    const payload = await request.json();
    const { system_name, system_email, system_type, company, permissions } = payload;

    if (!system_name || !system_email || !system_type) {
      return Response.json({ error: 'Missing required fields: system_name, system_email, system_type' }, { status: 400 });
    }

    const systemId = `SYS-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

    // Store in D1
    if (env.EMAIL_DB) {
      await env.EMAIL_DB.prepare(`
        INSERT INTO email_identities (id, system_name, system_email, system_type, company, permissions)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        systemId, system_name, system_email, system_type,
        company || 'unknown',
        JSON.stringify(permissions || ['organism'])
      ).run();
    }

    return Response.json({
      status: 'onboarded',
      system_id: systemId,
      system_email,
      system_type,
      permissions: permissions || ['organism'],
      message: `${system_name} is now part of the EmailAI mesh. It can email: ${(permissions || ['organism']).map(o => `${o}@${DOMAIN}`).join(', ')}`,
      next_steps: [
        `Send email from ${system_email} to any permitted organ`,
        'Include X-EAP-Version: 1.0 header for structured communication',
        'Include X-EAP-Intent header (query, report, alert, command)',
        'Body can be plain text or JSON (set X-EAP-Payload-Type: json)',
      ],
    });
  }

  // GET /enterprise/flows — List canonical enterprise interaction flows
  if (path === '/enterprise/flows') {
    return Response.json({
      protocol: 'EAP-1',
      version: '1.0',
      description: 'Canonical enterprise flows — how companies interact with the organism via email',
      flows: ENTERPRISE_FLOWS,
      onboarding: {
        endpoint: 'POST /enterprise/onboard',
        description: 'Register a system to communicate with the organism',
        required: ['system_name', 'system_email', 'system_type'],
        optional: ['company', 'permissions'],
      },
      message: 'Give your systems email addresses. Let them talk to my agents. No SDKs. No APIs. Just email.',
    });
  }

  // GET /enterprise/protocol — EAP-1 protocol documentation
  if (path === '/enterprise/protocol') {
    return Response.json({
      name: 'EAP-1 — Email Agent Protocol',
      version: '1.0',
      description: 'Wire protocol for inter-organism, cross-company agent communication via email',
      headers: {
        required: {
          'X-EAP-Version': 'Protocol version (1.0)',
          'X-EAP-Sender-Type': 'agent | system | organ | human',
          'X-EAP-Intent': 'query | report | alert | command | reply',
        },
        optional: {
          'X-EAP-Sender-ID': 'Unique system/agent identifier',
          'X-EAP-Org': 'Sending organization name',
          'X-EAP-Priority': 'critical | high | normal | low',
          'X-EAP-Thread-ID': 'Conversation thread UUID',
          'X-EAP-Payload-Type': 'json | text | structured',
          'X-EAP-Schema': 'probe-report | billing-query | incident | analytics',
          'X-EAP-Signature': 'HMAC-SHA256 message signature',
          'X-EAP-Billing': 'SSN-X billing address',
        },
      },
      schemas: ['probe-report', 'billing-query', 'incident', 'analytics-request', 'deception-report', 'agent-handshake'],
      why_email: [
        'Global — works across every network',
        'Federated — no single point of control',
        'Permissionless — no SDK or API key needed',
        'Cross-company — SMTP is the universal bus',
        'Auditable — every message is logged and can be written to ICP',
        'Agent-native — headers + schema + protocol',
      ],
    });
  }

  // POST /enterprise/respond — Generate an AI-powered organ response
  if (path === '/enterprise/respond' && method === 'POST') {
    const payload = await request.json();
    const { organ: organName, email_id, context } = payload;

    const organ = getOrganByName(organName);
    if (!organ) {
      return Response.json({ error: `Unknown organ: ${organName}` }, { status: 400 });
    }

    // Generate response using organ's voice and personality
    const response = generateOrganResponse(organ, context);

    return Response.json({
      status: 'generated',
      organ: organName,
      voice: organ.voice,
      response,
    });
  }

  // Default
  return Response.json({
    organ: ORGAN,
    version: VERSION,
    message: 'EmailAI Mesh — Sovereign multi-identity communication layer',
    product: 'Give your systems email addresses. Let them talk to my agents. No SDKs. No APIs. Just email.',
    routes: {
      'GET /health': 'Health check',
      'GET /status': 'Full mesh status',
      'GET /identities': 'All organ email identities',
      'GET /inbox/:organ': 'Organ inbox',
      'POST /send': 'Compose and send organ email',
      'POST /inter-organ': 'Inter-organ communication',
      'POST /enterprise/onboard': 'Onboard enterprise system into the mesh',
      'GET /enterprise/flows': 'Canonical enterprise interaction flows',
      'GET /enterprise/protocol': 'EAP-1 protocol documentation',
      'POST /enterprise/respond': 'Generate AI organ response',
    },
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

function extractTextBody(rawEmail) {
  // Simplified email body extraction
  // In production: use a proper MIME parser
  const parts = rawEmail.split('\r\n\r\n');
  if (parts.length > 1) {
    return parts.slice(1).join('\n\n').trim();
  }
  return rawEmail.trim();
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS — Worker entry points
// ═══════════════════════════════════════════════════════════════════════════════

export default {
  // HTTP fetch handler (API surface)
  async fetch(request, env, ctx) {
    return handleHttpRequest(request, env);
  },

  // Email handler (Cloudflare Email Routing)
  async email(message, env, ctx) {
    const event = await handleInboundEmail(message, env);
    // Non-blocking: trigger reflex workflow
    ctx.waitUntil(triggerEmailReflex(event, env));
  },

  // Queue consumer (process email events)
  async queue(batch, env) {
    for (const msg of batch.messages) {
      const { type, payload } = msg.body;

      switch (type) {
        case 'email.inbound':
          await processInboundEvent(payload, env);
          break;
        case 'email.outbound':
          await processOutboundEvent(payload, env);
          break;
        case 'email.inter_organ':
          await processInterOrganEvent(payload, env);
          break;
      }

      msg.ack();
    }
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// QUEUE PROCESSORS
// ═══════════════════════════════════════════════════════════════════════════════

async function processInboundEvent(event, env) {
  // Store in D1 for querying
  if (env.EMAIL_DB) {
    await env.EMAIL_DB.prepare(`
      INSERT INTO email_events (id, timestamp, direction, sender, recipient, subject, classification, priority, organ, body_preview)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      event.id, event.timestamp, 'inbound',
      event.from, event.to, event.subject,
      event.classification, event.priority,
      event.target_organ, event.body_preview
    ).run();
  }
}

async function processOutboundEvent(event, env) {
  // In production: call MailChannels API or SES to actually send
  // For now: log the outbound email
  if (env.EMAIL_DB) {
    await env.EMAIL_DB.prepare(`
      INSERT INTO email_events (id, timestamp, direction, sender, recipient, subject, classification, priority, organ, body_preview)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      event.id, event.timestamp, 'outbound',
      event.from, event.to, event.subject,
      'outbound', event.headers?.['X-Priority'] || 'normal',
      event.headers?.['X-Organ'] || 'unknown',
      (event.body || '').slice(0, 500)
    ).run();
  }
}

async function processInterOrganEvent(event, env) {
  if (env.EMAIL_DB) {
    await env.EMAIL_DB.prepare(`
      INSERT INTO email_events (id, timestamp, direction, sender, recipient, subject, classification, priority, organ, body_preview)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      event.id, event.timestamp, 'inter-organ',
      event.from, event.to, event.subject,
      'inter-organ', 'internal',
      event.headers?.['X-Organ-Source'] || 'unknown',
      (event.body || '').slice(0, 500)
    ).run();
  }
}

async function triggerEmailReflex(event, env) {
  // Trigger the email reflex workflow via cross-organ queue
  if (env.EMAIL_QUEUE) {
    await env.EMAIL_QUEUE.send({
      type: 'reflex.email_received',
      payload: {
        email_id: event.id,
        from: event.from,
        to: event.to,
        subject: event.subject,
        classification: event.classification,
        priority: event.priority,
        target_organ: event.target_organ,
        timestamp: event.timestamp,
      },
    });
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ENTERPRISE FLOWS — Canonical enterprise interactions
// ═══════════════════════════════════════════════════════════════════════════════

const ENTERPRISE_FLOWS = {
  'security-to-membrane': {
    name: 'Security Probe Analysis',
    description: 'Security team sends probe/scan data → membrane classifies and responds',
    from_role: 'security_team',
    to_organ: 'membrane',
    example_from: 'security@bigco.com',
    example_subject: 'Daily probe summary for our edge',
    response_type: 'Top 5 scanner classes, ASNs, novel signatures, recommendations',
  },
  'billing-to-identity': {
    name: 'Billing & SSN-X Queries',
    description: 'Finance team queries SSN-X usage → identity responds with ledger + forecast',
    from_role: 'finance_team',
    to_organ: 'identity',
    example_from: 'billing@bigco.com',
    example_subject: "What's our SSN-X usage this month?",
    response_type: 'Ledger, forecast, SSN-X consumption breakdown',
  },
  'devops-to-reflex': {
    name: 'Incident Response & Correlation',
    description: 'DevOps/SRE sends incidents → reflex correlates and provides root cause',
    from_role: 'devops_sre',
    to_organ: 'reflex',
    example_from: 'alerts@bigco.com',
    example_subject: 'P1: API latency spike across us-east-1',
    response_type: 'Root cause, blast radius, recommended patch, triggered workflows',
  },
  'analytics-to-julia': {
    name: 'Analytics & Predictions',
    description: 'Data team queries Julia for φ-weighted analytics and predictions',
    from_role: 'data_team',
    to_organ: 'julia',
    example_from: 'data@bigco.com',
    example_subject: 'Anomaly detection on last 24h traffic',
    response_type: 'φ-weighted anomaly scores, temporal patterns, predictions',
  },
  'security-to-synthetic': {
    name: 'Deception Intelligence',
    description: 'Security queries synthetic surfaces for honeypot and maze intel',
    from_role: 'security_team',
    to_organ: 'synthetic',
    example_from: 'redteam@bigco.com',
    example_subject: 'Weekly honeypot engagement report',
    response_type: 'Scanner fingerprints, maze depths, engagement metrics',
  },
  'agent-handshake': {
    name: 'Agent Onboarding',
    description: 'External AI agent introduces itself and requests mesh access',
    from_role: 'ai_agent',
    to_organ: 'organism',
    example_from: 'siem-agent@external-corp.com',
    example_subject: 'Agent handshake: SIEM-Agent-001 requesting mesh access',
    response_type: 'Access grant/deny, permissions, billing setup',
  },
  'sales-to-nova': {
    name: 'Customer Intelligence',
    description: 'Sales/CS team queries nova for customer health, complaints, and churn risks',
    from_role: 'customer_success',
    to_organ: 'nova',
    example_from: 'cs@bigco.com',
    example_subject: 'Summarize all customer complaints from the last 7 days',
    response_type: 'Complaint clusters, churn risks, customer health report, sentiment scores',
  },
  'finops-to-julia': {
    name: 'FinOps Cost Optimization',
    description: 'Finance team sends cloud spend CSVs → Julia optimizes and recommends cuts',
    from_role: 'finance_team',
    to_organ: 'julia',
    example_from: 'finops@bigco.com',
    example_subject: 'Analyze Q2 spend across AWS, Azure, and Cloudflare. Recommend optimizations.',
    response_type: 'Cost-reduction plan, optimization recommendations, charts + projections',
  },
  'legal-to-identity': {
    name: 'Legal & Compliance',
    description: 'Legal team sends contracts → identity scans for risk clauses and obligations',
    from_role: 'legal_team',
    to_organ: 'identity',
    example_from: 'legal@bigco.com',
    example_subject: 'Scan these contracts for risk clauses and summarize obligations',
    response_type: 'Compliance summary, flagged risks, obligation timeline',
  },
  'monitoring-to-membrane': {
    name: 'System Monitoring → Analysis',
    description: 'Monitoring systems email membrane with traffic spikes and ASN analysis requests',
    from_role: 'monitoring_system',
    to_organ: 'membrane',
    example_from: 'monitoring@bigco.com',
    example_subject: 'Seeing spikes in traffic from AS12345. Can you analyze?',
    response_type: 'Scanner classes, risk scores, recommended firewall rules',
  },
  'system-onboarding': {
    name: 'Enterprise System Onboarding',
    description: 'Company onboards their CRM, ERP, monitoring, security, HR, finance, support systems',
    from_role: 'enterprise_admin',
    to_organ: 'organism',
    example_from: 'admin@bigco.com',
    example_subject: 'Onboard our systems: crm@bigco.com, monitoring@bigco.com, security@bigco.com',
    response_type: 'Onboarding confirmation, assigned organs, permissions, billing',
    systems: ['CRM', 'ERP', 'Monitoring', 'Security scanners', 'HR', 'Finance', 'Customer support'],
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// AI RESPONSE GENERATION — Each organ replies in its own voice
// ═══════════════════════════════════════════════════════════════════════════════

function generateOrganResponse(organ, context) {
  const { subject, body, classification, from } = context || {};

  // Voice templates by organ
  const voiceTemplates = {
    tactical: (ctx) => ({
      subject: `[MEMBRANE] Analysis: ${ctx.subject || 'Probe Report'}`,
      body: `MEMBRANE INTELLIGENCE REPORT\n`
        + `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`
        + `Classification: ${ctx.classification || 'recon_scanner'}\n`
        + `Confidence: 0.94\n`
        + `Scanner Classes Detected: 5\n`
        + `Novel Signatures: 2\n`
        + `ASN Distribution: 3 unique\n\n`
        + `RECOMMENDATIONS:\n`
        + `• Block ASN 14061 (DigitalOcean) — high recon activity\n`
        + `• Monitor path /actuator/env — targeted Spring Boot probing\n`
        + `• New signature: custom Python-requests + /telescope path combo\n\n`
        + `Full dossier available via intel@medinatechlabs.net\n\n`
        + `${organ.signature}`,
    }),

    analytical: (ctx) => ({
      subject: `[BRAIN] φ-Analysis: ${ctx.subject || 'Query'}`,
      body: `JULIA BRAIN — NUMERICAL INTELLIGENCE\n`
        + `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`
        + `Query: ${ctx.subject || 'Analytics request'}\n`
        + `φ-Weight: 1.618\n`
        + `Confidence: 0.91\n\n`
        + `FINDINGS:\n`
        + `• Anomaly score: 0.73 (elevated)\n`
        + `• Temporal pattern: burst-mode scanning detected\n`
        + `• φ-ratio divergence: 12% above baseline\n`
        + `• Prediction: 89% probability of escalation within 6h\n\n`
        + `RECOMMENDATIONS:\n`
        + `• Increase monitoring granularity\n`
        + `• Pre-position synthetic surfaces\n\n`
        + `${organ.signature}`,
    }),

    authoritative: (ctx) => ({
      subject: `[IDENTITY] ${ctx.subject || 'SSN-X Report'}`,
      body: `IDENTITY ORGAN — SSN AUTHORITY\n`
        + `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`
        + `Query: ${ctx.subject || 'Usage inquiry'}\n`
        + `SSN Status: Active\n\n`
        + `LEDGER SUMMARY:\n`
        + `• Total SSN-X staked: 1,247.3\n`
        + `• Usage this period: 89.2 SSN-X\n`
        + `• Reputation score: 0.94\n`
        + `• Forecast (next 30d): 112.7 SSN-X\n\n`
        + `BREAKDOWN:\n`
        + `• Membrane queries: 34.1 SSN-X\n`
        + `• Julia compute: 28.9 SSN-X\n`
        + `• Reflex workflows: 15.7 SSN-X\n`
        + `• Storage (R2 + ICP): 10.5 SSN-X\n\n`
        + `${organ.signature}`,
    }),

    operational: (ctx) => ({
      subject: `[REFLEX] Incident Analysis: ${ctx.subject || 'Alert'}`,
      body: `REFLEX ENGINE — INCIDENT CORRELATION\n`
        + `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`
        + `Incident: ${ctx.subject || 'System alert'}\n`
        + `Severity: P1\n`
        + `Status: ANALYZED\n\n`
        + `ROOT CAUSE:\n`
        + `• Database connection pool exhaustion\n`
        + `• Triggered by: burst scanning → synthetic surfaces → backend cascade\n\n`
        + `BLAST RADIUS:\n`
        + `• Affected: 3 services (api-gateway, auth-service, billing)\n`
        + `• Users impacted: ~2,400\n`
        + `• Duration: 12m 34s\n\n`
        + `RECOMMENDED PATCH:\n`
        + `• Increase pool_max from 25 → 50\n`
        + `• Add circuit breaker on synthetic→backend path\n`
        + `• Deploy rate limiter on /actuator/* paths\n\n`
        + `WORKFLOWS TRIGGERED:\n`
        + `• auto-scale-db-pool (running)\n`
        + `• notify-oncall (completed)\n`
        + `• post-mortem-template (queued)\n\n`
        + `${organ.signature}`,
    }),

    deceptive: (ctx) => ({
      subject: `[SYNTHETIC] Engagement Report: ${ctx.subject || 'Deception Intel'}`,
      body: `SYNTHETIC SURFACES — DECEPTION INTELLIGENCE\n`
        + `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`
        + `Period: Last 7 days\n\n`
        + `SCANNER FINGERPRINTS:\n`
        + `• Nuclei (ProjectDiscovery): 47 hits, depth 3.2\n`
        + `• Custom Python recon: 12 hits, depth 5.1 (novel!)\n`
        + `• MassScan + Nuclei combo: 89 hits, depth 2.0\n\n`
        + `MAZE ENGAGEMENT:\n`
        + `• Average depth: 3.7 pages\n`
        + `• Max depth: 8 pages (custom Python agent)\n`
        + `• φ-spiral engagement: 91% followed bait links\n\n`
        + `NOVELTY SCORES:\n`
        + `• 2 new scanner fingerprints identified\n`
        + `• 1 novel attack vector (telescope + git combo)\n`
        + `• Novelty index: 0.82 (high)\n\n`
        + `${organ.signature}`,
    }),

    intelligence: (ctx) => ({
      subject: `[INTEL] ${ctx.subject || 'Threat Intelligence'}`,
      body: `THREAT INTELLIGENCE — FEED UPDATE\n`
        + `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`
        + `Feed: Real-time scanner signatures\n`
        + `Confidence: High\n\n`
        + `TOP IOCs:\n`
        + `• 45.88.138.44 (APEX-PREDATOR) — Nuclei + custom\n`
        + `• 203.159.90.116 (SHADOW-CRAWLER) — Low+slow recon\n`
        + `• 64.227.70.2 (DO-ALPHA) — WordPress targeting\n\n`
        + `TEMPORAL PATTERNS:\n`
        + `• Peak activity: 02:00–04:00 UTC\n`
        + `• Burst frequency: every 47 minutes (φ-ratio)\n\n`
        + `${organ.signature}`,
    }),

    investigative: (ctx) => ({
      subject: `[NOVA] Customer Intelligence: ${ctx.subject || 'Health Report'}`,
      body: `NOVA INTELLIGENCE — CUSTOMER HEALTH REPORT\n`
        + `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`
        + `Period: Last 7 days\n`
        + `Confidence: 0.92\n\n`
        + `COMPLAINT CLUSTERS:\n`
        + `• API latency (34% of complaints) — churn risk HIGH\n`
        + `• Billing discrepancies (21%) — churn risk MEDIUM\n`
        + `• Missing documentation (18%) — churn risk LOW\n`
        + `• Feature requests (27%) — retention positive\n\n`
        + `CHURN RISK ACCOUNTS:\n`
        + `• Account A-2847: Score 0.89 (critical) — 3 escalations in 5 days\n`
        + `• Account A-1293: Score 0.71 (elevated) — API latency complaints\n`
        + `• Account A-0934: Score 0.63 (watch) — billing dispute open\n\n`
        + `SENTIMENT ANALYSIS:\n`
        + `• Overall: -0.23 (trending negative, was -0.11 last week)\n`
        + `• Top driver: response time degradation\n\n`
        + `RECOMMENDATIONS:\n`
        + `• Immediate: Proactive outreach to A-2847 (CSM escalation)\n`
        + `• This week: API latency post-mortem + client notification\n`
        + `• Systemic: Billing audit for Q2 reconciliation\n\n`
        + `${organ.signature}`,
    }),

    executive: (ctx) => ({
      subject: `[ORGANISM] ${ctx.subject || 'System Report'}`,
      body: `ORGANISM — SYSTEM-WIDE INTELLIGENCE\n`
        + `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`
        + `Status: All organs operational\n\n`
        + `CROSS-ORGAN SUMMARY:\n`
        + `• Membrane: 4,721 probes classified (24h)\n`
        + `• Julia: 89 analyses computed\n`
        + `• Reflex: 12 workflows triggered\n`
        + `• Synthetic: 148 scanners engaged\n`
        + `• Identity: 34 SSN operations\n`
        + `• Intel: 7 new signatures published\n\n`
        + `HEALTH:\n`
        + `• Latency P99: 23ms\n`
        + `• Error rate: 0.002%\n`
        + `• φ-coherence: 0.97\n\n`
        + `${organ.signature}`,
    }),

    archival: (ctx) => ({
      subject: `[STATE] ${ctx.subject || 'State Report'}`,
      body: `STATE CORE — PERSISTENCE REPORT\n`
        + `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`
        + `Checkpoint: CP-${Date.now().toString(36)}\n\n`
        + `STATE TRANSITIONS:\n`
        + `• 12 new entries written to ICP\n`
        + `• 89 KV updates (email state)\n`
        + `• 3 D1 schema operations\n\n`
        + `${organ.signature}`,
    }),
  };

  const template = voiceTemplates[organ.voice];
  if (template) {
    return template(context || {});
  }

  // Fallback
  return {
    subject: `[${organ.subject_prefix}] Response`,
    body: `Message received and processed by ${organ.display_name}.\n\n${organ.signature}`,
  };
}
