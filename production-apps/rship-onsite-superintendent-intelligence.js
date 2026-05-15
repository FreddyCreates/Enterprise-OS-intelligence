/**
 * RSHIP Onsite Superintendent Intelligence
 *
 * Official Designation: RSHIP-PROD-SUPER-001
 * Classification: Big-GC Onsite Office Intelligence for Field Superintendents
 *
 * Run:
 *   node production-apps/rship-onsite-superintendent-intelligence.js
 */

import { ConstruxAGI } from '../sdk/construx-agi/construx-agi.js';
import { LegexAGI } from '../sdk/legex-agi/legex-agi.js';

const PHI = 1.618033988749895;
const PHI_INV = 1 / PHI;

class RshipOnsiteSuperintendentIntelligence {
  constructor(config = {}) {
    this.productId = config.productId || 'RSHIP-PROD-SUPER-001';
    this.gcName = config.gcName || 'Sovereign General Contractor';
    this.construx = new ConstruxAGI();
    this.legex = new LegexAGI();
    this.siteOffices = new Map();
    this.dailyLogs = new Map();
    this.deliveryLedger = new Map();
  }

  registerProjectSiteOffice(projectId, profile = {}) {
    const office = {
      projectId,
      projectName: profile.projectName || `Project ${projectId}`,
      location: profile.location || 'metro-region',
      officeTrailerId: profile.officeTrailerId || `TRAILER-${projectId}`,
      superintendent: profile.superintendent || 'onsite-super-1',
      workersOnsite: profile.workersOnsite ?? 220,
      subcontractorsOnsite: profile.subcontractorsOnsite ?? 18,
      baselineDailyTasks: profile.baselineDailyTasks ?? 35,
      createdAt: new Date().toISOString(),
    };

    this.construx.createProject(projectId, office.projectName, profile.budget ?? 125000000);
    this.siteOffices.set(projectId, office);
    this.dailyLogs.set(projectId, []);
    this.deliveryLedger.set(projectId, []);
    return { ok: true, office };
  }

  logFieldWalk(projectId, observation = {}) {
    const office = this.siteOffices.get(projectId);
    if (!office) return { ok: false, error: `site office not found: ${projectId}` };

    const log = {
      walkId: `WALK-${projectId}-${Date.now().toString(36)}`,
      area: observation.area || 'general',
      qualityIssue: observation.qualityIssue || null,
      safetyIssue: observation.safetyIssue || null,
      trade: observation.trade || 'general',
      blockers: Array.isArray(observation.blockers) ? observation.blockers : [],
      ts: new Date().toISOString(),
    };

    if (log.safetyIssue) {
      this.construx.logIncident(projectId, 'field-walk', 'near_miss', log.safetyIssue, 1);
    }

    const logs = this.dailyLogs.get(projectId);
    logs.push(log);
    return { ok: true, log };
  }

  issueTrailerRFI(projectId, subject, description, priority = 'high') {
    if (!this.siteOffices.has(projectId)) return { ok: false, error: `site office not found: ${projectId}` };
    const rfi = this.construx.submitRFI(projectId, subject, description, priority);
    return { ok: true, rfi };
  }

  receiveMaterialDelivery(projectId, delivery = {}) {
    const office = this.siteOffices.get(projectId);
    if (!office) return { ok: false, error: `site office not found: ${projectId}` };

    const ticket = {
      deliveryId: delivery.deliveryId || `DLV-${projectId}-${Date.now().toString(36)}`,
      trade: delivery.trade || 'structural',
      material: delivery.material || 'general-materials',
      plannedHour: delivery.plannedHour ?? 7,
      actualHour: delivery.actualHour ?? 8,
      quantity: delivery.quantity ?? 1,
      ts: new Date().toISOString(),
    };
    const delayHours = Math.max(0, ticket.actualHour - ticket.plannedHour);
    ticket.delayHours = delayHours;
    ticket.status = delayHours > 2 ? 'critical-delay' : delayHours > 0 ? 'minor-delay' : 'on-time';

    this.deliveryLedger.get(projectId).push(ticket);
    return { ok: true, ticket };
  }

