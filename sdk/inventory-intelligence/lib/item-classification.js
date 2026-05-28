/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║       LIBRARY 2: ITEM CLASSIFICATION — Categorize & Tag Inventory          ║
 * ║                                                                            ║
 * ║  Classifies items by ABC analysis, velocity, perishability, hazard level,  ║
 * ║  and custom taxonomy. Powers AI-driven stock decisions.                    ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

'use strict';

// ═══════════════════════════════════════════════════════════════════════════════
// ABC ANALYSIS (Pareto Classification)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Classify items by revenue/value contribution (A = top 80%, B = next 15%, C = bottom 5%)
 */
function abcClassification(items, valueExtractor) {
  const getValue = valueExtractor || ((item) => (item.unitCost || 0) * (item.quantity || item.onHand || 1));

  const sorted = [...items].map(item => ({
    item,
    value: getValue(item),
  })).sort((a, b) => b.value - a.value);

  const totalValue = sorted.reduce((sum, s) => sum + s.value, 0);
  let cumulative = 0;

  return sorted.map(({ item, value }) => {
    cumulative += value;
    const pct = totalValue > 0 ? cumulative / totalValue : 0;
    let classification;
    if (pct <= 0.80) classification = 'A';
    else if (pct <= 0.95) classification = 'B';
    else classification = 'C';
    return { ...item, abcClass: classification, valueContribution: value, cumulativePercent: Math.round(pct * 100) / 100 };
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// VELOCITY CLASSIFICATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Classify by movement frequency: fast-moving, moderate, slow, dead-stock
 */
function velocityClassification(items, movements, periodDays = 90) {
  const movementCounts = {};
  const cutoff = Date.now() - (periodDays * 24 * 60 * 60 * 1000);

  for (const mov of movements) {
    if (new Date(mov.timestamp).getTime() >= cutoff) {
      movementCounts[mov.sku] = (movementCounts[mov.sku] || 0) + Math.abs(mov.quantity);
    }
  }

  return items.map(item => {
    const totalMoved = movementCounts[item.sku] || 0;
    const dailyRate = totalMoved / periodDays;
    let velocity;
    if (dailyRate >= 10) velocity = 'fast';
    else if (dailyRate >= 2) velocity = 'moderate';
    else if (dailyRate > 0) velocity = 'slow';
    else velocity = 'dead-stock';
    return { ...item, velocity, dailyMovementRate: Math.round(dailyRate * 100) / 100, periodMovements: totalMoved };
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// PERISHABILITY & HAZARD CLASSIFICATION
// ═══════════════════════════════════════════════════════════════════════════════

function perishabilityClassification(items) {
  const now = new Date();
  return items.map(item => {
    if (!item.expiryDate) return { ...item, perishClass: 'non-perishable', daysUntilExpiry: null };
    const expiry = new Date(item.expiryDate);
    const daysLeft = Math.ceil((expiry - now) / (24 * 60 * 60 * 1000));
    let perishClass;
    if (daysLeft <= 0) perishClass = 'expired';
    else if (daysLeft <= 7) perishClass = 'critical';
    else if (daysLeft <= 30) perishClass = 'expiring-soon';
    else perishClass = 'fresh';
    return { ...item, perishClass, daysUntilExpiry: daysLeft };
  });
}

const HAZARD_KEYWORDS = {
  flammable: ['flammable', 'combustible', 'fuel', 'solvent', 'alcohol'],
  corrosive: ['acid', 'corrosive', 'alkaline', 'caustic'],
  toxic: ['toxic', 'poison', 'pesticide', 'chemical'],
  explosive: ['explosive', 'propellant', 'detonator'],
  radioactive: ['radioactive', 'nuclear', 'isotope'],
};

function hazardClassification(items) {
  return items.map(item => {
    const searchText = `${item.name} ${item.category} ${(item.tags || []).join(' ')}`.toLowerCase();
    const hazards = [];
    for (const [hazardType, keywords] of Object.entries(HAZARD_KEYWORDS)) {
      if (keywords.some(kw => searchText.includes(kw))) {
        hazards.push(hazardType);
      }
    }
    return { ...item, hazardClass: hazards.length > 0 ? hazards : ['none'], isHazardous: hazards.length > 0 };
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// CUSTOM TAXONOMY
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Apply custom taxonomy rules based on item attributes
 */
function applyTaxonomy(items, rules) {
  return items.map(item => {
    const appliedTags = new Set(item.tags || []);
    for (const rule of rules) {
      if (rule.condition(item)) {
        for (const tag of rule.tags) {
          appliedTags.add(tag);
        }
        if (rule.category) item.category = rule.category;
      }
    }
    return { ...item, tags: [...appliedTags] };
  });
}

/**
 * Generate classification summary for AI consumption
 */
function classificationSummary(classifiedItems) {
  const summary = {
    total: classifiedItems.length,
    byABC: { A: 0, B: 0, C: 0 },
    byVelocity: { fast: 0, moderate: 0, slow: 0, 'dead-stock': 0 },
    byPerish: { expired: 0, critical: 0, 'expiring-soon': 0, fresh: 0, 'non-perishable': 0 },
    hazardous: 0,
    categories: {},
  };

  for (const item of classifiedItems) {
    if (item.abcClass) summary.byABC[item.abcClass]++;
    if (item.velocity) summary.byVelocity[item.velocity]++;
    if (item.perishClass) summary.byPerish[item.perishClass]++;
    if (item.isHazardous) summary.hazardous++;
    const cat = item.category || 'uncategorized';
    summary.categories[cat] = (summary.categories[cat] || 0) + 1;
  }

  return summary;
}

module.exports = {
  abcClassification,
  velocityClassification,
  perishabilityClassification,
  hazardClassification,
  applyTaxonomy,
  classificationSummary,
};
