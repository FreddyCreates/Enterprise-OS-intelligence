/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║       FLEET LOGISTICS INTELLIGENCE — CANONICAL SCHEMA v1.0.0               ║
 * ║                                                                            ║
 * ║  Single source-of-truth data model for all logistics intelligence ops.     ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

'use strict';

// ═══════════════════════════════════════════════════════════════════════════════
// SHIPMENT SCHEMA
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * @typedef {Object} ShipmentRecord
 * @property {string} shipmentId - Unique shipment identifier
 * @property {string} version - Schema version
 * @property {CarrierInfo} carrier - Carrier/driver info
 * @property {RouteInfo} route - Origin, destination, waypoints
 * @property {CargoInfo} cargo - What's being shipped
 * @property {TimelineEntry[]} timeline - Status events
 * @property {CostBreakdown} costs - Shipping cost details
 * @property {VehicleInfo} vehicle - Vehicle/asset assigned
 * @property {AuditRecord} audit - Metadata
 * @property {string} status - planned | in-transit | delivered | delayed | cancelled
 */

/**
 * @typedef {Object} CarrierInfo
 * @property {string} name - Carrier company name
 * @property {string} code - Internal carrier code
 * @property {string} driver - Driver name or ID
 * @property {string} [phone] - Contact number
 * @property {string} [trackingNumber] - External tracking ID
 */

/**
 * @typedef {Object} RouteInfo
 * @property {LocationPoint} origin - Pickup location
 * @property {LocationPoint} destination - Delivery location
 * @property {LocationPoint[]} waypoints - Intermediate stops
 * @property {number} distanceMiles - Total route distance
 * @property {number} estimatedHours - Estimated travel time
 * @property {string} [routeType] - direct | multi-stop | return
 */

/**
 * @typedef {Object} LocationPoint
 * @property {string} name - Location name
 * @property {string} address - Full address
 * @property {number} [lat] - Latitude
 * @property {number} [lng] - Longitude
 * @property {string} [code] - Location code
 */

/**
 * @typedef {Object} CargoInfo
 * @property {string} description - What's being shipped
 * @property {number} weight - Total weight in lbs
 * @property {number} pieces - Number of pieces/pallets
 * @property {string} [type] - general | refrigerated | hazmat | fragile | oversized
 * @property {number} [value] - Declared value in dollars
 * @property {string[]} [specialInstructions] - Handling notes
 */

/**
 * @typedef {Object} TimelineEntry
 * @property {string} timestamp - ISO timestamp
 * @property {string} event - Status event type
 * @property {string} location - Where event occurred
 * @property {string} [note] - Additional context
 * @property {string} [updatedBy] - Who logged this
 */

/**
 * @typedef {Object} CostBreakdown
 * @property {number} baseCost - Base shipping rate
 * @property {number} fuelSurcharge - Fuel surcharge
 * @property {number} accessorials - Additional charges
 * @property {number} insurance - Insurance cost
 * @property {number} totalCost - Final total
 * @property {string} currency - USD, etc.
 * @property {string} rateType - per-mile | flat | per-pound | per-pallet
 */

/**
 * @typedef {Object} VehicleInfo
 * @property {string} vehicleId - Vehicle/asset ID
 * @property {string} type - truck | van | trailer | container
 * @property {number} capacity - Max capacity (lbs or cubic ft)
 * @property {string} [licensePlate] - License plate
 * @property {number} [mileage] - Current odometer
 * @property {string} [maintenanceStatus] - good | due-soon | overdue
 */

// ═══════════════════════════════════════════════════════════════════════════════
// FACTORY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

function createBlankShipment(shipmentId) {
  return {
    shipmentId: shipmentId || `SHP-${Date.now()}`,
    version: '1.0.0',
    carrier: { name: '', code: '', driver: '', phone: '', trackingNumber: '' },
    route: {
      origin: { name: '', address: '', lat: 0, lng: 0 },
      destination: { name: '', address: '', lat: 0, lng: 0 },
      waypoints: [],
      distanceMiles: 0,
      estimatedHours: 0,
      routeType: 'direct',
    },
    cargo: { description: '', weight: 0, pieces: 0, type: 'general', value: 0, specialInstructions: [] },
    timeline: [],
    costs: { baseCost: 0, fuelSurcharge: 0, accessorials: 0, insurance: 0, totalCost: 0, currency: 'USD', rateType: 'flat' },
    vehicle: { vehicleId: '', type: 'truck', capacity: 0 },
    audit: {
      createdAt: new Date().toISOString(),
      createdBy: 'system',
      sourceHash: '',
      confidence: 0,
      warnings: [],
    },
    status: 'planned',
  };
}

function createTimelineEntry(event, location, note, updatedBy) {
  return {
    timestamp: new Date().toISOString(),
    event,
    location: location || '',
    note: note || '',
    updatedBy: updatedBy || 'system',
  };
}

function createLocationPoint(name, address, lat, lng) {
  return { name, address: address || '', lat: lat || 0, lng: lng || 0, code: '' };
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCHEMA VALIDATION
// ═══════════════════════════════════════════════════════════════════════════════

const REQUIRED_FIELDS = [
  'shipmentId', 'carrier.name', 'route.origin.name', 'route.destination.name', 'cargo.description',
];

function validateSchema(shipment) {
  const errors = [];
  for (const field of REQUIRED_FIELDS) {
    const parts = field.split('.');
    let val = shipment;
    for (const p of parts) {
      val = val ? val[p] : undefined;
    }
    if (val === undefined || val === '' || val === null) {
      errors.push({ field, message: `Required field "${field}" is missing or empty` });
    }
  }
  if (shipment.cargo && shipment.cargo.weight < 0) {
    errors.push({ field: 'cargo.weight', message: 'Weight cannot be negative' });
  }
  if (shipment.route && shipment.route.distanceMiles < 0) {
    errors.push({ field: 'route.distanceMiles', message: 'Distance cannot be negative' });
  }
  return { valid: errors.length === 0, errors };
}

module.exports = {
  createBlankShipment,
  createTimelineEntry,
  createLocationPoint,
  validateSchema,
  REQUIRED_FIELDS,
};
