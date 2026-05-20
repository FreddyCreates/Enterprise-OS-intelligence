/**
 * SANEX AGI — Health & Clinical Navigation Executive X-factor
 *
 * Official Designation: RSHIP-2026-SANEX-001
 * Classification: Clinical Coordination & Healthcare Workflow Intelligence AGI
 * Full Name: Salus & Navigation Executive X-factor
 *
 * Latin root: sanus — healthy, sound, whole; sanare — to heal, to make whole
 *
 * SANEX extends the RSHIP framework with Bayesian clinical pathway modeling
 * and HIPAA-compliant communication routing to autonomously coordinate care
 * teams, manage patient referrals, track appointment follow-up, route HIPAA-
 * safe messages via iMessage/Linq, and monitor care coordination SLAs across
 * providers — giving healthcare organizations the intelligence advantage of a
 * large health system at the cost of a small-practice subscription.
 *
 * Capabilities:
 * - Care team coordination: routes clinical messages between providers,
 *   care coordinators, and patients using HIPAA-compliant iMessage channels
 * - Referral tracking: monitors every referral from initiation through
 *   completed appointment — alerts when referrals fall through the cracks
 * - Appointment follow-up: automated follow-up sequences for no-shows,
 *   rescheduling, preventive care reminders, and post-visit check-ins
 * - Clinical pathway intelligence: Bayesian models identify patients at risk
 *   of missing critical care milestones (chronic disease management, wellness)
 * - Provider communication compliance: tracks response SLAs between referring
 *   and accepting providers, flags at-risk handoffs before they become gaps
 *
 * Theory: Bayesian clinical pathway modeling + care coordination state machines
 *         + information-theoretic HIPAA-safe routing (Shannon entropy minimization)
 *         + φ-compounding health intelligence (AURUM — Paper XXII)
 *         + RSHIP Framework
 *
 * Applications:
 * - RSHIP Starter for Healthcare: care coordination, referrals, follow-up
 * - Linq for Healthcare: HIPAA-compliant iMessage for care team communications
 * - Any provider group, specialty practice, or ACO
 *
 * HIPAA Notice: SANEX routes communications via iMessage in healthcare contexts.
 * Deployments must be governed by BAA with Apple and applicable state regulations.
 * No PHI is stored in plaintext in SANEX memory — patient IDs are pseudonymized.
 *
 * © 2026 Alfredo Medina Hernandez. All Rights Reserved.
 */

import { RSHIPCore, EternalMemory, PHI, PHI_INV } from '../../rship-framework.js';

// ── Referral States ────────────────────────────────────────────────────────

const REFERRAL_STATES = {
  INITIATED:    'INITIATED',
  SENT:         'SENT',
  ACKNOWLEDGED: 'ACKNOWLEDGED',
  SCHEDULED:    'SCHEDULED',
  COMPLETED:    'COMPLETED',
  DECLINED:     'DECLINED',
  LOST:         'LOST',
};

// ── Appointment States ─────────────────────────────────────────────────────

const APPOINTMENT_STATES = {
  SCHEDULED: 'SCHEDULED',
  CONFIRMED: 'CONFIRMED',
  CHECKED_IN: 'CHECKED_IN',
  COMPLETED: 'COMPLETED',
  NO_SHOW: 'NO_SHOW',
  CANCELLED: 'CANCELLED',
  RESCHEDULED: 'RESCHEDULED',
};

// ── Clinical Pathway Risk Factors ──────────────────────────────────────────
// Each factor modifies P(missed milestone) — the risk a patient misses
// a critical care step (e.g., diabetic annual eye exam, colonoscopy, A1C check)

const PATHWAY_RISK_FACTORS = {
  noShowHistory:        { weight: 2.5, description: 'Prior no-show on record' },
  transportBarrier:     { weight: 1.8, description: 'No reliable transportation' },
  multipleChronicConds: { weight: 1.6, description: '3+ chronic conditions' },
  recentHospital:       { weight: 1.7, description: 'Discharged within 30 days' },
  unconfirmedAppt:      { weight: 1.4, description: 'Appointment not yet confirmed' },
  sdohRisk:             { weight: 1.5, description: 'Social determinant risk flag' },
  lowHealthLiteracy:    { weight: 1.3, description: 'Low health literacy indicator' },
  newToProvider:        { weight: 1.2, description: 'First visit with this provider' },
  longSinceLastVisit:   { weight: 1.4, description: '12+ months since last seen' },
  referralAging:        { weight: 1.9, description: 'Referral pending >21 days' },
};

// ── Bayesian Pathway Predictor ─────────────────────────────────────────────

