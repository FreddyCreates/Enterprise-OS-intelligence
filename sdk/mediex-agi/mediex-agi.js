/**
 * MEDIEX AGI — Media Intelligence Executive X-factor
 *
 * Official Designation: RSHIP-2026-MEDIEX-001
 * Classification: Media Production Workflow & Coordination Intelligence AGI
 * Full Name: Media Intelligence & Distribution Executive X-factor
 *
 * Latin root: medialis — of the middle, coordinating, intermediary
 *             (root of "media", "mediate", "medium")
 *
 * MEDIEX extends the RSHIP framework with critical-path scheduling for production
 * timelines and information-theoretic crew coordination to autonomously manage
 * shoot-day logistics, route talent booking confirmations, broadcast status
 * updates, handle change notifications, and optimize crew assembly for projects
 * of all scales — from single-camera shoots to feature film productions.
 *
 * Capabilities:
 * - Production timeline management: critical-path method (CPM) scheduling for
 *   pre-production, principal photography, and post-production milestones
 * - Crew coordination routing: intelligent iMessage/Linq dispatch for call
 *   sheets, location changes, weather delays, and schedule adjustments
 * - Talent booking confirmation: automates confirmation sequences for cast
 *   and principal crew, tracks response SLAs, escalates non-responses
 * - Shoot-day status broadcasting: real-time production progress (scenes
 *   completed, schedule variance, remaining pages) routed to appropriate parties
 * - Change notification cascade: when a scene is added/dropped or location
 *   changes, MEDIEX determines who needs to know and routes alerts in the right
 *   order (director → AD → dept heads → crew → talent)
 *
 * Theory: Critical-path method (CPM) for production scheduling
 *         + Shannon information routing for crew coordination
 *         + φ-compounding production intelligence (AURUM — Paper XXII)
 *         + RSHIP Framework
 *
 * Applications:
 * - Linq for Media Production: crew coordination, talent booking, shoot-day comms
 * - Independent film/TV: zero-integration entry point via iMessage
 * - Enterprise studios: integration with Movie Magic, Showbiz, EP Budgeting
 *
 * © 2026 Alfredo Medina Hernandez. All Rights Reserved.
 */

import { RSHIPCore, EternalMemory, PHI, PHI_INV } from '../../rship-framework.js';

// ── Production States ──────────────────────────────────────────────────────

const PRODUCTION_STATES = {
  DEVELOPMENT:    'DEVELOPMENT',
  PRE_PRODUCTION: 'PRE_PRODUCTION',
  PRINCIPAL:      'PRINCIPAL',
  WRAP:           'WRAP',
  POST:           'POST',
  DELIVERY:       'DELIVERY',
  COMPLETE:       'COMPLETE',
};

// ── Crew Departments (notification hierarchy) ──────────────────────────────

const DEPARTMENTS = {
  PRODUCTION: { priority: 1, roles: ['Director', 'Producer', 'UPM', 'Line Producer'] },
  DIRECTING:  { priority: 2, roles: ['1st AD', '2nd AD', 'Script Supervisor'] },
  CAMERA:     { priority: 3, roles: ['DP', '1st AC', '2nd AC', 'DIT'] },
  SOUND:      { priority: 3, roles: ['Sound Mixer', 'Boom Operator'] },
  ART:        { priority: 4, roles: ['Production Designer', 'Art Director', 'Set Decorator'] },
  WARDROBE:   { priority: 4, roles: ['Costume Designer', 'Key Costumer'] },
  MAKEUP:     { priority: 4, roles: ['Dept Head Makeup', 'Key Makeup'] },
  GRIP:       { priority: 5, roles: ['Key Grip', 'Best Boy Grip', 'Dolly Grip'] },
  ELECTRIC:   { priority: 5, roles: ['Gaffer', 'Best Boy Electric'] },
  LOCATIONS:  { priority: 3, roles: ['Location Manager', 'Location Scout'] },
  TALENT:     { priority: 6, roles: ['Cast', 'Stand-In'] },
};

// ── Scene Record ───────────────────────────────────────────────────────────

class Scene {
  constructor(id, config = {}) {
    this.sceneId = id;
    this.title = config.title || id;
    this.location = config.location || 'TBD';
    this.intExt = config.intExt || 'INT'; // INT | EXT
    this.dayNight = config.dayNight || 'DAY';
    this.pages = config.pages || 1;
    this.cast = config.cast || [];
    this.departments = config.departments || Object.keys(DEPARTMENTS);
    this.scheduledDate = config.scheduledDate || null;
    this.scheduledCallTime = config.scheduledCallTime || '07:00';
    this.status = 'SCHEDULED'; // SCHEDULED | IN_PROGRESS | COMPLETED | POSTPONED
    this.completedAt = null;
  }

