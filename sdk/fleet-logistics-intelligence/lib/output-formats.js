/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║       OUTPUT FORMATS — Multi-Format Export for Logistics Data              ║
 * ║                                                                            ║
 * ║  JSON, CSV, API payloads, markdown reports, and embeddings-ready text      ║
 * ║  blocks for downstream intelligence systems.                               ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

'use strict';

// ═══════════════════════════════════════════════════════════════════════════════
// JSON OUTPUT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Export shipment as clean JSON (for API consumption or storage).
 */
function toJSON(shipment, options = {}) {
  const data = options.compact ? {
    id: shipment.shipmentId,
    carrier: shipment.carrier.name,
    origin: shipment.route.origin.name,
    destination: shipment.route.destination.name,
    distance: shipment.route.distanceMiles,
    status: shipment.status,
    totalCost: shipment.costs.totalCost,
  } : JSON.parse(JSON.stringify(shipment));

  return options.pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
}

// ═══════════════════════════════════════════════════════════════════════════════
// CSV OUTPUT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Export shipments as CSV rows (header + data).
 */
function toCSV(shipments, options = {}) {
  const arr = Array.isArray(shipments) ? shipments : [shipments];
  const delimiter = options.delimiter || ',';

  const headers = [
    'shipment_id', 'carrier', 'carrier_code', 'origin', 'destination',
    'distance_miles', 'estimated_hours', 'weight_lbs', 'pieces', 'cargo_type',
    'line_haul', 'fuel_surcharge', 'accessorials', 'total_cost',
    'cost_per_mile', 'status', 'confidence',
  ];

  const rows = arr.map(s => [
    s.shipmentId,
    escapeCSV(s.carrier.name),
    s.carrier.code || '',
    escapeCSV(s.route.origin.name),
    escapeCSV(s.route.destination.name),
    s.route.distanceMiles,
    s.route.estimatedHours,
    s.cargo.weight,
    s.cargo.pieces,
    escapeCSV(s.cargo.type),
    s.costs.lineHaul || 0,
    s.costs.fuelSurcharge || 0,
    s.costs.accessorials || 0,
    s.costs.totalCost,
    s.route.distanceMiles > 0 ? Math.round((s.costs.totalCost / s.route.distanceMiles) * 100) / 100 : 0,
    s.status,
    s.audit.confidence || '',
  ]);

  const lines = [headers.join(delimiter)];
  for (const row of rows) {
    lines.push(row.join(delimiter));
  }
  return lines.join('\n');
}

/**
 * Export timeline events as CSV.
 */
function timelineToCSV(shipment, options = {}) {
  const delimiter = options.delimiter || ',';
  const headers = ['timestamp', 'event', 'location', 'note', 'updated_by'];
  const rows = shipment.timeline.map(e => [
    e.timestamp,
    escapeCSV(e.event),
    escapeCSV(e.location),
    escapeCSV(e.note || ''),
    escapeCSV(e.updatedBy || ''),
  ]);

  const lines = [headers.join(delimiter)];
  for (const row of rows) {
    lines.push(row.join(delimiter));
  }
  return lines.join('\n');
}

/**
 * Export fleet vehicle data as CSV.
 */
function fleetToCSV(vehicles, options = {}) {
  const arr = Array.isArray(vehicles) ? vehicles : [vehicles];
  const delimiter = options.delimiter || ',';

  const headers = ['vehicle_id', 'type', 'capacity_lbs', 'status', 'current_location', 'odometer', 'fuel_level', 'next_maintenance'];
  const rows = arr.map(v => [
    v.vehicleId,
    escapeCSV(v.type),
    v.capacityLbs || '',
    v.status,
    escapeCSV(v.currentLocation || ''),
    v.odometer || '',
    v.fuelLevel || '',
    v.nextMaintenance || '',
  ]);

  const lines = [headers.join(delimiter)];
  for (const row of rows) {
    lines.push(row.join(delimiter));
  }
  return lines.join('\n');
}

// ═══════════════════════════════════════════════════════════════════════════════
// API PAYLOAD
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Generate an API-ready payload (for webhooks, integrations, TMS).
 */
