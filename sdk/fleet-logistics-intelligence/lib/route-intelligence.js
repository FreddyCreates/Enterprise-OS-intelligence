/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║       LIBRARY 2: ROUTE INTELLIGENCE — Routing & Distance Optimization      ║
 * ║                                                                            ║
 * ║  Computes route metrics, estimates delivery times, optimizes multi-stop    ║
 * ║  sequences, and provides cost-per-mile analysis.                           ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

'use strict';

// ═══════════════════════════════════════════════════════════════════════════════
// DISTANCE & TIME ESTIMATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Estimate distance between two coordinates using Haversine formula
 */
function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 3959; // Earth radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
}

function toRad(deg) {
  return deg * (Math.PI / 180);
}

/**
 * Estimate travel time based on distance and conditions
 */
function estimateTravelTime(distanceMiles, options = {}) {
  const avgSpeedMph = options.avgSpeed || 55; // Default highway speed
  const restStopHours = Math.floor(distanceMiles / 500) * 0.5; // 30min rest every 500 miles
  const loadingHours = options.loadingTime || 1; // Loading/unloading
  const baseHours = distanceMiles / avgSpeedMph;

  // HOS (Hours of Service) compliance: 11hr drive limit per day
  const driveDays = Math.ceil(baseHours / 11);
  const hosRestHours = driveDays > 1 ? (driveDays - 1) * 10 : 0; // 10hr rest between shifts

  const totalHours = baseHours + restStopHours + loadingHours + hosRestHours;

  return {
    drivingHours: Math.round(baseHours * 100) / 100,
    restHours: restStopHours + hosRestHours,
    loadingHours,
    totalHours: Math.round(totalHours * 100) / 100,
    driveDays,
    estimatedArrival: new Date(Date.now() + totalHours * 60 * 60 * 1000).toISOString(),
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROUTE OPTIMIZATION (NEAREST NEIGHBOR HEURISTIC)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Optimize multi-stop route using nearest-neighbor heuristic
 */
function optimizeMultiStop(origin, stops, returnToOrigin = false) {
  if (stops.length <= 1) return { optimizedStops: stops, totalDistance: 0, savings: 0 };

  const unvisited = [...stops];
  const route = [];
  let current = origin;
  let totalDistance = 0;

  while (unvisited.length > 0) {
    let nearest = 0;
    let nearestDist = Infinity;

    for (let i = 0; i < unvisited.length; i++) {
      const dist = haversineDistance(current.lat, current.lng, unvisited[i].lat, unvisited[i].lng);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = i;
      }
    }

    totalDistance += nearestDist;
    current = unvisited[nearest];
    route.push(unvisited.splice(nearest, 1)[0]);
  }

  if (returnToOrigin) {
    totalDistance += haversineDistance(current.lat, current.lng, origin.lat, origin.lng);
  }

  // Compare to naive order
  let naiveDistance = 0;
  let navCurrent = origin;
  for (const stop of stops) {
    naiveDistance += haversineDistance(navCurrent.lat, navCurrent.lng, stop.lat, stop.lng);
    navCurrent = stop;
  }

  return {
    optimizedStops: route,
    totalDistance: Math.round(totalDistance * 100) / 100,
    naiveDistance: Math.round(naiveDistance * 100) / 100,
    savings: Math.round((naiveDistance - totalDistance) * 100) / 100,
    savingsPercent: naiveDistance > 0 ? Math.round((1 - totalDistance / naiveDistance) * 10000) / 100 : 0,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// COST ANALYSIS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Compute cost-per-mile metrics
 */
function costPerMileAnalysis(shipment) {
  const miles = shipment.route.distanceMiles;
  if (miles <= 0) return { costPerMile: 0, revenuePerMile: 0 };

  return {
    totalCost: shipment.costs.totalCost,
    distanceMiles: miles,
    costPerMile: Math.round(shipment.costs.totalCost / miles * 100) / 100,
    fuelPerMile: Math.round(shipment.costs.fuelSurcharge / miles * 100) / 100,
    basePerMile: Math.round(shipment.costs.baseCost / miles * 100) / 100,
    costPerPound: shipment.cargo.weight > 0 ? Math.round(shipment.costs.totalCost / shipment.cargo.weight * 100) / 100 : 0,
    costPerPiece: shipment.cargo.pieces > 0 ? Math.round(shipment.costs.totalCost / shipment.cargo.pieces * 100) / 100 : 0,
  };
}

/**
 * Compare rates across multiple carriers for same route
 */
function compareCarrierRates(quotes) {
  if (!quotes || quotes.length === 0) return { best: null, comparison: [] };

  const sorted = [...quotes].sort((a, b) => a.totalCost - b.totalCost);
  const best = sorted[0];

  return {
    best: { carrier: best.carrier, totalCost: best.totalCost },
    comparison: sorted.map(q => ({
      carrier: q.carrier,
      totalCost: q.totalCost,
      transitDays: q.transitDays || null,
      savingsVsBest: Math.round((q.totalCost - best.totalCost) * 100) / 100,
      premiumPercent: best.totalCost > 0 ? Math.round((q.totalCost / best.totalCost - 1) * 10000) / 100 : 0,
    })),
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROUTE RISK ASSESSMENT
// ═══════════════════════════════════════════════════════════════════════════════

function assessRouteRisk(shipment) {
  const risks = [];

  if (shipment.route.distanceMiles > 1000) {
    risks.push({ factor: 'long_haul', severity: 'medium', note: `${shipment.route.distanceMiles} miles — multi-day trip` });
  }
  if (shipment.cargo.type === 'hazmat') {
    risks.push({ factor: 'hazmat', severity: 'high', note: 'Hazardous materials — route restrictions apply' });
  }
  if (shipment.cargo.type === 'refrigerated') {
    risks.push({ factor: 'temperature_sensitive', severity: 'medium', note: 'Cold chain — reefer required' });
  }
  if (shipment.cargo.value > 100000) {
    risks.push({ factor: 'high_value', severity: 'high', note: `$${shipment.cargo.value} declared value` });
  }
  if (shipment.cargo.type === 'oversized') {
    risks.push({ factor: 'oversized', severity: 'medium', note: 'Oversized load — permits may be required' });
  }

  const overallRisk = risks.some(r => r.severity === 'high') ? 'high' :
    risks.some(r => r.severity === 'medium') ? 'medium' : 'low';

  return { overallRisk, factors: risks };
}

module.exports = {
  haversineDistance,
  estimateTravelTime,
  optimizeMultiStop,
  costPerMileAnalysis,
  compareCarrierRates,
  assessRouteRisk,
};