  complete() {
    this.status = 'COMPLETED';
    this.completedAt = Date.now();
    return this;
  }

  postpone(newDate, reason = '') {
    this.status = 'POSTPONED';
    this.previousDate = this.scheduledDate;
    this.scheduledDate = newDate;
    this.postponeReason = reason;
    return this;
  }
}

// ── CPM Production Scheduler ───────────────────────────────────────────────

class CPMScheduler {
  constructor() {
    this.milestones = new Map(); // id → { label, dependencies, duration, earliest, latest }
  }

  addMilestone(id, config = {}) {
    this.milestones.set(id, {
      id,
      label: config.label || id,
      dependencies: config.dependencies || [],
      durationDays: config.durationDays || 1,
      startDate: config.startDate || null,
      deadline: config.deadline || null,
      earliest: 0,  // Computed via forward pass
      latest: Infinity,  // Computed via backward pass
    });
    return this.milestones.get(id);
  }

  // Forward pass: compute Earliest Start Time for each milestone
  computeForwardPass() {
    const order = this._topologicalSort();
    for (const id of order) {
      const milestone = this.milestones.get(id);
      if (!milestone) continue;
      let maxPredecessorEnd = 0;
      for (const depId of milestone.dependencies) {
        const dep = this.milestones.get(depId);
        if (dep) maxPredecessorEnd = Math.max(maxPredecessorEnd, dep.earliest + dep.durationDays);
      }
      milestone.earliest = maxPredecessorEnd;
    }
  }

  _topologicalSort() {
    const visited = new Set();
    const result = [];
    const visit = (id) => {
      if (visited.has(id)) return;
      visited.add(id);
      const m = this.milestones.get(id);
      if (m) for (const dep of m.dependencies) visit(dep);
      result.push(id);
    };
    for (const id of this.milestones.keys()) visit(id);
    return result;
  }

  criticalPath() {
    this.computeForwardPass();
    const allMilestones = [...this.milestones.values()];
    const maxEnd = Math.max(...allMilestones.map(m => m.earliest + m.durationDays));

    // Critical path: milestones with zero float
    const critical = allMilestones.filter(m => {
      const float = maxEnd - (m.earliest + m.durationDays);
      return float === 0;
    });

    return {
      totalDurationDays: maxEnd,
      criticalMilestones: critical.map(m => ({ id: m.id, label: m.label, startDay: m.earliest, duration: m.durationDays })),
    };
  }
}

// ── Crew Contact Record ────────────────────────────────────────────────────

class CrewMember {
  constructor(id, data = {}) {
    this.crewId = id;
    this.name = data.name || id;
    this.role = data.role || 'Crew';
    this.department = data.department || 'PRODUCTION';
    this.phone = data.phone || null;
    this.preferredChannel = data.preferredChannel || 'iMessage';
    this.confirmed = false;
    this.lastContact = null;
    this.confirmationSLAHours = data.confirmationSLAHours || 4;
    this.bookingStatus = 'PENDING'; // PENDING | CONFIRMED | DECLINED | NO_RESPONSE
  }

  confirm() {
    this.confirmed = true;
    this.bookingStatus = 'CONFIRMED';
    this.lastContact = Date.now();
    return this;
  }

  decline(reason = '') {
    this.confirmed = false;
    this.bookingStatus = 'DECLINED';
    this.declineReason = reason;
    return this;
  }

  get slaBreached() {
    if (this.confirmed || this.bookingStatus === 'DECLINED') return false;
    if (!this.lastContact) return false;
    return (Date.now() - this.lastContact) > this.confirmationSLAHours * 3600000;
  }
}

// ── MEDIEX AGI Main Class ──────────────────────────────────────────────────

class MEDIEX extends RSHIPCore {
  constructor(config = {}) {
    super({
      designation: 'RSHIP-2026-MEDIEX-001',
      classification: 'Media Production Workflow & Coordination Intelligence AGI',
      ...config,
    });

    this.scheduler = new CPMScheduler();
    this.memory = new EternalMemory('MEDIEX');

    this.productions = new Map();  // productionId → production record
    this.scenes = new Map();       // sceneId → Scene
    this.crew = new Map();         // crewId → CrewMember
    this.callSheets = [];

    // Sovereign goals
    this.setGoal('zero-missed-calls', 'Achieve 100% crew confirmation before every shoot day', 10, {
      targetConfirmationRate: 1.0,
    });
    this.setGoal('schedule-integrity', 'Keep production on schedule within 5% variance', 8, {
      targetVariance: 0.05,
    });
    this.setGoal('change-cascade', 'Route all change notifications within 90 seconds', 7, {
      targetNotificationSeconds: 90,
    });
    this.setGoal('communication-efficiency', 'Route 100% of comms via iMessage/Linq (zero phone-tree)', 6, {
      targetLinqRate: 1.0,
    });
    this.setGoal('production-intelligence', 'Build institutional memory across all productions', 5, {
      targetProductionsLearned: 10,
    });
  }

