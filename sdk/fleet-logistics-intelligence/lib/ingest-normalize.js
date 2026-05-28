/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║       LIBRARY 1: INGEST-NORMALIZE — Raw Logistics Data Standardizer        ║
 * ║                                                                            ║
 * ║  Cleans and standardizes raw shipment data from TMS, dispatch logs,        ║
 * ║  BOLs, and free-text notes into canonical schema format.                   ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

'use strict';

const crypto = require('crypto');
const { createBlankShipment, createLocationPoint } = require('./schema');

// ═══════════════════════════════════════════════════════════════════════════════
// TEXT CLEANING & NORMALIZATION
// ═══════════════════════════════════════════════════════════════════════════════

function cleanText(raw) {
  if (!raw || typeof raw !== 'string') return '';
  return raw.replace(/\r\n/g, '\n').replace(/\t/g, ' ').replace(/ {2,}/g, ' ').replace(/^\s+|\s+$/gm, '').trim();
}

function normalizeWeight(value, fromUnit = 'lbs') {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') return 0;
  const num = parseFloat(value.replace(/[,\s]/g, ''));
  if (isNaN(num)) return 0;
  if (fromUnit === 'kg') return Math.round(num * 2.20462 * 100) / 100;
  if (fromUnit === 'tons') return num * 2000;
  return num;
}

function normalizeDistance(value, fromUnit = 'miles') {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') return 0;
  const num = parseFloat(value.replace(/[,\s]/g, ''));
  if (isNaN(num)) return 0;
  if (fromUnit === 'km') return Math.round(num * 0.621371 * 100) / 100;
  return num;
}

function normalizeAddress(input) {
  if (!input || typeof input !== 'string') return '';
  return input.replace(/\s+/g, ' ').replace(/,\s*/g, ', ').trim();
}

// ═══════════════════════════════════════════════════════════════════════════════
// STRUCTURED INPUT INGESTION
// ═══════════════════════════════════════════════════════════════════════════════

function ingestStructured(data) {
  const shipment = createBlankShipment(data.shipmentId || data.id || data.trackingNumber);

  // Carrier
  if (data.carrier || data.carrierName) {
    const c = data.carrier || {};
    shipment.carrier.name = c.name || data.carrierName || '';
    shipment.carrier.code = c.code || shipment.carrier.name.replace(/\s+/g, '-').toUpperCase();
    shipment.carrier.driver = c.driver || data.driver || '';
    shipment.carrier.phone = c.phone || data.driverPhone || '';
    shipment.carrier.trackingNumber = c.trackingNumber || data.trackingNumber || '';
  }

  // Route
  if (data.origin || data.from || data.pickup) {
    const orig = data.origin || data.from || data.pickup;
    if (typeof orig === 'string') {
      shipment.route.origin = createLocationPoint(orig, orig);
    } else {
      shipment.route.origin = { name: orig.name || '', address: normalizeAddress(orig.address || ''), lat: orig.lat || 0, lng: orig.lng || 0, code: orig.code || '' };
    }
  }
  if (data.destination || data.to || data.delivery) {
    const dest = data.destination || data.to || data.delivery;
    if (typeof dest === 'string') {
      shipment.route.destination = createLocationPoint(dest, dest);
    } else {
      shipment.route.destination = { name: dest.name || '', address: normalizeAddress(dest.address || ''), lat: dest.lat || 0, lng: dest.lng || 0, code: dest.code || '' };
    }
  }
  if (data.waypoints) shipment.route.waypoints = data.waypoints;
  shipment.route.distanceMiles = normalizeDistance(data.distance || data.miles || 0);
  shipment.route.estimatedHours = parseFloat(data.estimatedHours || data.eta || 0) || 0;
  shipment.route.routeType = data.routeType || 'direct';

  // Cargo
  if (data.cargo || data.freight) {
    const cargo = data.cargo || data.freight || {};
    shipment.cargo.description = cargo.description || data.description || '';
    shipment.cargo.weight = normalizeWeight(cargo.weight || data.weight || 0);
    shipment.cargo.pieces = parseInt(cargo.pieces || data.pieces || data.pallets || 0) || 0;
    shipment.cargo.type = cargo.type || data.freightType || 'general';
    shipment.cargo.value = parseFloat(cargo.value || data.declaredValue || 0) || 0;
    shipment.cargo.specialInstructions = cargo.specialInstructions || data.instructions || [];
  }

  // Costs
  if (data.costs || data.rate) {
    const costs = data.costs || {};
    shipment.costs.baseCost = parseFloat(costs.baseCost || costs.base || data.rate || 0) || 0;
    shipment.costs.fuelSurcharge = parseFloat(costs.fuelSurcharge || costs.fuel || 0) || 0;
    shipment.costs.accessorials = parseFloat(costs.accessorials || 0) || 0;
    shipment.costs.insurance = parseFloat(costs.insurance || 0) || 0;
    shipment.costs.totalCost = shipment.costs.baseCost + shipment.costs.fuelSurcharge + shipment.costs.accessorials + shipment.costs.insurance;
    shipment.costs.rateType = costs.rateType || data.rateType || 'flat';
  }

  // Vehicle
  if (data.vehicle || data.truck) {
    const v = data.vehicle || data.truck || {};
    shipment.vehicle.vehicleId = v.vehicleId || v.id || '';
    shipment.vehicle.type = v.type || 'truck';
    shipment.vehicle.capacity = parseFloat(v.capacity || 0) || 0;
    shipment.vehicle.licensePlate = v.licensePlate || v.plate || '';
  }

  shipment.status = data.status || 'planned';
  shipment.audit.createdAt = new Date().toISOString();
  shipment.audit.sourceHash = hashInput(JSON.stringify(data));
  shipment.audit.confidence = 1.0;

  return shipment;
}