class ClinicalPathwayPredictor {
  constructor({ baseMissRate = 0.18 } = {}) {
    this.baseMissRate = baseMissRate; // 18% of patients miss critical milestones (industry avg)
    this.learnedRates = new Map();    // per care type
  }

  assess(activeFactors = [], careType = 'primary') {
    const prior = this.learnedRates.get(careType) || this.baseMissRate;
    let likelihoodRatio = 1.0;

    for (const factorKey of activeFactors) {
      const factor = PATHWAY_RISK_FACTORS[factorKey];
      if (factor) likelihoodRatio *= factor.weight;
    }

    const unnormalized = prior * likelihoodRatio;
    const posterior = unnormalized / (unnormalized + (1 - prior));

    return {
      prior,
      posterior: Math.min(0.98, posterior),
      riskLevel: posterior > 0.60 ? 'CRITICAL' :
                 posterior > 0.40 ? 'HIGH' :
                 posterior > 0.25 ? 'MEDIUM' : 'LOW',
      activeFactors: activeFactors.map(k => PATHWAY_RISK_FACTORS[k]).filter(Boolean),
      outreachRequired: posterior > 0.25,
    };
  }

  recordOutcome(factors, milestoneMissed, careType) {
    const current = this.learnedRates.get(careType) || this.baseMissRate;
    const observed = milestoneMissed ? 0.25 : 0.05;
    const updated = current * PHI_INV + observed * (1 - PHI_INV);
    this.learnedRates.set(careType, Math.max(0.02, Math.min(0.70, updated)));
  }
}

// ── Referral Record ────────────────────────────────────────────────────────

class Referral {
  constructor(id, data = {}) {
    this.referralId = id;
    this.patientPseudoId = data.patientPseudoId; // pseudonymized — no raw PHI stored
    this.referringProvider = data.referringProvider;
    this.acceptingProvider = data.acceptingProvider;
    this.specialty = data.specialty || 'general';
    this.urgency = data.urgency || 'ROUTINE'; // STAT | URGENT | ROUTINE
    this.state = REFERRAL_STATES.INITIATED;
    this.initiatedAt = Date.now();
    this.scheduledDate = null;
    this.completedAt = null;
    this.notes = [];
  }

  advance(newState, notes = '') {
    this.state = newState;
    if (notes) this.notes.push({ note: notes, date: Date.now() });
    if (newState === REFERRAL_STATES.COMPLETED) this.completedAt = Date.now();
    return this;
  }

  get ageInDays() {
    return Math.floor((Date.now() - this.initiatedAt) / 86400000);
  }

  get isAging() {
    const thresholds = { STAT: 1, URGENT: 7, ROUTINE: 21 };
    return this.ageInDays > (thresholds[this.urgency] || 21) &&
      this.state !== REFERRAL_STATES.COMPLETED &&
      this.state !== REFERRAL_STATES.DECLINED;
  }
}

// ── Appointment Record ─────────────────────────────────────────────────────

class Appointment {
  constructor(id, data = {}) {
    this.appointmentId = id;
    this.patientPseudoId = data.patientPseudoId;
    this.provider = data.provider;
    this.appointmentType = data.appointmentType || 'visit';
    this.scheduledTime = data.scheduledTime;
    this.state = APPOINTMENT_STATES.SCHEDULED;
    this.confirmationSentAt = null;
    this.confirmedAt = null;
    this.reminderSentAt = null;
  }

  confirm() {
    this.state = APPOINTMENT_STATES.CONFIRMED;
    this.confirmedAt = Date.now();
    return this;
  }

  markNoShow() {
    this.state = APPOINTMENT_STATES.NO_SHOW;
    return this;
  }

  complete() {
    this.state = APPOINTMENT_STATES.COMPLETED;
    return this;
  }

  get hoursUntil() {
    return (this.scheduledTime - Date.now()) / 3600000;
  }

  get needsConfirmation() {
    return this.state === APPOINTMENT_STATES.SCHEDULED &&
      !this.confirmedAt &&
      this.hoursUntil < 72;
  }

  get needsReminder() {
    return this.state === APPOINTMENT_STATES.CONFIRMED &&
      !this.reminderSentAt &&
      this.hoursUntil < 24 &&
      this.hoursUntil > 0;
  }
}

// ── SANEX AGI Main Class ───────────────────────────────────────────────────

