/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║       LIBRARY 4: FLEET MANAGEMENT — Vehicle & Asset Intelligence           ║
 * ║                                                                            ║
 * ║  Tracks vehicle utilization, maintenance schedules, fuel efficiency,       ║
 * ║  and capacity planning for fleet optimization.                             ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

'use strict';

// ═══════════════════════════════════════════════════════════════════════════════
// FLEET STATUS & UTILIZATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Compute fleet utilization metrics
 */
function computeFleetUtilization(vehicles, activeShipments) {
  const activeVehicleIds = new Set(activeShipments.map(s => s.vehicle.vehicleId).filter(Boolean));

  const inUse = vehicles.filter(v => activeVehicleIds.has(v.vehicleId));
  const idle = vehicles.filter(v => !activeVehicleIds.has(v.vehicleId) && v.maintenanceStatus !== 'overdue');
  const maintenance = vehicles.filter(v => v.maintenanceStatus === 'overdue');

  return {
    total: vehicles.length,
    inUse: inUse.length,
    idle: idle.length,
    inMaintenance: maintenance.length,
    utilizationRate: vehicles.length > 0 ? Math.round((inUse.length / vehicles.length) * 10000) / 100 : 0,
    idleVehicles: idle.map(v => ({ vehicleId: v.vehicleId, type: v.type, capacity: v.capacity })),
    maintenanceDue: maintenance.map(v => ({ vehicleId: v.vehicleId, type: v.type })),
  };
}

/**
 * Compute capacity utilization for a single shipment
 */
function computeCapacityUtilization(shipment) {
  if (!shipment.vehicle.capacity || shipment.vehicle.capacity <= 0) {
    return { utilizationPercent: 0, available: 0 };
  }

  const used = shipment.cargo.weight;
  const capacity = shipment.vehicle.capacity;
  const available = capacity - used;

  return {
    capacity,
    used,
    available: Math.max(0, available),
    utilizationPercent: Math.round((used / capacity) * 10000) / 100,
    isOverloaded: used > capacity,
    overloadAmount: Math.max(0, used - capacity),
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAINTENANCE INTELLIGENCE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Compute maintenance schedule recommendations
 */
function maintenanceSchedule(vehicles, maintenanceHistory = []) {
  const schedule = [];
  const now = new Date();

  for (const vehicle of vehicles) {
    const history = maintenanceHistory.filter(m => m.vehicleId === vehicle.vehicleId);
    const lastService = history.length > 0
      ? history.sort((a, b) => new Date(b.date) - new Date(a.date))[0]
      : null;

    const daysSinceService = lastService
      ? Math.ceil((now - new Date(lastService.date)) / (24 * 60 * 60 * 1000))
      : 999;

    const milesSinceService = lastService
      ? (vehicle.mileage || 0) - (lastService.mileageAtService || 0)
      : vehicle.mileage || 0;

    let urgency = 'none';
    if (daysSinceService > 180 || milesSinceService > 15000) urgency = 'overdue';
    else if (daysSinceService > 150 || milesSinceService > 12000) urgency = 'due-soon';
    else if (daysSinceService > 120 || milesSinceService > 10000) urgency = 'upcoming';

    if (urgency !== 'none') {
      schedule.push({
        vehicleId: vehicle.vehicleId,
        type: vehicle.type,
        urgency,
        daysSinceService,
        milesSinceService,
        lastServiceDate: lastService ? lastService.date : null,
        recommended: urgency === 'overdue' ? 'immediate' : `within ${180 - daysSinceService} days`,
      });
    }
  }

  return schedule.sort((a, b) => {
    const urgencyOrder = { overdue: 0, 'due-soon': 1, upcoming: 2 };
    return (urgencyOrder[a.urgency] || 3) - (urgencyOrder[b.urgency] || 3);
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// FUEL & EFFICIENCY
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Compute fuel efficiency metrics
 */
function fuelEfficiency(fuelRecords) {
  if (!fuelRecords || fuelRecords.length === 0) return { avgMPG: 0, records: 0 };

  const withMPG = fuelRecords.filter(r => r.miles > 0 && r.gallons > 0).map(r => ({
    ...r,
    mpg: Math.round((r.miles / r.gallons) * 100) / 100,
    costPerMile: r.cost > 0 ? Math.round((r.cost / r.miles) * 100) / 100 : 0,
  }));

  const avgMPG = withMPG.length > 0
    ? Math.round(withMPG.reduce((s, r) => s + r.mpg, 0) / withMPG.length * 100) / 100
    : 0;

  const totalCost = withMPG.reduce((s, r) => s + (r.cost || 0), 0);
  const totalMiles = withMPG.reduce((s, r) => s + r.miles, 0);

  return {
    records: withMPG.length,
    avgMPG,
    totalGallons: Math.round(withMPG.reduce((s, r) => s + r.gallons, 0) * 100) / 100,
    totalCost: Math.round(totalCost * 100) / 100,
    totalMiles,
    avgCostPerMile: totalMiles > 0 ? Math.round(totalCost / totalMiles * 100) / 100 : 0,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// FLEET SUMMARY FOR AI
// ═══════════════════════════════════════════════════════════════════════════════

function fleetSummary(vehicles, activeShipments, maintenanceHistory) {
  const utilization = computeFleetUtilization(vehicles, activeShipments);
  const maintenance = maintenanceSchedule(vehicles, maintenanceHistory);

  return {
    utilization,
    maintenanceAlerts: maintenance.filter(m => m.urgency === 'overdue' || m.urgency === 'due-soon'),
    vehicleTypes: vehicles.reduce((acc, v) => { acc[v.type] = (acc[v.type] || 0) + 1; return acc; }, {}),
    totalCapacity: vehicles.reduce((s, v) => s + (v.capacity || 0), 0),
    activeLoad: activeShipments.reduce((s, sh) => s + (sh.cargo.weight || 0), 0),
  };
}

module.exports = {
  computeFleetUtilization,
  computeCapacityUtilization,
  maintenanceSchedule,
  fuelEfficiency,
  fleetSummary,
};