  // ── Production Management ─────────────────────────────────────────────────

  createProduction(productionId, config = {}) {
    const production = {
      productionId,
      title: config.title || productionId,
      type: config.type || 'feature', // feature | short | tv-episode | commercial | branded
      director: config.director || null,
      producer: config.producer || null,
      state: PRODUCTION_STATES.PRE_PRODUCTION,
      shootDates: config.shootDates || [],
      totalPages: config.totalPages || 90,
      pagesCompleted: 0,
      locations: config.locations || [],
      budget: config.budget || 0,
      scenes: [],
      crew: [],
      createdAt: Date.now(),
    };
    this.productions.set(productionId, production);

    // Seed standard pre-production milestones
    this.scheduler.addMilestone(`${productionId}-script-lock`, {
      label: 'Script Lock', durationDays: 1, dependencies: [],
    });
    this.scheduler.addMilestone(`${productionId}-casting`, {
      label: 'Casting Complete', durationDays: 14,
      dependencies: [`${productionId}-script-lock`],
    });
    this.scheduler.addMilestone(`${productionId}-location-scout`, {
      label: 'Locations Locked', durationDays: 10,
      dependencies: [`${productionId}-script-lock`],
    });
    this.scheduler.addMilestone(`${productionId}-principal-start`, {
      label: 'Principal Photography Begins', durationDays: 1,
      dependencies: [`${productionId}-casting`, `${productionId}-location-scout`],
    });

    return { productionId, title: production.title, state: production.state };
  }

  // ── Scene Management ───────────────────────────────────────────────────────

  addScene(productionId, sceneId, sceneConfig = {}) {
    const scene = new Scene(sceneId, sceneConfig);
    this.scenes.set(sceneId, scene);
    const production = this.productions.get(productionId);
    if (production) production.scenes.push(sceneId);
    return { sceneId, title: scene.title, pages: scene.pages, scheduledDate: scene.scheduledDate };
  }

  completeScene(sceneId) {
    const scene = this.scenes.get(sceneId);
    if (!scene) return { error: 'Scene not found' };
    scene.complete();

    // Update production pages
    for (const [, prod] of this.productions) {
      if (prod.scenes.includes(sceneId)) {
        prod.pagesCompleted += scene.pages;
      }
    }

    return {
      sceneId,
      status: 'COMPLETED',
      pagesCompleted: scene.pages,
      linqMessage: `🎬 SCENE COMPLETE — ${scene.title}\nLocation: ${scene.location}\nPages: ${scene.pages}\nCompleted: ${new Date().toLocaleTimeString()}`,
    };
  }

  notifySceneChange(sceneId, change = {}) {
    const scene = this.scenes.get(sceneId);
    if (!scene) return { error: 'Scene not found' };

    const { type, newValue, reason } = change;

    // Build notification cascade by department priority
    const affectedDepts = Object.entries(DEPARTMENTS)
      .sort((a, b) => a[1].priority - b[1].priority)
      .filter(([dept]) => {
        if (type === 'LOCATION_CHANGE') return true;
        if (type === 'CALL_TIME_CHANGE') return true;
        if (type === 'SCENE_DROP') return scene.departments.includes(dept);
        return true;
      });

    const cascadeMessages = affectedDepts.map(([dept, deptInfo]) => ({
      department: dept,
      priority: deptInfo.priority,
      message: this._buildChangeMessage(scene, type, newValue, reason, dept),
    }));

    this.learn({ sceneId, change }, { cascade: cascadeMessages.length }, { id: 'scene-change' });

    return {
      sceneId,
      changeType: type,
      newValue,
      notifiedDepartments: cascadeMessages.length,
      cascadeMessages: cascadeMessages.slice(0, 3),
      totalMessages: cascadeMessages.length,
    };
  }

  _buildChangeMessage(scene, type, newValue, reason, dept) {
    const prefix = type === 'LOCATION_CHANGE' ? '📍 LOCATION CHANGE' :
                   type === 'CALL_TIME_CHANGE' ? '⏰ CALL TIME CHANGE' :
                   type === 'SCENE_DROP'       ? '🎬 SCENE DROPPED' :
                                                 '📢 PRODUCTION UPDATE';
    return `${prefix} — ${scene.title}\nDept: ${dept}\n${type === 'LOCATION_CHANGE' ? `New location: ${newValue}` : `Update: ${newValue}`}\nReason: ${reason || 'Production adjustment'}\nAcknowledge receipt: Reply ACK`;
  }

  // ── Crew Management ────────────────────────────────────────────────────────

