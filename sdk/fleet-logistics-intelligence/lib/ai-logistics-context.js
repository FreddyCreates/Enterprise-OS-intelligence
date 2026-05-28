/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║       LIBRARY 6: AI LOGISTICS CONTEXT — AI-Ready Shipment Packaging        ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

'use strict';

function toAIRecord(shipment) {
  return {
    id: shipment.shipmentId,
    type: 'shipment_record',
    embedding_text: generateEmbeddingText(shipment),
    structured: {
      carrier: shipment.carrier.name,
      origin: shipment.route.origin.name,
      destination: shipment.route.destination.name,
      distance: shipment.route.distanceMiles,
      weight: shipment.cargo.weight,
      pieces: shipment.cargo.pieces,
      cargoType: shipment.cargo.type,
      totalCost: shipment.costs.totalCost,
      status: shipment.status,
      events: shipment.timeline.length,
    },
    metadata: {
      createdAt: shipment.audit.createdAt,
      confidence: shipment.audit.confidence,
      tracking: shipment.carrier.trackingNumber,
    },
    signals: extractSignals(shipment),
  };
}

function generateEmbeddingText(shipment) {
  const parts = [
    `Shipment ${shipment.shipmentId} via ${shipment.carrier.name || 'unknown carrier'}`,
    `From: ${shipment.route.origin.name || shipment.route.origin.address}`,
    `To: ${shipment.route.destination.name || shipment.route.destination.address}`,
    `Distance: ${shipment.route.distanceMiles} miles`,
    `Cargo: ${shipment.cargo.description} (${shipment.cargo.weight} lbs, ${shipment.cargo.pieces} pieces, type: ${shipment.cargo.type})`,
    `Cost: $${shipment.costs.totalCost}`,
    `Status: ${shipment.status}`,
  ];
  if (shipment.route.waypoints.length > 0) {
    parts.push(`Stops: ${shipment.route.waypoints.map(w => w.name).join(', ')}`);
  }
  return parts.join('. ');
}

function extractSignals(shipment) {
  const signals = [];
  if (shipment.status === 'delayed') signals.push({ signal: 'shipment_delayed', severity: 'warning' });
  if (shipment.cargo.type === 'hazmat') signals.push({ signal: 'hazmat_cargo', severity: 'high' });
  if (shipment.cargo.value > 50000) signals.push({ signal: 'high_value_shipment', severity: 'medium' });
  if (shipment.route.distanceMiles > 1500) signals.push({ signal: 'long_haul', severity: 'info' });

  const delays = shipment.timeline.filter(e => e.event === 'delayed');
  if (delays.length >= 2) signals.push({ signal: 'multiple_delays', severity: 'critical' });

  return signals;
}

function buildFleetContext(shipments) {
  const active = shipments.filter(s => !['delivered', 'cancelled'].includes(s.status));
  return {
    totalShipments: shipments.length,
    activeShipments: active.length,
    totalMiles: shipments.reduce((s, sh) => s + sh.route.distanceMiles, 0),
    totalWeight: shipments.reduce((s, sh) => s + sh.cargo.weight, 0),
    totalCost: shipments.reduce((s, sh) => s + sh.costs.totalCost, 0),
    byStatus: shipments.reduce((acc, s) => { acc[s.status] = (acc[s.status] || 0) + 1; return acc; }, {}),
    byCarrier: shipments.reduce((acc, s) => { const c = s.carrier.name || 'Unknown'; acc[c] = (acc[c] || 0) + 1; return acc; }, {}),
    riskShipments: active.filter(s => s.status === 'delayed' || s.cargo.type === 'hazmat').map(s => s.shipmentId),
  };
}

function dispatchContext(shipment, etaInfo) {
  return {
    shipmentId: shipment.shipmentId,
    carrier: shipment.carrier.name,
    driver: shipment.carrier.driver,
    status: shipment.status,
    eta: etaInfo ? etaInfo.eta : null,
    remainingHours: etaInfo ? etaInfo.remainingHours : null,
    prompt: `Shipment ${shipment.shipmentId} carrying ${shipment.cargo.description} ` +
      `(${shipment.cargo.weight} lbs) from ${shipment.route.origin.name} to ${shipment.route.destination.name}. ` +
      `Status: ${shipment.status}. ETA: ${etaInfo ? etaInfo.eta : 'unknown'}. ` +
      `Recommend next action.`,
  };
}

module.exports = { toAIRecord, generateEmbeddingText, extractSignals, buildFleetContext, dispatchContext };