function toAPIPayload(shipment, options = {}) {
  return {
    event: options.event || 'shipment.updated',
    timestamp: new Date().toISOString(),
    version: '1.0',
    data: {
      shipment_id: shipment.shipmentId,
      carrier: {
        name: shipment.carrier.name,
        code: shipment.carrier.code,
        scac: shipment.carrier.scac || '',
      },
      route: {
        origin: shipment.route.origin.name,
        destination: shipment.route.destination.name,
        distance_miles: shipment.route.distanceMiles,
        estimated_hours: shipment.route.estimatedHours,
        waypoints: shipment.route.waypoints.length,
      },
      cargo: {
        type: shipment.cargo.type,
        weight: shipment.cargo.weight,
        pieces: shipment.cargo.pieces,
        description: shipment.cargo.description,
      },
      costs: {
        line_haul: shipment.costs.lineHaul || 0,
        fuel_surcharge: shipment.costs.fuelSurcharge || 0,
        accessorials: shipment.costs.accessorials || 0,
        total_cost: shipment.costs.totalCost,
        currency: shipment.costs.currency || 'USD',
      },
      status: shipment.status,
      last_event: shipment.timeline[shipment.timeline.length - 1] || null,
      metadata: {
        confidence: shipment.audit.confidence,
        source_hash: shipment.audit.sourceHash,
        warnings: shipment.audit.warnings || [],
      },
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// MARKDOWN REPORT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Generate a human-readable markdown report for a shipment.
 */
function toMarkdown(shipment) {
  const lines = [
    `# Shipment ${shipment.shipmentId}`,
    '',
    `**Status:** ${shipment.status}`,
    `**Carrier:** ${shipment.carrier.name} (${shipment.carrier.code || 'N/A'})`,
    '',
    '## Route',
    `- **Origin:** ${shipment.route.origin.name} — ${shipment.route.origin.address || ''}`,
    `- **Destination:** ${shipment.route.destination.name} — ${shipment.route.destination.address || ''}`,
    `- **Distance:** ${shipment.route.distanceMiles} miles`,
    `- **Est. Transit:** ${shipment.route.estimatedHours} hours`,
    `- **Stops:** ${shipment.route.waypoints.length}`,
    '',
    '## Cargo',
    `- **Type:** ${shipment.cargo.type}`,
    `- **Description:** ${shipment.cargo.description}`,
    `- **Weight:** ${shipment.cargo.weight} lbs`,
    `- **Pieces:** ${shipment.cargo.pieces}`,
    '',
    '## Costs',
    `| Line Item | Amount |`,
    `|:---|---:|`,
    `| Line Haul | $${shipment.costs.lineHaul || 0} |`,
    `| Fuel Surcharge | $${shipment.costs.fuelSurcharge || 0} |`,
    `| Accessorials | $${shipment.costs.accessorials || 0} |`,
    `| **Total** | **$${shipment.costs.totalCost}** |`,
    '',
    '## Timeline',
    '| Timestamp | Event | Location |',
    '|:---|:---|:---|',
  ];

  for (const event of shipment.timeline) {
    lines.push(`| ${event.timestamp} | ${event.event} | ${event.location} |`);
  }

  if (shipment.timeline.length === 0) {
    lines.push('| — | No events recorded | — |');
  }

  return lines.join('\n');
}

// ═══════════════════════════════════════════════════════════════════════════════
// EMBEDDINGS-READY TEXT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Generate text blocks optimized for vector embedding systems.
 */
function toEmbeddingBlocks(shipment) {
  const blocks = [];

  // Block 1: Overview (for broad semantic search)
  blocks.push({
    blockType: 'overview',
    text: `Shipment ${shipment.shipmentId}: ${shipment.cargo.description || shipment.cargo.type} ` +
      `from ${shipment.route.origin.name} to ${shipment.route.destination.name}, ` +
      `${shipment.route.distanceMiles} miles via ${shipment.carrier.name}. ` +
      `Weight: ${shipment.cargo.weight} lbs, ${shipment.cargo.pieces} pieces. Status: ${shipment.status}.`,
    metadata: { shipmentId: shipment.shipmentId, section: 'overview' },
  });

  // Block 2: Route detail (for geography/routing queries)
  blocks.push({
    blockType: 'route',
    text: `Route: ${shipment.route.origin.address || shipment.route.origin.name} → ` +
      `${shipment.route.destination.address || shipment.route.destination.name}. ` +
      `${shipment.route.waypoints.length} intermediate stops. ` +
      `Estimated transit: ${shipment.route.estimatedHours} hours. ` +
      `Distance: ${shipment.route.distanceMiles} miles.`,
    metadata: { shipmentId: shipment.shipmentId, section: 'route' },
  });

  // Block 3: Financial (for cost/billing queries)
  blocks.push({
    blockType: 'financial',
    text: `Shipment ${shipment.shipmentId} costs: line haul $${shipment.costs.lineHaul || 0}, ` +
      `fuel surcharge $${shipment.costs.fuelSurcharge || 0}, accessorials $${shipment.costs.accessorials || 0}. ` +
      `Total: $${shipment.costs.totalCost}. ` +
      `Cost per mile: $${shipment.route.distanceMiles > 0 ? Math.round((shipment.costs.totalCost / shipment.route.distanceMiles) * 100) / 100 : 0}.`,
    metadata: { shipmentId: shipment.shipmentId, section: 'financial' },
  });

  // Block 4: Timeline (for tracking/status queries)
  if (shipment.timeline.length > 0) {
    blocks.push({
      blockType: 'timeline',
      text: shipment.timeline.map(e =>
        `${e.timestamp}: ${e.event} at ${e.location}`
      ).join('. ') + '.',
      metadata: { shipmentId: shipment.shipmentId, section: 'timeline' },
    });
  }

  return blocks;
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

function escapeCSV(value) {
  if (typeof value !== 'string') return value;
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

module.exports = {
  toJSON,
  toCSV,
  timelineToCSV,
  fleetToCSV,
  toAPIPayload,
  toMarkdown,
  toEmbeddingBlocks,
};