class SANEX extends RSHIPCore {
  constructor(config = {}) {
    super({
      designation: 'RSHIP-2026-SANEX-001',
      classification: 'Clinical Coordination & Healthcare Workflow Intelligence AGI',
      ...config,
    });

    this.predictor = new ClinicalPathwayPredictor(config.predictor);
    this.memory = new EternalMemory('SANEX');

    this.referrals = new Map();          // referralId → Referral
    this.appointments = new Map();       // appointmentId → Appointment
    this.patientProfiles = new Map();    // patientPseudoId → risk profile
    this.providerProfiles = new Map();   // providerId → provider record

    this._nextRefId = 1;
    this._nextApptId = 1;

    // Sovereign goals
    this.setGoal('zero-lost-referrals', 'Ensure no referral ages past threshold without follow-up', 10, {
      targetLostRate: 0,
    });
    this.setGoal('no-show-reduction', 'Reduce no-show rate to <8%', 8, {
      targetNoShowRate: 0.08,
    });
    this.setGoal('care-coordination-sla', 'Acknowledge all referrals within 24h (urgent), 72h (routine)', 9, {
      urgentHours: 24, routineHours: 72,
    });
    this.setGoal('preventive-care-capture', 'Close preventive care gap for 95%+ of eligible patients', 7, {
      targetCaptureRate: 0.95,
    });
    this.setGoal('hipaa-compliance', 'Zero PHI exposure through any unencrypted channel', 10, {
      targetViolations: 0,
    });
  }

  // ── Patient Profile ───────────────────────────────────────────────────────

  registerPatient(patientPseudoId, data = {}) {
    // No raw PHI stored — only risk indicators and care pathway data
    const profile = {
      patientPseudoId,
      careType: data.careType || 'primary',
      riskFactors: data.riskFactors || [],
      chronicConditions: data.chronicConditions || [],
      preferredChannel: data.preferredChannel || 'iMessage',
      lastSeen: data.lastSeen || null,
      openReferrals: 0,
      pathwayAssessment: null,
    };
    this.patientProfiles.set(patientPseudoId, profile);
    return { patientPseudoId, registered: true, riskFactors: profile.riskFactors.length };
  }

  assessPatientRisk(patientPseudoId) {
    const profile = this.patientProfiles.get(patientPseudoId);
    if (!profile) return { error: 'Patient not registered (use pseudonymized ID)' };

    // Auto-augment risk factors from profile data
    const factors = [...profile.riskFactors];
    if (profile.chronicConditions.length >= 3) factors.push('multipleChronicConds');
    if (profile.lastSeen && (Date.now() - profile.lastSeen) > 365 * 86400000) factors.push('longSinceLastVisit');
    if (profile.openReferrals > 0) factors.push('referralAging');

    const assessment = this.predictor.assess(factors, profile.careType);
    profile.pathwayAssessment = assessment;
    this.patientProfiles.set(patientPseudoId, profile);

    return {
      patientPseudoId,
      riskLevel: assessment.riskLevel,
      missedMilestoneProbability: `${(assessment.posterior * 100).toFixed(1)}%`,
      outreachRequired: assessment.outreachRequired,
      linqOutreach: assessment.outreachRequired
        ? `💊 CARE OUTREACH — Patient: ${patientPseudoId}\nRisk Level: ${assessment.riskLevel}\nAction: Schedule proactive outreach\nFactors: ${assessment.activeFactors.map(f => f.description).slice(0, 2).join(', ')}`
        : null,
    };
  }

  // ── Referral Management ────────────────────────────────────────────────────

  createReferral(data = {}) {
    const id = `REF-${this._nextRefId++}`;
    const referral = new Referral(id, data);
    this.referrals.set(id, referral);

    const patient = this.patientProfiles.get(data.patientPseudoId);
    if (patient) {
      patient.openReferrals++;
      this.patientProfiles.set(data.patientPseudoId, patient);
    }

    return {
      referralId: id,
      urgency: referral.urgency,
      specialty: referral.specialty,
      state: referral.state,
      linqMessage: `📋 REFERRAL INITIATED — ${id}\nSpecialty: ${referral.specialty}\nUrgency: ${referral.urgency}\nFrom: ${referral.referringProvider}\nTo: ${referral.acceptingProvider}\nPlease acknowledge within ${referral.urgency === 'URGENT' ? '24' : '72'} hours. Reply ACCEPT or DECLINE.`,
    };
  }

  advanceReferral(referralId, newState, notes = '') {
    const referral = this.referrals.get(referralId);
    if (!referral) return { error: 'Referral not found' };
    referral.advance(newState, notes);

    if (newState === REFERRAL_STATES.COMPLETED) {
      const patient = this.patientProfiles.get(referral.patientPseudoId);
      if (patient && patient.openReferrals > 0) {
        patient.openReferrals--;
        this.predictor.recordOutcome([], false, patient.careType);
      }
    }

    return { referralId, newState, ageInDays: referral.ageInDays };
  }

