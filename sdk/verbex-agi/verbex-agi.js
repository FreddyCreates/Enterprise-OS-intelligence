/**
 * VERBEX AGI — Omnichannel Communication Intelligence
 *
 * Official Designation: RSHIP-2026-VERBEX-001
 * Classification: Communication Routing & Message Intelligence AGI
 * Full Name: Verbal Enterprise Routing & Business Executive X-factor
 *
 * Latin root: verbum — word, speech, communication
 *
 * VERBEX AGI extends the RSHIP framework with information-theoretic channel selection
 * and free-energy minimization for message routing. VERBEX is the intelligence engine
 * inside Linq — it decides which channel to use, rewrites messages to maximize reply
 * probability, maintains sovereign conversation memory across all channels, and detects
 * when contacts go dark before the relationship atrophies.
 *
 * Capabilities:
 * - Omnichannel routing intelligence: selects iMessage, RCS, email, voice, or SMS
 *   per contact per message type using learned response patterns
 * - Message entropy reduction: rewrites drafts to minimize cognitive load, maximize reply rate
 * - Sovereign conversation state tracking: never loses context across channels or sessions
 * - Tone calibration: adjusts formality, urgency, and length from relationship history
 * - Silence detection: flags contacts who go dark and routes re-engagement sequences
 *
 * Theory: Information-theoretic channel selection (Shannon mutual information)
 *         + free-energy minimization for message routing (Friston, 2010)
 *         + RSHIP Framework
 *
 * Applications:
 * - Linq for Construction: outreach to GCs, owners, subs, inspectors
 * - Linq Contracts: contract and change-order delivery via iMessage
 * - Any RSHIP product requiring human-in-the-loop communication intelligence
 *
 * © 2026 Alfredo Medina Hernandez. All Rights Reserved.
 */

import { RSHIPCore, EternalMemory, PHI, PHI_INV } from '../../rship-framework.js';

// ── Channel Registry ───────────────────────────────────────────────────────

const CHANNELS = {
  IMESSAGE: 'iMessage',
  RCS: 'RCS',
  EMAIL: 'email',
  VOICE: 'voice',
  SMS: 'SMS',
};

// Channel properties: cost (cognitive load on recipient), reach, richness, speed
const CHANNEL_PROPERTIES = {
  iMessage: { cost: 0.2, reach: 0.85, richness: 0.95, speed: 0.98 },
  RCS:      { cost: 0.2, reach: 0.75, richness: 0.90, speed: 0.95 },
  email:    { cost: 0.5, reach: 0.99, richness: 0.80, speed: 0.60 },
  voice:    { cost: 0.8, reach: 0.90, richness: 1.00, speed: 0.99 },
  SMS:      { cost: 0.3, reach: 0.99, richness: 0.30, speed: 0.97 },
};

// Message type → channel affinity priors
const MESSAGE_TYPE_PRIORS = {
  'bid-invitation':        { iMessage: 0.60, email: 0.30, RCS: 0.05, SMS: 0.04, voice: 0.01 },
  'change-order':          { iMessage: 0.55, email: 0.35, RCS: 0.05, SMS: 0.04, voice: 0.01 },
  'contract':              { email: 0.60, iMessage: 0.30, RCS: 0.05, SMS: 0.03, voice: 0.02 },
  'punch-list':            { iMessage: 0.65, email: 0.20, RCS: 0.08, SMS: 0.06, voice: 0.01 },
  'payment-follow-up':     { iMessage: 0.50, email: 0.35, SMS: 0.10, voice: 0.04, RCS: 0.01 },
  'project-update':        { iMessage: 0.55, email: 0.35, RCS: 0.05, SMS: 0.04, voice: 0.01 },
  'urgent-alert':          { voice: 0.45, iMessage: 0.40, SMS: 0.10, RCS: 0.03, email: 0.02 },
  're-engagement':         { iMessage: 0.60, voice: 0.25, email: 0.10, SMS: 0.04, RCS: 0.01 },
  'general':               { iMessage: 0.40, email: 0.40, RCS: 0.08, SMS: 0.07, voice: 0.05 },
};

// ── Contact Communication Profile ─────────────────────────────────────────