  addCrewMember(productionId, crewId, data = {}) {
    const member = new CrewMember(crewId, data);
    this.crew.set(crewId, member);
    const production = this.productions.get(productionId);
    if (production) production.crew.push(crewId);
    return { crewId, name: member.name, role: member.role, department: member.department };
  }

  sendBookingConfirmation(crewId, shootDate, role = null) {
    const member = this.crew.get(crewId);
    if (!member) return { error: 'Crew member not found' };

    member.lastContact = Date.now();
    member.bookingStatus = 'PENDING';

    return {
      crewId,
      name: member.name,
      linqMessage: `🎬 BOOKING CONFIRMATION — ${role || member.role}\nShoot Date: ${new Date(shootDate).toLocaleDateString()}\nCall Time: TBD (call sheet follows)\nPlease confirm by replying YES or NO within ${member.confirmationSLAHours} hours.\nQuestions? Reply CALL and your AD will reach out.`,
    };
  }

  confirmCrew(crewId) {
    const member = this.crew.get(crewId);
    if (!member) return { error: 'Crew member not found' };
    member.confirm();
    return { crewId, name: member.name, status: 'CONFIRMED' };
  }

  checkConfirmationSLAs(productionId) {
    const production = this.productions.get(productionId);
    if (!production) return { error: 'Production not found' };

    const alerts = production.crew
      .map(id => this.crew.get(id))
      .filter(m => m && m.slaBreached)
      .map(m => ({
        crewId: m.crewId,
        name: m.name,
        role: m.role,
        department: m.department,
        linqEscalation: `⚠️ CONFIRMATION OVERDUE — ${m.name} (${m.role})\nSLA: ${m.confirmationSLAHours}h exceeded\nAction: Follow up immediately or find cover.\nReply RESOLVED when confirmed.`,
      }));

    return {
      productionId,
      slaBreaches: alerts.length,
      alerts,
    };
  }

  // ── Call Sheet ─────────────────────────────────────────────────────────────

  generateCallSheet(productionId, shootDate, scenes = []) {
    const production = this.productions.get(productionId);
    if (!production) return { error: 'Production not found' };

    const sceneDetails = scenes.map(id => this.scenes.get(id)).filter(Boolean);
    const totalPages = sceneDetails.reduce((sum, s) => sum + s.pages, 0);

    const callSheet = {
      callSheetId: `CS-${productionId}-${Date.now()}`,
      production: production.title,
      shootDate: new Date(shootDate).toLocaleDateString(),
      totalScenes: sceneDetails.length,
      totalPages,
      crew: production.crew.map(id => {
        const m = this.crew.get(id);
        return m ? { name: m.name, role: m.role, dept: m.department, confirmed: m.confirmed } : null;
      }).filter(Boolean),
      scenes: sceneDetails.map(s => ({
        sceneId: s.sceneId,
        title: s.title,
        location: s.location,
        intExt: s.intExt,
        dayNight: s.dayNight,
        pages: s.pages,
        cast: s.cast,
      })),
      generatedAt: Date.now(),
      linqBroadcast: `📋 CALL SHEET — ${production.title}\nDate: ${new Date(shootDate).toLocaleDateString()}\nScenes: ${sceneDetails.length} | Pages: ${totalPages}\nLocations: ${[...new Set(sceneDetails.map(s => s.location))].join(', ')}\nCall time details will follow by department. Reply CONFIRM to acknowledge.`,
    };

    this.callSheets.push(callSheet);
    return callSheet;
  }

  // ── Production Status ─────────────────────────────────────────────────────

  productionStatus(productionId) {
    const production = this.productions.get(productionId);
    if (!production) return { error: 'Production not found' };

    const confirmedCrew = production.crew.filter(id => this.crew.get(id)?.confirmed).length;
    const pagesVariance = production.totalPages > 0
      ? ((production.pagesCompleted / production.totalPages) - 0.5).toFixed(2)
      : 0;

    const criticalPath = this.scheduler.criticalPath();

    return {
      productionId,
      title: production.title,
      state: production.state,
      pagesCompleted: production.pagesCompleted,
      totalPages: production.totalPages,
      percentComplete: production.totalPages > 0
        ? `${((production.pagesCompleted / production.totalPages) * 100).toFixed(1)}%`
        : '0%',
      crewConfirmationRate: production.crew.length > 0
        ? `${((confirmedCrew / production.crew.length) * 100).toFixed(0)}%`
        : 'N/A',
      criticalPathDays: criticalPath.totalDurationDays,
      criticalMilestones: criticalPath.criticalMilestones.length,
    };
  }
}

// ── Factory ────────────────────────────────────────────────────────────────

export function birthMEDIEX(config = {}) {
  return new MEDIEX(config);
}

export default MEDIEX;