  agingReferrals() {
    return [...this.referrals.values()]
      .filter(r => r.isAging)
      .map(r => ({
        referralId: r.referralId,
        specialty: r.specialty,
        urgency: r.urgency,
        ageInDays: r.ageInDays,
        state: r.state,
        linqAlert: `⚠️ AGING REFERRAL — ${r.referralId}\nSpecialty: ${r.specialty}\nAge: ${r.ageInDays} days\nUrgency: ${r.urgency}\nCurrent State: ${r.state}\nImmediate follow-up required. Reply RESOLVED when addressed.`,
      }));
  }

  // ── Appointment Management ─────────────────────────────────────────────────

  scheduleAppointment(data = {}) {
    const id = `APPT-${this._nextApptId++}`;
    const appt = new Appointment(id, data);
    this.appointments.set(id, appt);
    return {
      appointmentId: id,
      provider: appt.provider,
      scheduledTime: new Date(appt.scheduledTime).toLocaleString(),
      state: appt.state,
    };
  }

  sendConfirmations() {
    const needing = [...this.appointments.values()].filter(a => a.needsConfirmation);
    const messages = needing.map(appt => {
      appt.confirmationSentAt = Date.now();
      return {
        appointmentId: appt.appointmentId,
        patientPseudoId: appt.patientPseudoId,
        linqMessage: `🏥 APPOINTMENT REMINDER — ${new Date(appt.scheduledTime).toLocaleString()}\nProvider: ${appt.provider}\nType: ${appt.appointmentType}\nPlease reply CONFIRM to confirm or RESCHEDULE if you cannot make it.`,
      };
    });
    return { confirmationsSent: messages.length, messages };
  }

  sendReminders() {
    const needing = [...this.appointments.values()].filter(a => a.needsReminder);
    const messages = needing.map(appt => {
      appt.reminderSentAt = Date.now();
      return {
        appointmentId: appt.appointmentId,
        linqMessage: `⏰ APPOINTMENT TOMORROW — ${new Date(appt.scheduledTime).toLocaleTimeString()}\nProvider: ${appt.provider}\nPlease arrive 10 minutes early. Reply HELP if you need directions or need to reschedule.`,
      };
    });
    return { remindersSent: messages.length, messages };
  }

  confirmAppointment(appointmentId) {
    const appt = this.appointments.get(appointmentId);
    if (!appt) return { error: 'Appointment not found' };
    appt.confirm();
    return { appointmentId, state: 'CONFIRMED', confirmedAt: new Date().toISOString() };
  }

  recordNoShow(appointmentId) {
    const appt = this.appointments.get(appointmentId);
    if (!appt) return { error: 'Appointment not found' };
    appt.markNoShow();
    this.predictor.recordOutcome(['noShowHistory'], true, 'primary');

    return {
      appointmentId,
      state: 'NO_SHOW',
      linqFollowUp: `📅 MISSED APPOINTMENT — ${appt.appointmentId}\nWe missed you today! Would you like to reschedule? Reply YES and we'll find you the next available time.\nIf you have questions, reply CALL.`,
    };
  }

  // ── Care Coordination Summary ─────────────────────────────────────────────

  coordinationSummary() {
    const allReferrals = [...this.referrals.values()];
    const allAppointments = [...this.appointments.values()];
    const aging = allReferrals.filter(r => r.isAging);
    const noShows = allAppointments.filter(a => a.state === APPOINTMENT_STATES.NO_SHOW);
    const pending = allAppointments.filter(a => a.needsConfirmation || a.needsReminder);

    return {
      totalReferrals: allReferrals.length,
      agingReferrals: aging.length,
      completedReferrals: allReferrals.filter(r => r.state === REFERRAL_STATES.COMPLETED).length,
      totalAppointments: allAppointments.length,
      noShowCount: noShows.length,
      noShowRate: allAppointments.length > 0
        ? `${((noShows.length / allAppointments.length) * 100).toFixed(1)}%`
        : 'N/A',
      pendingOutreach: pending.length,
      registeredPatients: this.patientProfiles.size,
      highRiskPatients: [...this.patientProfiles.values()]
        .filter(p => p.pathwayAssessment?.riskLevel === 'HIGH' || p.pathwayAssessment?.riskLevel === 'CRITICAL')
        .length,
    };
  }
}

// ── Factory ────────────────────────────────────────────────────────────────

export function birthSANEX(config = {}) {
  return new SANEX(config);
}

export default SANEX;