class ContactProfile {
  constructor(contactId, config = {}) {
    this.contactId = contactId;
    this.name = config.name || contactId;
    this.role = config.role || 'unknown'; // owner | gc | sub | designer | inspector
    this.company = config.company || '';

    // Learned channel response rates (updated via φ⁻¹ reinforcement)
    this.channelResponseRates = {
      iMessage: 0.34, RCS: 0.28, email: 0.18, voice: 0.55, SMS: 0.22,
    };
    this.channelResponseLags = {
      iMessage: 35,   // minutes
      RCS: 45,
      email: 420,     // 7 hours
      voice: 5,
      SMS: 25,
    };

    // Tone profile
    this.preferredFormality = config.formality || 0.5; // 0=casual, 1=formal
    this.preferredLength = config.length || 0.5;       // 0=brief, 1=detailed

    // Silence tracking
    this.lastContactDate = config.lastContactDate || Date.now();
    this.lastReplyDate = config.lastReplyDate || Date.now();
    this.silenceAlertSent = false;
    this.totalInteractions = 0;
    this.totalReplies = 0;

    // Conversation threads per channel
    this.threads = new Map(); // channel → [{ role, content, timestamp }]
  }

  get daysSinceLastReply() {
    return Math.floor((Date.now() - this.lastReplyDate) / 86400000);
  }

  get overallReplyRate() {
    return this.totalInteractions > 0 ? this.totalReplies / this.totalInteractions : 0.5;
  }

  recordInteraction(channel, replied) {
    this.totalInteractions++;
    this.lastContactDate = Date.now();

    if (replied) {
      this.totalReplies++;
      this.lastReplyDate = Date.now();
      this.silenceAlertSent = false;
      // Reinforce this channel with φ-weighted update
      const current = this.channelResponseRates[channel] || 0.2;
      this.channelResponseRates[channel] = current + PHI_INV * (1 - current) * 0.1;
    } else {
      // Slight decay for non-response on this channel
      const current = this.channelResponseRates[channel] || 0.2;
      this.channelResponseRates[channel] = Math.max(0.05, current * (1 - PHI_INV * 0.05));
    }
  }
}

// ── Message Entropy Model ──────────────────────────────────────────────────

class MessageEntropy {
  // Shannon entropy of a message: H = -Σ p(word) log₂ p(word)
  // Lower entropy = more predictable = easier to parse = higher reply rate
  static calculate(text) {
    const words = text.toLowerCase().split(/\s+/);
    const freq = {};
    for (const w of words) {
      freq[w] = (freq[w] || 0) + 1;
    }
    const total = words.length;
    let H = 0;
    for (const count of Object.values(freq)) {
      const p = count / total;
      H -= p * Math.log2(p);
    }
    return H;
  }

  // Readability: Flesch-Kincaid Grade Level (lower = easier)
  static gradeLevel(text) {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
    const words = text.split(/\s+/).length;
    const syllables = text.replace(/[^aeiouy]/gi, '').length;
    if (sentences === 0 || words === 0) return 0;
    return 0.39 * (words / sentences) + 11.8 * (syllables / words) - 15.59;
  }

  // Free energy of a message: how much cognitive work does the recipient have to do?
  static freeEnergy(text) {
    const H = MessageEntropy.calculate(text);
    const grade = MessageEntropy.gradeLevel(text);
    const wordCount = text.split(/\s+/).length;
    const lengthPenalty = wordCount / 100; // Longer messages cost more
    return H * PHI_INV + grade * 0.05 + lengthPenalty * PHI_INV;
  }
}

// ── VERBEX AGI Core ────────────────────────────────────────────────────────

