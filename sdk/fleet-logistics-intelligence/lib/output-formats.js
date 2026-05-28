/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║       OUTPUT FORMATS — Multi-Format Export for Logistics Data              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

'use strict';

function toJSON(shipment, options = {}) {
  return options.pretty ? JSON.stringify(shipment, null, 2) : JSON.stringify(shipment);
}

function toCSV(shipments) {
  const arr = Array.isArray(shipments) ? shipments : [shipments];
  const header = 'shipment_id,carrier,origin,destination,distance_miles,weight_lbs,pieces,cargo_type,total_cost,status';
  const rows = arr.map(s =>
    `${s.shipmentId},${s.carrier.name},${s.route.origin.name},${s.route.destination.name},${s.route.distanceMiles},${s.cargo.weight},${s.cargo.pieces},${s.cargo.type},${s.costs.totalCost},${s.status}`
  );
  return [header, ...rows].join('\n');
}

function timelineToCSV(shipment) {
  const header = 'timestamp,event,location,note,updated_by';
  const rows = shipment.timeline.map(e => `${e.timestamp},${e.event},${e.location},${e.note},${e.updatedBy}`);
  return [header, ...rows].join('\n');
}

function toAPIPayload(shipment) {
  return {
    type: 'shipment_update',
    version: '1.0',
    timestamp: new Date().toISOString(),
    payload: {
      shipmentId: shipment.shipmentId,
      carrier: shipment.carrier.name,
      status: shipment.status,
      route: { origin: shipment.route.origin.name, destination: shipment.route.destination.name, miles: shipment.route.distanceMiles },
      cargo: { weight: shipment.cargo.weight, pieces: shipment.cargo.pieces, type: shipment.cargo.type },
      costs: shipment.costs,
      lastEvent: shipment.timeline[shipment.timeline.length - 1] || null,
    },
  };
}

function toEmbeddingBlocks(shipment) {
  return [
    { blockType: 'overview', text: `Shipment ${shipment.shipmentId}: ${shipment.cargo.description} from ${shipment.route.origin.name} to ${shipment.route.destination.name}, ${shipment.route.distanceMiles} miles, ${shipment.cargo.weight} lbs, status: ${shipment.status}` },
    { blockType: 'route', text: `Route: ${shipment.route.origin.address} → ${shipment.route.destination.address}. ${shipment.route.waypoints.length} stops. Est. ${shipment.route.estimatedHours} hours.` },
    { blockType: 'timeline', text: shipment.timeline.map(e => `${e.timestamp}: ${e.event} at ${e.location}`).join('. ') || 'No events yet.' },
  ];
}

module.exports = { toJSON, toCSV, timelineToCSV, toAPIPayload, toEmbeddingBlocks };
