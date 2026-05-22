/**
 * EMAIL REFLEX — Inbound Email Classification & Routing Workflow
 *
 * Designation:  ORGANISM-REFLEX-003
 * Architecture: Door 4 — 5-Organ Computational Organism
 *
 * This is the email reflex arc:
 *   email → mesh → workflow → classify → route → respond → log
 *
 * Trigger: email.received event from email mesh organ
 *
 * Steps:
 *   1. Parse email features (from, to, subject, body, headers)
 *   2. Classify email type (probe report, agent message, system alert, etc.)
 *   3. Route to target organ
 *   4. Generate auto-response if needed
 *   5. Update sender reputation (via ICP SSN)
 *   6. Log to State Core
 *
 * This enables:
 *   - AI agents emailing your membrane → probe gets classified
 *   - Security scanners emailing your intel organ → added to feed
 *   - DevOps agents emailing your reflex → triggers workflows
 *   - Companies emailing identity → SSN onboarding starts
 *
 * © 2026 Alfredo Medina Hernandez. All Rights Reserved.
 */

const PHI = 1.618033988749895;

export default {
  async run(event, step, env) {
    const email = event.payload;

    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 1: Parse and normalize email features
    // ═══════════════════════════════════════════════════════════════════════════
    const features = await step.do('parse_email_features', async () => {
      return {
        from: email.from || 'unknown',
        to: email.to || 'unknown',
        subject: email.subject || '',
        target_organ: email.target_organ || 'organism',
        classification: email.classification || 'general',
        priority: email.priority || 'low',
        timestamp: email.timestamp || Date.now(),

        // Derived features
        from_domain: (email.from || '').split('@')[1] || 'unknown',
        is_internal: (email.from || '').endsWith('@medinatechlabs.net'),
        is_agent: detectAgentSender(email.from, email.subject),
        has_structured_payload: detectStructuredPayload(email.body_preview),
        urgency_score: computeUrgencyScore(email.subject, email.priority),
      };
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 2: Deep classification (beyond edge classification)
    // ═══════════════════════════════════════════════════════════════════════════
    const deep_classification = await step.do('deep_classify', async () => {
      // If it's an agent message with structured payload, parse the intent
      if (features.is_agent && features.has_structured_payload) {
        return {
          type: 'agent_communication',
          protocol: 'email-mesh',
          action: 'process_agent_request',
          auto_respond: true,
          route_to: features.target_organ,
        };
      }

      // If it's internal inter-organ communication
      if (features.is_internal) {
        return {
          type: 'inter_organ',
          protocol: 'internal',
          action: 'route_directly',
          auto_respond: false,
          route_to: features.target_organ,
        };
      }

      // Map classification to routing action
      const routing_map = {
        probe_report: { action: 'classify_probe', route_to: 'membrane', auto_respond: true },
        intel_query: { action: 'query_intel', route_to: 'intel', auto_respond: true },
        agent_message: { action: 'trigger_workflow', route_to: 'reflex', auto_respond: true },
        system_alert: { action: 'escalate', route_to: 'organism', auto_respond: true },
        identity_request: { action: 'process_identity', route_to: 'identity', auto_respond: true },
        analytics_query: { action: 'compute', route_to: 'julia', auto_respond: true },
        general: { action: 'triage', route_to: 'organism', auto_respond: false },
        spam: { action: 'discard', route_to: null, auto_respond: false },
      };

      const route = routing_map[features.classification] || routing_map.general;
      return {
        type: features.classification,
        protocol: 'email',
        ...route,
      };
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 3: Route to target organ
    // ═══════════════════════════════════════════════════════════════════════════
    const routing_result = await step.do('route_to_organ', async () => {
      if (deep_classification.action === 'discard') {
        return { routed: false, reason: 'spam_discarded' };
      }

      const target = deep_classification.route_to || features.target_organ;
      return {
        routed: true,
        target_organ: target,
        action: deep_classification.action,
        email_id: email.id || 'unknown',
      };
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 4: Generate auto-response if applicable
    // ═══════════════════════════════════════════════════════════════════════════
    const auto_response = await step.do('auto_respond', async () => {
      if (!deep_classification.auto_respond) {
        return { sent: false, reason: 'auto_respond_disabled' };
      }

      // Generate response based on organ voice
      const response = generateAutoResponse(
        routing_result.target_organ,
        features.classification,
        email
      );

      return {
        sent: true,
        response_subject: response.subject,
        response_preview: response.body.slice(0, 200),
        from_organ: routing_result.target_organ,
      };
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 5: Update sender reputation
    // ═══════════════════════════════════════════════════════════════════════════
    const reputation = await step.do('update_reputation', async () => {
      // Map email behavior to reputation score
      const reputation_map = {
        probe_report: 0.1,   // Sharing intel = positive
        intel_query: 0.0,    // Neutral
        agent_message: 0.05, // Agent comm = slightly positive
        system_alert: 0.0,   // Neutral
        identity_request: 0.0, // Neutral
        analytics_query: 0.0,  // Neutral
        general: 0.0,        // Neutral
        spam: -0.5,          // Spam = negative
      };

      const score = reputation_map[features.classification] || 0;

      return {
        sender: features.from,
        sender_domain: features.from_domain,
        behavior_score: score,
        action: score < 0 ? 'throttle' : 'allow',
      };
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 6: Log to State Core
    // ═══════════════════════════════════════════════════════════════════════════
    await step.do('log_to_state', async () => {
      return {
        event_type: 'email_reflex_completed',
        email_id: email.id,
        from: features.from,
        target_organ: routing_result.target_organ,
        classification: features.classification,
        action_taken: deep_classification.action,
        auto_responded: auto_response.sent,
        reputation_delta: reputation.behavior_score,
        timestamp: Date.now(),
      };
    });

    // Return full reflex result
    return {
      workflow: 'email_reflex',
      status: 'completed',
      email_id: email.id,
      classification: deep_classification,
      routing: routing_result,
      auto_response: auto_response,
      reputation: reputation,
    };
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

function detectAgentSender(from, subject) {
  const agentIndicators = ['agent', 'bot', 'system', 'auto', 'noreply', 'daemon'];
  const combined = `${from} ${subject}`.toLowerCase();
  return agentIndicators.some(i => combined.includes(i));
}

function detectStructuredPayload(body) {
  if (!body) return false;
  // Check for JSON, MCP commands, or structured data
  return body.includes('{') || body.includes('mcp:') || body.includes('tool_call:');
}

function computeUrgencyScore(subject, priority) {
  let score = 0;
  if (priority === 'high') score += 0.5;
  const urgentWords = ['critical', 'emergency', 'urgent', 'attack', 'breach', 'down'];
  const subjectLower = (subject || '').toLowerCase();
  score += urgentWords.filter(w => subjectLower.includes(w)).length * 0.2;
  return Math.min(1.0, score);
}

function generateAutoResponse(organName, classification, originalEmail) {
  const responses = {
    membrane: {
      subject: `[MEMBRANE] Acknowledged: ${originalEmail.subject}`,
      body: `Probe data received and classified.\n\n`
        + `Classification: ${classification}\n`
        + `Status: Routed to membrane for analysis.\n`
        + `Probe ID will be assigned upon processing.\n\n`
        + `— Membrane Gateway\n  Organism Probe Classification & Routing`,
    },
    julia: {
      subject: `[BRAIN] Computing: ${originalEmail.subject}`,
      body: `Analytics query received.\n\n`
        + `Your request has been queued for φ-weighted computation.\n`
        + `Expected response: within next processing cycle.\n\n`
        + `— Julia Brain\n  φ-Weighted Numerical Intelligence`,
    },
    identity: {
      subject: `[IDENTITY] Processing: ${originalEmail.subject}`,
      body: `Identity request received.\n\n`
        + `Your request is being processed by the SSN authority.\n`
        + `You will receive a confirmation with your SSN designation.\n\n`
        + `— Identity Organ\n  SSN & Reputation Authority`,
    },
    reflex: {
      subject: `[REFLEX] Triggered: ${originalEmail.subject}`,
      body: `Workflow triggered by your message.\n\n`
        + `Event type: ${classification}\n`
        + `Status: Processing through reflex arc.\n\n`
        + `— Reflex Engine\n  Adaptive Workflow Orchestration`,
    },
    intel: {
      subject: `[INTEL] Received: ${originalEmail.subject}`,
      body: `Intelligence query received.\n\n`
        + `Your request is being processed against our threat database.\n`
        + `Relevant signatures and patterns will be returned.\n\n`
        + `— Threat Intelligence\n  Scanner Signatures & Probe Patterns`,
    },
    organism: {
      subject: `[ORGANISM] Received: ${originalEmail.subject}`,
      body: `Your message has been received by the organism.\n\n`
        + `Classification: ${classification}\n`
        + `It has been routed to the appropriate organ for processing.\n\n`
        + `— Organism\n  5-Organ Computational Intelligence`,
    },
  };

  return responses[organName] || responses.organism;
}