/**
 * Ingest raw text (BOL, dispatch notes, etc.)
 */
function ingestRawText(text) {
  const cleaned = cleanText(text);
  const shipment = createBlankShipment();

  // Extract tracking/shipment number
  const trackMatch = cleaned.match(/(?:Tracking|Shipment|BOL|PRO)\s*(?:No\.?|Number|#)\s*:?\s*([A-Z0-9\-]+)/i);
  if (trackMatch) shipment.shipmentId = trackMatch[1];

  // Extract carrier
  const carrierMatch = cleaned.match(/(?:Carrier|Shipper)\s*:?\s*(.+)/i);
  if (carrierMatch) shipment.carrier.name = carrierMatch[1].trim();

  // Extract origin/destination
  const fromMatch = cleaned.match(/(?:From|Origin|Pickup|Ship From)\s*:?\s*(.+)/i);
  if (fromMatch) shipment.route.origin = createLocationPoint(fromMatch[1].trim(), fromMatch[1].trim());

  const toMatch = cleaned.match(/(?:To|Destination|Deliver To|Ship To)\s*:?\s*(.+)/i);
  if (toMatch) shipment.route.destination = createLocationPoint(toMatch[1].trim(), toMatch[1].trim());

  // Extract weight
  const weightMatch = cleaned.match(/([\d,]+)\s*(?:lbs?|pounds?|kg)/i);
  if (weightMatch) shipment.cargo.weight = normalizeWeight(weightMatch[1]);

  // Extract pieces
  const piecesMatch = cleaned.match(/(\d+)\s*(?:pieces?|pallets?|skids?|cartons?)/i);
  if (piecesMatch) shipment.cargo.pieces = parseInt(piecesMatch[1]);

  shipment.audit.sourceHash = hashInput(text);
  shipment.audit.confidence = computeConfidence(shipment);
  shipment.audit.createdBy = 'ingest-normalize/raw-text';

  return shipment;
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

function hashInput(str) {
  return crypto.createHash('sha256').update(str).digest('hex').slice(0, 16);
}

function computeConfidence(shipment) {
  let score = 0;
  let checks = 0;
  const check = (val) => { checks++; if (val) score++; };

  check(shipment.carrier.name);
  check(shipment.route.origin.name);
  check(shipment.route.destination.name);
  check(shipment.cargo.description || shipment.cargo.weight > 0);
  check(shipment.cargo.weight > 0);

  return checks > 0 ? Math.round((score / checks) * 100) / 100 : 0;
}

module.exports = {
  cleanText,
  normalizeWeight,
  normalizeDistance,
  normalizeAddress,
  ingestStructured,
  ingestRawText,
  hashInput,
  computeConfidence,
};
