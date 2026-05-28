/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║       LIBRARY 2: LABOR-INTEL — Shift & Crew Intelligence Extractor         ║
 * ║                                                                            ║
 * ║  Extracts shifts, crew counts, hours, and day-level totals from            ║
 * ║  operational notes and structured labor data.                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { createLaborEntry, createLaborLog } = require('./schema');
const { normalizeDate, normalizeTime } = require('./ingest-normalize');

// ═══════════════════════════════════════════════════════════════════════════════
// LABOR TEXT PARSING
// ═══════════════════════════════════════════════════════════════════════════════

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const MONTH_MAP = {
  jan: 0, january: 0, feb: 1, february: 1, mar: 2, march: 2,
  apr: 3, april: 3, may: 4, jun: 5, june: 5, jul: 6, july: 6,
  aug: 7, august: 7, sep: 8, september: 8, oct: 9, october: 9,
  nov: 10, november: 10, dec: 11, december: 11,
};

/**
 * Parse a labor summary bullet into structured LaborEntry objects.
 * Handles formats like:
 *   "Saturday, May 23: 10 crew, 7:00 AM - 6:30 PM, totaling 109.25 labor hours."
 *   "Diego from 8:00 AM - 7:00 PM totaling 10.50 labor hours"
 */
function parseLaborBullet(text, year) {
  year = year || new Date().getFullYear();
  const result = { date: '', dayOfWeek: '', entries: [] };

  // Safety: reject excessively long input to prevent regex backtracking
  if (!text || text.length > 2000) return result;

  // Extract day and date: "Saturday, May 23" or "Tuesday, May 26"
  const dayDateMatch = text.match(/(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),? +([A-Za-z]+) +(\d{1,2})/i);
  if (dayDateMatch) {
    result.dayOfWeek = dayDateMatch[1];
    const month = MONTH_MAP[dayDateMatch[2].toLowerCase()];
    const day = parseInt(dayDateMatch[3]);
    if (month !== undefined) {
      const d = new Date(year, month, day);
      result.date = d.toISOString().split('T')[0];
    }
  }

  // Split by semicolons for multi-segment entries (like Wednesday with multiple groups)
  const segments = text.includes(';') ? text.split(';') : [text];

  for (const segment of segments) {
    // Skip segments that are too long for safe regex processing
    if (segment.length > 500) continue;
    // Pattern: "N crew, TIME - TIME, totaling X.XX labor hours"
    const crewMatch = segment.match(/(\d+) {0,3}crew[^,]{0,20},? {0,3}(\d{1,2}:\d{2} ?(?:AM|PM)?) {0,3}[-–] {0,3}(\d{1,2}:\d{2} ?(?:AM|PM)?)[^tT]{0,30}totaling {1,3}(\d+(?:\.\d+)?) {1,3}labor {1,3}hours/i);
    if (crewMatch) {
      result.entries.push(createLaborEntry(
        'crew',
        parseInt(crewMatch[1]),
        normalizeTime(crewMatch[2]),
        normalizeTime(crewMatch[3]),
        parseFloat(crewMatch[4]),
      ));
      continue;
    }

    // Pattern: "Name from TIME - TIME totaling X.XX labor hours"
    const namedMatch = segment.match(/([A-Z][a-z]*) +from +(\d{1,2}:\d{2} ?(?:AM|PM)?) {0,3}[-–] {0,3}(\d{1,2}:\d{2} ?(?:AM|PM)?)[^tT]{0,30}totaling {1,3}(\d+(?:\.\d+)?) {1,3}labor {1,3}hours/i);
    if (namedMatch) {
      result.entries.push(createLaborEntry(
        namedMatch[1],
        1,
        normalizeTime(namedMatch[2]),
        normalizeTime(namedMatch[3]),
        parseFloat(namedMatch[4]),
      ));
      continue;
    }

    // Pattern: "N crew from TIME - TIME totaling X.XX labor hours"
    const crewFromMatch = segment.match(/(\d+) {0,3}crew +from +(\d{1,2}:\d{2} ?(?:AM|PM)?) {0,3}[-–] {0,3}(\d{1,2}:\d{2} ?(?:AM|PM)?)[^tT]{0,30}totaling {1,3}(\d+(?:\.\d+)?) {1,3}labor {1,3}hours/i);
    if (crewFromMatch) {
      result.entries.push(createLaborEntry(
        'crew',
        parseInt(crewFromMatch[1]),
        normalizeTime(crewFromMatch[2]),
        normalizeTime(crewFromMatch[3]),
        parseFloat(crewFromMatch[4]),
      ));
    }
  }

  return result;
}

/**
 * Parse an array of labor bullet strings into full LaborLog objects.
 */
