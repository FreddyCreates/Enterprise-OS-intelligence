/**
 * RSHIP Water Grid Intelligence
 *
 * Official Designation: RSHIP-PROD-AQUA-001
 * Classification: Municipal Water Network Resilience Intelligence
 *
 * Run:
 *   node production-apps/rship-water-grid-intelligence.js
 */

const PHI = 1.618033988749895;
const PHI_INV = 1 / PHI;

class RshipWaterGridIntelligence {
  constructor(config = {}) {
    this.productId = config.productId || 'RSHIP-PROD-AQUA-001';
    this.networkName = config.networkName || 'Sovereign Water Grid';
    this.zones = new Map();
    this.sensors = new Map();
    this.incidents = [];
    this.commandReports = new Map();
  }

  registerZone(zoneId, profile = {}) {
    const zone = {
      zoneId,
      populationServed: profile.populationServed ?? 100000,
      baselineDemandMgd: profile.baselineDemandMgd ?? 22,
      criticality: profile.criticality ?? 0.75,
    };
    this.zones.set(zoneId, zone);
    return { ok: true, zone };
  }

  ingestSensorPacket(packetId, payload = {}) {
    const packet = {
      packetId,
      zoneId: payload.zoneId || 'ZONE-UNKNOWN',
      pressurePsi: Number.isFinite(payload.pressurePsi) ? payload.pressurePsi : 52,
      chlorinePpm: Number.isFinite(payload.chlorinePpm) ? payload.chlorinePpm : 1.8,
      turbidityNtu: Number.isFinite(payload.turbidityNtu) ? payload.turbidityNtu : 0.4,
      flowMgd: Number.isFinite(payload.flowMgd) ? payload.flowMgd : 18,
      ts: new Date().toISOString(),
    };
    this.sensors.set(packetId, packet);
    return { ok: true, packet };
  }

  detectIncident(packetId) {
    const packet = this.sensors.get(packetId);
    if (!packet) return { ok: false, error: `packet not found: ${packetId}` };
    const zone = this.zones.get(packet.zoneId) || { criticality: 0.5, baselineDemandMgd: 18 };

    const pressureRisk = Math.max(0, Math.abs(packet.pressurePsi - 55) / 40);
    const qualityRisk = Math.max(0, (packet.turbidityNtu - 0.8) * 0.6) + Math.max(0, (1.0 - packet.chlorinePpm) * 0.45);
    const demandRisk = Math.max(0, (packet.flowMgd - zone.baselineDemandMgd) / (zone.baselineDemandMgd + 1));
    const riskScore = Math.min(1, pressureRisk * 0.28 + qualityRisk * 0.44 + demandRisk * 0.28 + zone.criticality * 0.12);
    const severity = riskScore >= 0.65 ? 'critical' : riskScore >= 0.42 ? 'major' : 'stable';

    const incident = {
      incidentId: `AQ-INC-${this.incidents.length + 1}`,
      zoneId: packet.zoneId,
      packetId,
      riskScore: Number(riskScore.toFixed(4)),
      severity,
      responseClass: severity === 'critical' ? 'P0' : severity === 'major' ? 'P1' : 'P2',
      ts: new Date().toISOString(),
    };
    this.incidents.push(incident);
    return { ok: true, incident };
  }

  buildCommandReport(reportId) {
    if (this.incidents.length === 0) return { ok: false, error: 'no incidents available' };
    const latest = this.incidents.slice(-12);
    const avgRisk = latest.reduce((sum, i) => sum + i.riskScore, 0) / latest.length;
    const criticalCount = latest.filter(i => i.severity === 'critical').length;
    const confidence = Number((Math.min(1, PHI_INV * 0.6 + Math.min(1, latest.length / 12) * 0.4)).toFixed(4));
    const resilienceScore = Number((Math.max(0, 100 - avgRisk * 100 * PHI_INV)).toFixed(3));
    const mathGrade =
      resilienceScore >= 90 && confidence > 0.85 ? 'A+' :
      resilienceScore >= 80 ? 'A' :
      resilienceScore >= 70 ? 'B' :
      resilienceScore >= 60 ? 'C' : 'D';

    const actions = [
      criticalCount > 0 ? 'deploy emergency valve control and pressure isolation' : 'maintain adaptive pressure balancing',
      avgRisk > 0.5 ? 'increase chlorine and turbidity sampling cadence to 5-minute windows' : 'keep 15-minute quality telemetry cadence',
      'run cross-zone redistribution to preserve hospital and school service continuity',
    ];

    const report = {
      reportId,
      productId: this.productId,
      networkName: this.networkName,
      zones: this.zones.size,
      packetsAnalyzed: this.sensors.size,
      incidentsAnalyzed: latest.length,
      avgRisk: Number(avgRisk.toFixed(4)),
      resilienceScore,
      confidence,
      mathGrade,
      actions,
      ts: new Date().toISOString(),
    };
    this.commandReports.set(reportId, report);
    return { ok: true, report };
  }
}

function demo() {
  const aqua = new RshipWaterGridIntelligence({ networkName: 'Metro Aqua Shield' });
  console.log(aqua.registerZone('ZONE-ALPHA', { populationServed: 250000, baselineDemandMgd: 34, criticality: 0.9 }));
  console.log(aqua.registerZone('ZONE-BETA', { populationServed: 180000, baselineDemandMgd: 27, criticality: 0.74 }));

  console.log(aqua.ingestSensorPacket('PACKET-001', {
    zoneId: 'ZONE-ALPHA',
    pressurePsi: 43,
    chlorinePpm: 0.9,
    turbidityNtu: 1.4,
    flowMgd: 39,
  }));
  console.log(aqua.ingestSensorPacket('PACKET-002', {
    zoneId: 'ZONE-BETA',
    pressurePsi: 57,
    chlorinePpm: 1.6,
    turbidityNtu: 0.6,
    flowMgd: 25,
  }));

  console.log(aqua.detectIncident('PACKET-001'));
  console.log(aqua.detectIncident('PACKET-002'));
  console.log(aqua.buildCommandReport('AQUA-CMD-001'));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  demo();
}

export { RshipWaterGridIntelligence };
