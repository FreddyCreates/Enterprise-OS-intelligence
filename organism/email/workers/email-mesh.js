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

import { ORGAN_IDENTITIES, getOrganByAddress, getOrganByName } from '../identities/registry.js';

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

  // Default
  return Response.json({
    organ: ORGAN,
    version: VERSION,
    message: 'EmailAI Mesh — Sovereign multi-identity communication layer',
    routes: {
      'GET /health': 'Health check',
      'GET /status': 'Full mesh status',
      'GET /identities': 'All organ email identities',
      'GET /inbox/:organ': 'Organ inbox',
      'POST /send': 'Compose and send organ email',
      'POST /inter-organ': 'Inter-organ communication',
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
