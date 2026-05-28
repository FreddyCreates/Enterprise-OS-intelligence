/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║       LIBRARY 4: DEMAND FORECAST — Predictive Inventory Intelligence       ║
 * ║                                                                            ║
 * ║  Computes demand patterns, seasonal trends, and provides forecasting       ║
 * ║  context that AI models can use for inventory optimization decisions.      ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

'use strict';

// ═══════════════════════════════════════════════════════════════════════════════
// DEMAND PATTERN EXTRACTION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Compute daily demand from outbound movements
 */
function computeDailyDemand(movements, sku, periodDays = 90) {
  const cutoff = Date.now() - (periodDays * 24 * 60 * 60 * 1000);
  const outbound = movements.filter(m =>
    m.sku === sku &&
    m.type === 'outbound' &&
    new Date(m.timestamp).getTime() >= cutoff
  );

  // Group by day
  const byDay = {};
  for (const mov of outbound) {
    const day = new Date(mov.timestamp).toISOString().split('T')[0];
    byDay[day] = (byDay[day] || 0) + mov.quantity;
  }

  const days = Object.keys(byDay).sort();
  const values = days.map(d => byDay[d]);

  return {
    sku,
    periodDays,
    activeDays: days.length,
    dailyDemand: byDay,
    avgDaily: values.length > 0 ? Math.round(values.reduce((s, v) => s + v, 0) / periodDays * 100) / 100 : 0,
    peakDaily: values.length > 0 ? Math.max(...values) : 0,
    minDaily: values.length > 0 ? Math.min(...values) : 0,
    stdDev: computeStdDev(values),
  };
}

/**
 * Compute weekly demand trends
 */
function computeWeeklyTrend(movements, sku, weeks = 12) {
  const periodDays = weeks * 7;
  const cutoff = Date.now() - (periodDays * 24 * 60 * 60 * 1000);
  const outbound = movements.filter(m =>
    m.sku === sku &&
    m.type === 'outbound' &&
    new Date(m.timestamp).getTime() >= cutoff
  );

  // Group by ISO week
  const byWeek = {};
  for (const mov of outbound) {
    const date = new Date(mov.timestamp);
    const weekNum = getISOWeek(date);
    const key = `${date.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
    byWeek[key] = (byWeek[key] || 0) + mov.quantity;
  }

  const weekKeys = Object.keys(byWeek).sort();
  const weeklyValues = weekKeys.map(k => byWeek[k]);

  // Compute trend direction
  let trend = 'stable';
  if (weeklyValues.length >= 4) {
    const firstHalf = weeklyValues.slice(0, Math.floor(weeklyValues.length / 2));
    const secondHalf = weeklyValues.slice(Math.floor(weeklyValues.length / 2));
    const firstAvg = firstHalf.reduce((s, v) => s + v, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((s, v) => s + v, 0) / secondHalf.length;
    const change = firstAvg > 0 ? (secondAvg - firstAvg) / firstAvg : 0;
    if (change > 0.15) trend = 'increasing';
    else if (change < -0.15) trend = 'decreasing';
  }

  return {
    sku,
    weeks,
    weeklyDemand: byWeek,
    avgWeekly: weeklyValues.length > 0 ? Math.round(weeklyValues.reduce((s, v) => s + v, 0) / weeklyValues.length) : 0,
    trend,
    weeklyValues,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// SEASONALITY DETECTION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Detect day-of-week patterns
 */
function detectDayOfWeekPattern(movements, sku) {
  const outbound = movements.filter(m => m.sku === sku && m.type === 'outbound');
  const byDay = [0, 0, 0, 0, 0, 0, 0]; // Sun-Sat
  const dayCounts = [0, 0, 0, 0, 0, 0, 0];
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  for (const mov of outbound) {
    const day = new Date(mov.timestamp).getDay();
    byDay[day] += mov.quantity;
    dayCounts[day]++;
  }

  const avgByDay = byDay.map((total, i) => dayCounts[i] > 0 ? Math.round(total / dayCounts[i]) : 0);
  const peakDay = avgByDay.indexOf(Math.max(...avgByDay));
  const lowDay = avgByDay.indexOf(Math.min(...avgByDay));

  return {
    sku,
    avgDemandByDay: dayNames.reduce((obj, name, i) => ({ ...obj, [name]: avgByDay[i] }), {}),
    peakDay: dayNames[peakDay],
    lowDay: dayNames[lowDay],
    weekdayVsWeekend: {
      weekday: Math.round(avgByDay.slice(1, 6).reduce((s, v) => s + v, 0) / 5),
      weekend: Math.round((avgByDay[0] + avgByDay[6]) / 2),
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// SIMPLE FORECAST (Moving Average + Trend)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Generate a simple N-day forecast using weighted moving average
 */
function simpleForecast(movements, sku, forecastDays = 14) {
  const demand = computeDailyDemand(movements, sku, 90);
  const weekly = computeWeeklyTrend(movements, sku, 12);

  // Weighted moving average (recent data weighted more)
  const values = weekly.weeklyValues;
  if (values.length === 0) {
    return { sku, forecastDays, dailyForecast: 0, totalForecast: 0, confidence: 0, method: 'no-data' };
  }

  // Exponential smoothing
  const alpha = 0.3;
  let smoothed = values[0];
  for (let i = 1; i < values.length; i++) {
    smoothed = alpha * values[i] + (1 - alpha) * smoothed;
  }

  const dailyForecast = Math.round(smoothed / 7 * 100) / 100;
  const totalForecast = Math.round(dailyForecast * forecastDays);

  // Confidence based on data consistency
  const cv = demand.stdDev / (demand.avgDaily || 1); // Coefficient of variation
  const confidence = Math.max(0, Math.min(1, 1 - cv));

  return {
    sku,
    forecastDays,
    dailyForecast,
    totalForecast,
    confidence: Math.round(confidence * 100) / 100,
    trend: weekly.trend,
    method: 'exponential-smoothing',
    basedOn: { periodDays: 90, dataPoints: values.length },
  };
}

/**
 * Compute optimal reorder point from demand data
 */
function computeOptimalReorder(movements, sku, leadTimeDays, serviceLevel = 0.95) {
  const demand = computeDailyDemand(movements, sku, 90);
  const zScore = serviceLevel >= 0.99 ? 2.33 : serviceLevel >= 0.95 ? 1.65 : serviceLevel >= 0.90 ? 1.28 : 1.0;

  const avgDailyDemand = demand.avgDaily;
  const safetyStock = Math.ceil(zScore * demand.stdDev * Math.sqrt(leadTimeDays));
  const reorderPoint = Math.ceil(avgDailyDemand * leadTimeDays + safetyStock);
  const economicOrderQty = Math.ceil(avgDailyDemand * leadTimeDays * 2); // Simplified EOQ

  return {
    sku,
    avgDailyDemand,
    leadTimeDays,
    serviceLevel,
    safetyStock,
    reorderPoint,
    suggestedOrderQuantity: economicOrderQty,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

function computeStdDev(values) {
  if (values.length === 0) return 0;
  const avg = values.reduce((s, v) => s + v, 0) / values.length;
  const variance = values.reduce((s, v) => s + Math.pow(v - avg, 2), 0) / values.length;
  return Math.round(Math.sqrt(variance) * 100) / 100;
}

function getISOWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

module.exports = {
  computeDailyDemand,
  computeWeeklyTrend,
  detectDayOfWeekPattern,
  simpleForecast,
  computeOptimalReorder,
  computeStdDev,
};