  buildDailySuperPlan(projectId, crewPlan = {}) {
    const office = this.siteOffices.get(projectId);
    if (!office) return { ok: false, error: `site office not found: ${projectId}` };

    const plannedTasks = crewPlan.plannedTasks ?? office.baselineDailyTasks;
    const completedTasks = crewPlan.completedTasks ?? Math.floor(plannedTasks * 0.82);
    const safetyScore = Number(this.construx.dashboard(projectId).safety.score);
    const deliveries = this.deliveryLedger.get(projectId);
    const avgDelay = deliveries.length === 0
      ? 0
      : deliveries.reduce((sum, d) => sum + d.delayHours, 0) / deliveries.length;
    const flowScore = Math.max(0, Math.min(1, (completedTasks / Math.max(1, plannedTasks)) - avgDelay * 0.05));
    const executionScore = Number((flowScore * 0.62 + safetyScore * 0.38).toFixed(4));
    const grade =
      executionScore >= 0.9 ? 'A+' :
      executionScore >= 0.8 ? 'A' :
      executionScore >= 0.7 ? 'B' :
      executionScore >= 0.6 ? 'C' : 'D';

    const nextShiftActions = [
      avgDelay > 1.5 ? 'expedite morning deliveries to onsite office staging area' : 'hold current delivery cadence and buffer strategy',
      safetyScore < PHI_INV ? 'run immediate toolbox talk with all foremen and subcontractor leads' : 'continue standard safety cadence with targeted reminders',
      completedTasks < plannedTasks ? 'rebalance crews across critical-path workfaces before 06:30' : 'preserve crew allocation and push finishing scopes',
    ];

    return {
      ok: true,
      projectId,
      superintendent: office.superintendent,
      officeTrailerId: office.officeTrailerId,
      plannedTasks,
      completedTasks,
      safetyScore: Number(safetyScore.toFixed(4)),
      avgDeliveryDelayHours: Number(avgDelay.toFixed(3)),
      executionScore,
      mathGrade: grade,
      nextShiftActions,
    };
  }

  complianceSnapshot(projectId) {
    if (!this.siteOffices.has(projectId)) return { ok: false, error: `site office not found: ${projectId}` };
    const report = this.legex.mapCompliance(`onsite-super-${projectId}`, 'construction-field-ops', ['US']);
    return { ok: true, report };
  }
}

function demo() {
  const superIntel = new RshipOnsiteSuperintendentIntelligence({
    gcName: 'Titan Metro GC',
  });

  console.log(superIntel.registerProjectSiteOffice('GC-TOWER-001', {
    projectName: 'Harbor District Tower',
    officeTrailerId: 'TRAILER-HDT-01',
    superintendent: 'super-j.martinez',
    workersOnsite: 410,
    subcontractorsOnsite: 29,
    baselineDailyTasks: 64,
    budget: 320000000,
  }));

  console.log(superIntel.logFieldWalk('GC-TOWER-001', {
    area: 'level-24-core',
    qualityIssue: 'rebar spacing mismatch in one segment',
    safetyIssue: 'open edge without full guardrail at south face',
    trade: 'concrete',
    blockers: ['pending rebar clarification'],
  }));

  console.log(superIntel.receiveMaterialDelivery('GC-TOWER-001', {
    trade: 'facade',
    material: 'curtain-wall-panels',
    plannedHour: 6,
    actualHour: 9,
    quantity: 42,
  }));

  console.log(superIntel.issueTrailerRFI(
    'GC-TOWER-001',
    'Curtain wall anchor embed conflict',
    'Field dimensions differ from latest sheet A6.24 at grid E-12.',
    'high'
  ));

  console.log(superIntel.buildDailySuperPlan('GC-TOWER-001', {
    plannedTasks: 66,
    completedTasks: 51,
  }));
  console.log(superIntel.complianceSnapshot('GC-TOWER-001'));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  demo();
}

export { RshipOnsiteSuperintendentIntelligence };