function parseLaborSummary(bullets, year) {
  const logs = [];
  const totalsInfo = { totalHours: 0, billRate: 0 };

  for (const bullet of bullets) {
    // Check if this is a totals line
    const totalMatch = bullet.match(/^[•\-\s]*Total[^:]{0,30}labor hours?[^:]{0,15}:? *([\d.]+)/i);
    if (totalMatch) {
      totalsInfo.totalHours = parseFloat(totalMatch[1]);
      continue;
    }

    // Check if this is a rate line
    const rateMatch = bullet.match(/^[•\-\s]*Bill {0,3}rate {0,3}:? {0,3}\$ {0,3}([\d.]+)/i);
    if (rateMatch) {
      totalsInfo.billRate = parseFloat(rateMatch[1]);
      continue;
    }

    // Try to parse as a labor day
    const parsed = parseLaborBullet(bullet, year);
    if (parsed.entries.length > 0) {
      const dayTotalHours = parsed.entries.reduce((sum, e) => sum + e.hours, 0);
      logs.push(createLaborLog(parsed.date, parsed.dayOfWeek, parsed.entries));
    }
  }

  return { logs, totalsInfo };
}

// ═══════════════════════════════════════════════════════════════════════════════
// LABOR ANALYTICS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Compute labor statistics from parsed logs.
 */
function computeLaborStats(laborLogs) {
  const stats = {
    totalDays: laborLogs.length,
    totalHours: 0,
    totalCrewDays: 0,
    averageHoursPerDay: 0,
    averageCrewSize: 0,
    peakDay: null,
    entries: [],
    byDay: [],
  };

  for (const log of laborLogs) {
    const dayHours = log.dayTotalHours;
    const dayCrew = log.entries.reduce((sum, e) => sum + e.count, 0);

    stats.totalHours += dayHours;
    stats.totalCrewDays += dayCrew;
    stats.byDay.push({
      date: log.date,
      dayOfWeek: log.dayOfWeek,
      hours: dayHours,
      crewCount: dayCrew,
      entries: log.entries.length,
    });

    if (!stats.peakDay || dayHours > stats.peakDay.hours) {
      stats.peakDay = { date: log.date, hours: dayHours, crewCount: dayCrew };
    }
  }

  stats.averageHoursPerDay = stats.totalDays > 0 ? Math.round((stats.totalHours / stats.totalDays) * 100) / 100 : 0;
  stats.averageCrewSize = stats.totalDays > 0 ? Math.round((stats.totalCrewDays / stats.totalDays) * 100) / 100 : 0;

  return stats;
}

/**
 * Verify that reported hours match computed hours.
 */
function verifyHours(laborLogs, reportedTotal) {
  const computed = laborLogs.reduce((sum, log) => sum + log.dayTotalHours, 0);
  const match = Math.abs(computed - reportedTotal) < 0.01;
  return {
    match,
    computed: Math.round(computed * 100) / 100,
    reported: reportedTotal,
    discrepancy: Math.round((computed - reportedTotal) * 100) / 100,
  };
}

/**
 * Detect anomalies in labor data (excessive hours, impossible shifts, etc.)
 */
function detectAnomalies(laborLogs) {
  const anomalies = [];

  for (const log of laborLogs) {
    for (const entry of log.entries) {
      // Individual shift > 16 hours
      if (entry.hours > 16) {
        anomalies.push({
          severity: 'high',
          type: 'excessive_shift',
          date: log.date,
          worker: entry.worker,
          hours: entry.hours,
          message: `Shift of ${entry.hours} hours exceeds 16-hour safety threshold`,
        });
      }
      // Hours don't match time window
      if (entry.startTime && entry.endTime) {
        const [sh, sm] = entry.startTime.split(':').map(Number);
        const [eh, em] = entry.endTime.split(':').map(Number);
        const windowHours = (eh * 60 + em - sh * 60 - sm) / 60;
        const expectedHours = windowHours * entry.count;
        if (Math.abs(expectedHours - entry.hours) > 0.5) {
          anomalies.push({
            severity: 'medium',
            type: 'hours_mismatch',
            date: log.date,
            worker: entry.worker,
            expected: Math.round(expectedHours * 100) / 100,
            reported: entry.hours,
            message: `Reported ${entry.hours}h vs computed ${Math.round(expectedHours * 100) / 100}h for ${entry.count} workers`,
          });
        }
      }
    }

    // Day total > 200 hours (unrealistic for a single day)
    if (log.dayTotalHours > 200) {
      anomalies.push({
        severity: 'high',
        type: 'excessive_day_total',
        date: log.date,
        hours: log.dayTotalHours,
        message: `Day total of ${log.dayTotalHours} hours is unrealistically high`,
      });
    }
  }

  return anomalies;
}

module.exports = {
  parseLaborBullet,
  parseLaborSummary,
  computeLaborStats,
  verifyHours,
  detectAnomalies,
  DAY_NAMES,
  MONTH_MAP,
};