export class VERBEX_AGI extends RSHIPCore {
  constructor(config = {}) {
    super({
      designation: 'RSHIP-2026-VERBEX-001',
      classification: 'Communication Routing & Message Intelligence AGI',
      ...config,
    });

    // Contact registry
    this.contacts = new Map(); // contactId → ContactProfile
    this.silenceThresholdDays = config.silenceThresholdDays || 14;
    this.criticalSilenceDays = config.criticalSilenceDays || 30;

    // Routing telemetry
    this.routingCount = 0;
    this.entropyReductions = [];
    this.channelSuccessHistory = []; // { channel, replied, freeEnergy }

    // AGI Goals
    this.setGoal('maximize-reply-rates', 'Route every message to the channel most likely to get a reply', 10, {
      targetReplyRate: 0.40,
    });

    this.setGoal('minimize-message-entropy', 'Rewrite messages to minimize cognitive load on recipients', 9, {
      targetFreeEnergy: 1.5,
    });

    this.setGoal('maintain-sovereign-context', 'Never lose conversation context across channels', 8, {
      targetContextDepth: 20,
    });

    this.setGoal('detect-silence', 'Flag every contact who goes dark within 14 days', 7, {
      maxSilenceDays: 14,
    });

    // Start autonomous silence detector
    this._startSilenceDetector();
  }

  // ── Contact Registration ───────────────────────────────────────────────────

  registerContact(contactId, config = {}) {
    const profile = new ContactProfile(contactId, config);
    this.contacts.set(contactId, profile);

    this.learn(
      { contactId, role: config.role, company: config.company },
      { registered: true },
      { id: 'contact-register' }
    );

    return profile;
  }

  // ── Omnichannel Routing Intelligence ──────────────────────────────────────

  routeMessage(contactId, messageType, draftContent, context = {}) {
    this.routingCount++;

    const profile = this.contacts.get(contactId) || new ContactProfile(contactId, {});

    // 1. Select optimal channel using mutual information
    const channelScores = this._scoreChannels(profile, messageType, context);
    const selectedChannel = channelScores[0].channel;

    // 2. Reduce message entropy
    const optimized = this.reduceEntropy(draftContent, profile, selectedChannel, messageType);

    // 3. Track conversation state
    this._appendToThread(profile, selectedChannel, { role: 'outbound', content: optimized.content });

    // Update goal
    const replyGoal = this.goals.get('maximize-reply-rates');
    if (replyGoal) {
      replyGoal.progress = Math.min(1.0, profile.overallReplyRate / 0.40);
    }

    this.learn(
      { contactId, messageType, originalLength: draftContent.length, channel: selectedChannel },
      { optimizedLength: optimized.content.length, freeEnergyReduction: optimized.reduction },
      { id: 'route-message' }
    );

    return {
      contactId,
      selectedChannel,
      channelScores,
      optimizedContent: optimized.content,
      originalFreeEnergy: optimized.originalFE,
      optimizedFreeEnergy: optimized.optimizedFE,
      freeEnergyReduction: optimized.reduction,
      predictedReplyRate: parseFloat((profile.channelResponseRates[selectedChannel] || 0.3).toFixed(3)),
      estimatedReplyMinutes: profile.channelResponseLags[selectedChannel] || 60,
    };
  }

  _scoreChannels(profile, messageType, context = {}) {
    const priors = MESSAGE_TYPE_PRIORS[messageType] || MESSAGE_TYPE_PRIORS['general'];
    const scores = [];

    for (const [channel, props] of Object.entries(CHANNEL_PROPERTIES)) {
      const prior = priors[channel] || 0.05;
      const learned = profile.channelResponseRates[channel] || 0.2;
      const urgency = context.urgent ? props.speed : 0.5;

      // Shannon mutual information approximation:
      // I(channel; reply) ∝ replyRate × richness / cost
      const mi = learned * props.richness / props.cost;

      // Combine: prior × learned_MI × urgency_factor
      const score = PHI_INV * prior + (1 - PHI_INV) * mi * (context.urgent ? urgency : 1.0);

      scores.push({ channel, score: parseFloat(score.toFixed(4)), prior, learnedReplyRate: learned });
    }

    scores.sort((a, b) => b.score - a.score);
    return scores;
  }

  // ── Message Entropy Reduction ──────────────────────────────────────────────

