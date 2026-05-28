/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║       LIBRARY 3: SHIPMENT TRACKING — Real-Time Status Intelligence         ║
 * ║                                                                            ║
 * ║  Tracks shipment lifecycle events, computes ETAs, detects delays,          ║
 * ║  and maintains delivery performance metrics.                               ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { createTimelineEntry } = require('./schema');

// ═══════════════════════════════════════════════════════════════════════════════
// STATUS MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

const STATUS_FLOW = ['planned', 'dispatched', 'picked-up', 'in-transit', 'out-for-delivery', 'delivered', 'cancelled'];
const VALID_EVENTS = [
  'created', 'dispatched', 'picked_up', 'departed', 'arrived_waypoint',
  'in_transit', 'delayed', 'out_for_delivery', 'delivered', 'failed_delivery',
  'returned', 'cancelled', 'exception',
];

/**
 * Add a tracking event to shipment timeline
 */
function addTrackingEvent(shipment, event, location, note, updatedBy) {
  const entry = createTimelineEntry(event, location, note, updatedBy);
  shipment.timeline.push(entry);

  // Auto-update status based on event
  const statusMap = {
    'dispatched': 'dispatched',
    'picked_up': 'in-transit',
    'departed': 'in-transit',
    'in_transit': 'in-transit',
    'out_for_delivery': 'out-for-delivery',
    'delivered': 'delivered',
    'cancelled': 'cancelled',
    'delayed': 'delayed',
  };

  if (statusMap[event]) {
    shipment.status = statusMap[event];
  }

  return entry;
}

/**
 * Compute current ETA based on timeline progress
 */
function computeETA(shipment) {
  const lastEvent = shipment.timeline[shipment.timeline.length - 1];
  if (!lastEvent) {
    return { eta: null, confidence: 0, basis: 'no-data' };
  }

  if (shipment.status === 'delivered') {
    return { eta: lastEvent.timestamp, confidence: 1.0, basis: 'delivered' };
  }

  const originalETA = shipment.route.estimatedHours;
  const elapsedMs = Date.now() - new Date(shipment.timeline[0].timestamp).getTime();
  const elapsedHours = elapsedMs / (60 * 60 * 1000);

  // Check if delayed
  const delays = shipment.timeline.filter(e => e.event === 'delayed');
  const totalDelayHours = delays.length * 2; // Estimate 2 hours per delay event

  const remainingHours = Math.max(0, originalETA - elapsedHours + totalDelayHours);
  const eta = new Date(Date.now() + remainingHours * 60 * 60 * 1000).toISOString();

  let confidence = 0.8;
  if (delays.length > 0) confidence -= 0.1 * delays.length;
  if (shipment.status === 'out-for-delivery') confidence = 0.95;

  return {
    eta,
    remainingHours: Math.round(remainingHours * 100) / 100,
    confidence: Math.max(0.1, Math.round(confidence * 100) / 100),
    basis: delays.length > 0 ? 'adjusted-for-delays' : 'on-schedule',
    delayCount: delays.length,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// DELAY DETECTION & ANALYSIS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Detect if shipment is running behind schedule
 */
function detectDelay(shipment) {
  if (shipment.status === 'delivered' || shipment.status === 'cancelled') {
    return { isDelayed: false };
  }

  const now = Date.now();
  const startTime = shipment.timeline.length > 0 ? new Date(shipment.timeline[0].timestamp).getTime() : now;
  const elapsedHours = (now - startTime) / (60 * 60 * 1000);
  const expectedHours = shipment.route.estimatedHours;

  if (expectedHours > 0 && elapsedHours > expectedHours * 1.2) {
    const delayHours = elapsedHours - expectedHours;
    return {
      isDelayed: true,
      delayHours: Math.round(delayHours * 100) / 100,
      delayPercent: Math.round((delayHours / expectedHours) * 10000) / 100,
      severity: delayHours > expectedHours * 0.5 ? 'critical' : delayHours > 2 ? 'major' : 'minor',
    };
  }

  return { isDelayed: false, onTimePercent: expectedHours > 0 ? Math.round((1 - elapsedHours / expectedHours) * 10000) / 100 : 100 };
}

// ═══════════════════════════════════════════════════════════════════════════════
// DELIVERY PERFORMANCE METRICS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Compute delivery performance from completed shipments
 */
function computeDeliveryPerformance(shipments) {
  const completed = shipments.filter(s => s.status === 'delivered');
  if (completed.length === 0) return { onTimeRate: 0, avgTransitHours: 0, shipments: 0 };

  let onTime = 0;
  let totalTransitHours = 0;
  let totalDelayHours = 0;

  for (const shipment of completed) {
    const start = shipment.timeline.find(e => e.event === 'picked_up' || e.event === 'dispatched');
    const end = shipment.timeline.find(e => e.event === 'delivered');

    if (start && end) {
      const transitHours = (new Date(end.timestamp) - new Date(start.timestamp)) / (60 * 60 * 1000);
      totalTransitHours += transitHours;

      if (transitHours <= shipment.route.estimatedHours * 1.1) {
        onTime++;
      } else {
        totalDelayHours += transitHours - shipment.route.estimatedHours;
      }
    }
  }

  return {
    shipments: completed.length,
    onTimeCount: onTime,
    onTimeRate: Math.round((onTime / completed.length) * 10000) / 100,
    avgTransitHours: Math.round(totalTransitHours / completed.length * 100) / 100,
    totalDelayHours: Math.round(totalDelayHours * 100) / 100,
    avgDelayHours: (completed.length - onTime) > 0 ? Math.round(totalDelayHours / (completed.length - onTime) * 100) / 100 : 0,
  };
}

/**
 * Compute carrier performance scores
 */
function carrierPerformance(shipments) {
  const byCarrier = {};

  for (const s of shipments) {
    const carrier = s.carrier.name || 'Unknown';
    if (!byCarrier[carrier]) byCarrier[carrier] = [];
    byCarrier[carrier].push(s);
  }

  return Object.entries(byCarrier).map(([carrier, carrierShipments]) => {
    const perf = computeDeliveryPerformance(carrierShipments);
    return { carrier, ...perf };
  }).sort((a, b) => b.onTimeRate - a.onTimeRate);
}

module.exports = {
  STATUS_FLOW,
  VALID_EVENTS,
  addTrackingEvent,
  computeETA,
  detectDelay,
  computeDeliveryPerformance,
  carrierPerformance,
};
