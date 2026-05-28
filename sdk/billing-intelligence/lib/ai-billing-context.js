/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║       LIBRARY 5: AI-BILLING-CONTEXT — AI-Ready Record Packager             ║
 * ║                                                                            ║
 * ║  Packages invoice + labor + pricing evidence into AI-ready records for     ║
 * ║  search, forecasting, anomaly detection, and auto-drafting future bills.   ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

'use strict';

// ═══════════════════════════════════════════════════════════════════════════════
// AI RECORD GENERATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Package an invoice into a flat AI-ready record for embedding/indexing.
 */
function toAIRecord(invoice) {
  return {
    id: invoice.invoiceId,
    type: 'invoice',
    client: invoice.client.name,
    clientCode: invoice.client.code,
    project: invoice.project.name,
    servicePeriod: `${invoice.project.servicePeriodStart} to ${invoice.project.servicePeriodEnd}`,
    totalHours: invoice.totals.totalHours,
    totalDue: invoice.totals.totalDue,
    hourlyRate: invoice.rates.hourlyRate,
    currency: invoice.rates.currency,
    status: invoice.status,
    invoiceDate: invoice.terms.invoiceDate,
    dueDate: invoice.terms.dueDate,
    paymentTerms: invoice.terms.paymentTerms,
    confidence: invoice.audit.confidence,
    laborDays: invoice.laborLogs.length,
    tags: generateTags(invoice),
    embedding_text: generateEmbeddingText(invoice),
    metadata: {
      version: invoice.version,
      sourceHash: invoice.audit.sourceHash,
      createdAt: invoice.audit.createdAt,
    },
  };
}

/**
 * Generate semantic tags for categorization and search.
 */
function generateTags(invoice) {
  const tags = [];
  tags.push(`client:${invoice.client.code}`);
  tags.push(`project:${invoice.project.name.toLowerCase().replace(/\s+/g, '-')}`);
  tags.push(`status:${invoice.status}`);
  tags.push(`currency:${invoice.rates.currency}`);

  if (invoice.totals.totalDue > 5000) tags.push('tier:high-value');
  else if (invoice.totals.totalDue > 1000) tags.push('tier:mid-value');
  else tags.push('tier:low-value');

  if (invoice.totals.totalHours > 200) tags.push('scale:large');
  else if (invoice.totals.totalHours > 50) tags.push('scale:medium');
  else tags.push('scale:small');

  if (invoice.laborLogs.some(l => ['Saturday', 'Sunday'].includes(l.dayOfWeek))) {
    tags.push('schedule:weekend-work');
  }

  if (invoice.audit.warnings && invoice.audit.warnings.length > 0) {
    tags.push('flag:has-warnings');
  }

  return tags;
}

/**
 * Generate text optimized for vector embedding and semantic search.
 */
function generateEmbeddingText(invoice) {
  const parts = [];
  parts.push(`Invoice ${invoice.invoiceId} for ${invoice.client.name}.`);
  parts.push(`Project: ${invoice.project.name}. ${invoice.project.description || ''}`);
  parts.push(`Service period: ${invoice.project.servicePeriodStart} to ${invoice.project.servicePeriodEnd}.`);
  parts.push(`Total labor: ${invoice.totals.totalHours} hours across ${invoice.laborLogs.length} days.`);
  parts.push(`Billed at $${invoice.rates.hourlyRate}/hour. Total due: $${invoice.totals.totalDue}.`);
  parts.push(`Payment terms: ${invoice.terms.paymentTerms}. Status: ${invoice.status}.`);

  if (invoice.laborLogs.length > 0) {
    const days = invoice.laborLogs.map(l => `${l.dayOfWeek} ${l.date}: ${l.dayTotalHours}h`);
    parts.push(`Labor breakdown: ${days.join('; ')}.`);
  }

  return parts.join(' ');
}

// ═══════════════════════════════════════════════════════════════════════════════
// FORECASTING CONTEXT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Generate a forecasting context from multiple invoices.
 */