  reduceEntropy(text, profile, channel, messageType) {
    const originalFE = MessageEntropy.freeEnergy(text);

    // Apply tone calibration based on profile
    let content = this._calibrateTone(text, profile, messageType);

    // Channel-specific length optimization
    content = this._optimizeLength(content, channel);

    // Action-line clarity: ensure CTA is first or last sentence
    content = this._clarifyCallToAction(content, messageType);

    const optimizedFE = MessageEntropy.freeEnergy(content);

    const result = {
      content,
      originalFE: parseFloat(originalFE.toFixed(4)),
      optimizedFE: parseFloat(optimizedFE.toFixed(4)),
      reduction: parseFloat(Math.max(0, originalFE - optimizedFE).toFixed(4)),
    };

    this.entropyReductions.push(result.reduction);

    // Update goal
    const entropyGoal = this.goals.get('minimize-message-entropy');
    if (entropyGoal) {
      entropyGoal.progress = optimizedFE <= 1.5 ? 1.0 : 1.5 / optimizedFE;
    }

    this.learn(
      { originalFE, optimizedFE, channel, messageType },
      { reduction: result.reduction },
      { id: 'entropy-reduction' }
    );

    return result;
  }

  _calibrateTone(text, profile, messageType) {
    // High formality: ensure sentence-case, no contractions
    if (profile.preferredFormality > 0.7) {
      return text
        .replace(/\bcan't\b/g, 'cannot')
        .replace(/\bwon't\b/g, 'will not')
        .replace(/\bdon't\b/g, 'do not')
        .replace(/\bI'm\b/g, 'I am')
        .replace(/\bwe're\b/g, 'we are');
    }
    // Low formality: allow contractions, conversational phrasing stays
    return text;
  }

  _optimizeLength(text, channel) {
    const limits = {
      iMessage: 320,  // characters
      RCS: 360,
      SMS: 160,
      email: 2000,
      voice: 180,    // Approximate spoken words
    };

    const limit = limits[channel] || 400;
    if (text.length <= limit) return text;

    // Truncate at last sentence boundary within limit
    const truncated = text.slice(0, limit);
    const lastPeriod = Math.max(truncated.lastIndexOf('.'), truncated.lastIndexOf('?'));
    return lastPeriod >= limit * 0.6 ? truncated.slice(0, lastPeriod + 1) : truncated + '…';
  }

  _clarifyCallToAction(text, messageType) {
    // Ensure messages that require a response end with a clear question or ask
    const ctaTypes = ['bid-invitation', 'change-order', 'payment-follow-up', 'punch-list'];
    if (!ctaTypes.includes(messageType)) return text;

    if (!text.includes('?') && !text.toLowerCase().includes('please')) {
      return text.trimEnd() + ' Can you confirm?';
    }
    return text;
  }

  // ── Sovereign Conversation State Tracking ─────────────────────────────────

  _appendToThread(profile, channel, message) {
    const thread = profile.threads.get(channel) || [];
    thread.push({ ...message, timestamp: new Date().toISOString() });

    // Keep last 50 messages per channel
    if (thread.length > 50) thread.shift();
    profile.threads.set(channel, thread);

    // Update context goal
    const contextGoal = this.goals.get('maintain-sovereign-context');
    if (contextGoal) {
      const totalContext = [...profile.threads.values()].reduce((s, t) => s + t.length, 0);
      contextGoal.progress = Math.min(1.0, totalContext / 20);
    }
  }

  recordReply(contactId, channel, content) {
    const profile = this.contacts.get(contactId);
    if (!profile) return null;

    profile.recordInteraction(channel, true);
    this._appendToThread(profile, channel, { role: 'inbound', content });

    this.learn(
      { contactId, channel },
      { replied: true, replyLength: content.length },
      { id: 'reply-received' }
    );

    return { contactId, channel, newReplyRate: profile.channelResponseRates[channel] };
  }

  getConversationContext(contactId, channel = null) {
    const profile = this.contacts.get(contactId);
    if (!profile) return { contactId, threads: {} };

    if (channel) {
      return { contactId, channel, thread: profile.threads.get(channel) || [] };
    }

    const allThreads = {};
    for (const [ch, thread] of profile.threads) {
      allThreads[ch] = thread.slice(-10); // Last 10 messages per channel
    }
    return { contactId, threads: allThreads };
  }

  // ── Silence Detection ──────────────────────────────────────────────────────

  detectSilence() {
    const silentContacts = [];

    for (const [contactId, profile] of this.contacts) {
      const daysSilent = profile.daysSinceLastReply;

      if (daysSilent >= this.criticalSilenceDays && !profile.silenceAlertSent) {
        silentContacts.push({
          contactId,
          name: profile.name,
          company: profile.company,
          daysSilent,
          severity: 'CRITICAL',
          lastChannel: this._lastActiveChannel(profile),
          suggestedAction: 'voice-call',
          reEngagementMessage: this._draftReEngagement(profile, 'critical'),
        });
        profile.silenceAlertSent = true;
      } else if (daysSilent >= this.silenceThresholdDays && !profile.silenceAlertSent) {
        silentContacts.push({
          contactId,
          name: profile.name,
          company: profile.company,
          daysSilent,
          severity: 'WATCH',
          lastChannel: this._lastActiveChannel(profile),
          suggestedAction: 're-engagement',
          reEngagementMessage: this._draftReEngagement(profile, 'watch'),
        });
      }
    }

    // Update goal
    const silenceGoal = this.goals.get('detect-silence');
    if (silenceGoal) {
      const watchCount = [...this.contacts.values()].filter(
        p => p.daysSinceLastReply >= this.silenceThresholdDays
      ).length;
      silenceGoal.progress = this.contacts.size > 0
        ? 1 - watchCount / this.contacts.size
        : 1.0;
    }

    this.learn(
      { totalContacts: this.contacts.size },
      { silentContacts: silentContacts.length },
      { id: 'silence-detection' }
    );

    return silentContacts;
  }

  _lastActiveChannel(profile) {
    let best = 'email';
    let bestRate = 0;
    for (const [ch, rate] of Object.entries(profile.channelResponseRates)) {
      if (rate > bestRate) { bestRate = rate; best = ch; }
    }
    return best;
  }

  _draftReEngagement(profile, severity) {
    if (severity === 'critical') {
      return `${profile.name} — it's been a while. I wanted to make sure everything is okay ` +
             `and see if there's anything I can help with on your end.`;
    }
    return `Hey ${profile.name.split(' ')[0]}, just checking in — ` +
           `anything I can help move forward?`;
  }

  // ── Autonomous Silence Detector ────────────────────────────────────────────

  _startSilenceDetector() {
    setInterval(() => {
      const silent = this.detectSilence();
      if (silent.length > 0) {
        this.learn(
          { detectionCycle: Date.now() },
          { silentCount: silent.length },
          { id: 'autonomous-silence-scan' }
        );
      }
    }, 86400000); // Daily
  }

  // ── AGI Status ─────────────────────────────────────────────────────────────

  getAGIStatus() {
    const baseStatus = this.getStatus();
    const avgReduction = this.entropyReductions.length > 0
      ? this.entropyReductions.reduce((a, b) => a + b, 0) / this.entropyReductions.length
      : 0;

    const avgReplyRate = this.contacts.size > 0
      ? [...this.contacts.values()]
          .map(p => p.overallReplyRate)
          .reduce((a, b) => a + b, 0) / this.contacts.size
      : 0;

    return {
      ...baseStatus,
      communicationState: {
        contactsTracked: this.contacts.size,
        totalMessagesRouted: this.routingCount,
        avgFreeEnergyReduction: parseFloat(avgReduction.toFixed(4)),
        avgReplyRate: parseFloat(avgReplyRate.toFixed(3)),
        silentContacts: [...this.contacts.values()].filter(
          p => p.daysSinceLastReply >= this.silenceThresholdDays
        ).length,
      },
      channelIntelligence: this._getChannelSummary(),
    };
  }

  _getChannelSummary() {
    const summary = {};
    for (const channel of Object.values(CHANNELS)) {
      const profiles = [...this.contacts.values()];
      const avgRate = profiles.length > 0
        ? profiles.map(p => p.channelResponseRates[channel] || 0)
            .reduce((a, b) => a + b, 0) / profiles.length
        : 0;
      summary[channel] = parseFloat(avgRate.toFixed(3));
    }
    return summary;
  }
}

// ── Factory Function ────────────────────────────────────────────────────────

export function birthVERBEX(config = {}) {
  return new VERBEX_AGI(config);
}

export default VERBEX_AGI;
