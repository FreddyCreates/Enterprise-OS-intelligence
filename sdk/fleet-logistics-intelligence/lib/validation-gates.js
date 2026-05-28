/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║       VALIDATION GATES — Logistics Data Quality Checks                     ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { validateSchema } = require('./schema');

function gateSchemaCompleteness(shipment) {
  const result = validateSchema(shipment);
  return { gate: 'schema_completeness', passed: result.valid, errors: result.errors, warnings: [] };
}

function gateRouteValidity(shipment) {
  const errors = [];
  const warnings = [];
  if (shipment.route.distanceMiles <= 0 && shipment.status !== 'planned') {
    warnings.push('Distance is zero for non-planned shipment');
  }
  if (shipment.route.origin.name === shipment.route.destination.name) {
    warnings.push('Origin and destination are the same');
  }
  if (shipment.route.estimatedHours <= 0 && shipment.route.distanceMiles > 0) {
    warnings.push('No ETA set for route with distance');
  }
  return { gate: 'route_validity', passed: errors.length === 0, errors, warnings };
}

function gateCostConsistency(shipment) {
  const errors = [];
  const warnings = [];
  const computed = shipment.costs.baseCost + shipment.costs.fuelSurcharge + shipment.costs.accessorials + shipment.costs.insurance;
  if (shipment.costs.totalCost > 0 && Math.abs(computed - shipment.costs.totalCost) > 0.01) {
    warnings.push(`Cost components sum to $${computed.toFixed(2)} but total is $${shipment.costs.totalCost.toFixed(2)}`);
  }
  if (shipment.costs.totalCost < 0) errors.push('Negative total cost');
  return { gate: 'cost_consistency', passed: errors.length === 0, errors, warnings };
}

function gateCargoSafety(shipment) {
  const warnings = [];
  if (shipment.cargo.type === 'hazmat' && !shipment.cargo.specialInstructions.length) {
    warnings.push('Hazmat cargo without special instructions');
  }
  if (shipment.vehicle.capacity > 0 && shipment.cargo.weight > shipment.vehicle.capacity) {
    warnings.push(`Cargo weight (${shipment.cargo.weight}) exceeds vehicle capacity (${shipment.vehicle.capacity})`);
  }
  return { gate: 'cargo_safety', passed: true, errors: [], warnings };
}

function gateTimelineConsistency(shipment) {
  const warnings = [];
  const timeline = shipment.timeline;
  for (let i = 1; i < timeline.length; i++) {
    if (new Date(timeline[i].timestamp) < new Date(timeline[i - 1].timestamp)) {
      warnings.push(`Timeline event ${i} has earlier timestamp than event ${i - 1}`);
    }
  }
  return { gate: 'timeline_consistency', passed: true, errors: [], warnings };
}

function runAllGates(shipment) {
  const gates = [
    gateSchemaCompleteness(shipment),
    gateRouteValidity(shipment),
    gateCostConsistency(shipment),
    gateCargoSafety(shipment),
    gateTimelineConsistency(shipment),
  ];
  const allErrors = gates.flatMap(g => g.errors);
  const allWarnings = gates.flatMap(g => g.warnings);
  return { passed: gates.every(g => g.passed), gates, errors: allErrors, warnings: allWarnings };
}

module.exports = { gateSchemaCompleteness, gateRouteValidity, gateCostConsistency, gateCargoSafety, gateTimelineConsistency, runAllGates };