function buildForecastContext(invoices) {
  const context = {
    totalInvoices: invoices.length,
    totalRevenue: 0,
    totalHours: 0,
    averageInvoiceValue: 0,
    averageHoursPerInvoice: 0,
    clientBreakdown: {},
    monthlyTrend: {},
    rateHistory: [],
  };

  for (const inv of invoices) {
    context.totalRevenue += inv.totals.totalDue;
    context.totalHours += inv.totals.totalHours;

    // Client breakdown
    const code = inv.client.code;
    if (!context.clientBreakdown[code]) {
      context.clientBreakdown[code] = { name: inv.client.name, invoices: 0, revenue: 0, hours: 0 };
    }
    context.clientBreakdown[code].invoices++;
    context.clientBreakdown[code].revenue += inv.totals.totalDue;
    context.clientBreakdown[code].hours += inv.totals.totalHours;

    // Monthly trend
    const month = inv.terms.invoiceDate ? inv.terms.invoiceDate.slice(0, 7) : 'unknown';
    if (!context.monthlyTrend[month]) {
      context.monthlyTrend[month] = { revenue: 0, hours: 0, count: 0 };
    }
    context.monthlyTrend[month].revenue += inv.totals.totalDue;
    context.monthlyTrend[month].hours += inv.totals.totalHours;
    context.monthlyTrend[month].count++;

    // Rate history
    context.rateHistory.push({
      date: inv.terms.invoiceDate,
      rate: inv.rates.hourlyRate,
      client: code,
    });
  }

  context.averageInvoiceValue = invoices.length > 0
    ? Math.round((context.totalRevenue / invoices.length) * 100) / 100
    : 0;
  context.averageHoursPerInvoice = invoices.length > 0
    ? Math.round((context.totalHours / invoices.length) * 100) / 100
    : 0;

  return context;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ANOMALY DETECTION CONTEXT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Compare an invoice against historical norms to flag anomalies.
 */
function detectBillingAnomalies(invoice, historicalContext) {
  const anomalies = [];

  // Rate deviation
  if (historicalContext.rateHistory && historicalContext.rateHistory.length > 0) {
    const avgRate = historicalContext.rateHistory.reduce((s, r) => s + r.rate, 0) / historicalContext.rateHistory.length;
    const deviation = Math.abs(invoice.rates.hourlyRate - avgRate) / avgRate;
    if (deviation > 0.2) {
      anomalies.push({
        type: 'rate_deviation',
        severity: deviation > 0.5 ? 'high' : 'medium',
        message: `Rate $${invoice.rates.hourlyRate}/hr deviates ${(deviation * 100).toFixed(1)}% from average $${avgRate.toFixed(2)}/hr`,
        current: invoice.rates.hourlyRate,
        historical: Math.round(avgRate * 100) / 100,
      });
    }
  }

  // Value deviation
  if (historicalContext.averageInvoiceValue > 0) {
    const valDev = Math.abs(invoice.totals.totalDue - historicalContext.averageInvoiceValue) / historicalContext.averageInvoiceValue;
    if (valDev > 0.5) {
      anomalies.push({
        type: 'value_deviation',
        severity: valDev > 1.0 ? 'high' : 'medium',
        message: `Invoice value $${invoice.totals.totalDue} deviates ${(valDev * 100).toFixed(1)}% from average $${historicalContext.averageInvoiceValue}`,
        current: invoice.totals.totalDue,
        historical: historicalContext.averageInvoiceValue,
      });
    }
  }

  return anomalies;
}

// ═══════════════════════════════════════════════════════════════════════════════
// AUTO-DRAFT CONTEXT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Generate context for AI to auto-draft a new invoice based on patterns.
 */
function autoDraftContext(clientCode, historicalContext) {
  const clientData = historicalContext.clientBreakdown[clientCode];
  if (!clientData) return null;

  const clientRates = historicalContext.rateHistory.filter(r => r.client === clientCode);
  const latestRate = clientRates.length > 0
    ? clientRates.sort((a, b) => (b.date || '').localeCompare(a.date || ''))[0].rate
    : null;

  return {
    clientCode,
    clientName: clientData.name,
    suggestedRate: latestRate,
    averageHoursPerInvoice: clientData.invoices > 0
      ? Math.round((clientData.hours / clientData.invoices) * 100) / 100
      : 0,
    averageValue: clientData.invoices > 0
      ? Math.round((clientData.revenue / clientData.invoices) * 100) / 100
      : 0,
    totalInvoicesHistorical: clientData.invoices,
    recommendation: `Based on ${clientData.invoices} prior invoices averaging $${(clientData.revenue / clientData.invoices).toFixed(2)} and ${(clientData.hours / clientData.invoices).toFixed(1)} hours.`,
  };
}

module.exports = {
  toAIRecord,
  generateTags,
  generateEmbeddingText,
  buildForecastContext,
  detectBillingAnomalies,
  autoDraftContext,
};
