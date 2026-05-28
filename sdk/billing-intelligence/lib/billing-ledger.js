/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║       LIBRARY 4: BILLING-LEDGER — Versioned Invoice Store & Reconciliation ║
 * ║                                                                            ║
 * ║  Stores versioned invoice facts, tracks revisions, and provides            ║
 * ║  reconciliation history for AI retrieval.                                  ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

'use strict';

const crypto = require('crypto');

// ═══════════════════════════════════════════════════════════════════════════════
// LEDGER STORE (In-memory reference implementation — swap with D1/KV in prod)
// ═══════════════════════════════════════════════════════════════════════════════

class BillingLedger {
  constructor(options = {}) {
    this.store = new Map();        // invoiceId → { versions: [], current: {} }
    this.events = [];              // Append-only event log
    this.reconciliations = [];     // Reconciliation records
    this.persistence = options.persistence || null; // Optional D1/KV adapter
  }

  /**
   * Store a new invoice or a new version of an existing invoice.
   */
  commit(invoice, author) {
    const id = invoice.invoiceId;
    const version = this._nextVersion(id);
    const record = {
      version,
      data: JSON.parse(JSON.stringify(invoice)),
      committedAt: new Date().toISOString(),
      committedBy: author || 'system',
      hash: this._hash(invoice),
    };

    if (!this.store.has(id)) {
      this.store.set(id, { versions: [], current: null });
    }

    const entry = this.store.get(id);
    entry.versions.push(record);
    entry.current = record;

    this._emit('commit', { invoiceId: id, version, author });
    return record;
  }

  /**
   * Get the current version of an invoice.
   */
  get(invoiceId) {
    const entry = this.store.get(invoiceId);
    return entry ? entry.current.data : null;
  }

  /**
   * Get a specific version of an invoice.
   */
  getVersion(invoiceId, version) {
    const entry = this.store.get(invoiceId);
    if (!entry) return null;
    const record = entry.versions.find(v => v.version === version);
    return record ? record.data : null;
  }

  /**
   * Get full version history for an invoice.
   */
  history(invoiceId) {
    const entry = this.store.get(invoiceId);
    if (!entry) return [];
    return entry.versions.map(v => ({
      version: v.version,
      committedAt: v.committedAt,
      committedBy: v.committedBy,
      hash: v.hash,
      status: v.data.status,
      totalDue: v.data.totals ? v.data.totals.totalDue : 0,
    }));
  }

  /**
   * Diff two versions of an invoice.
   */
  diff(invoiceId, versionA, versionB) {
    const a = this.getVersion(invoiceId, versionA);
    const b = this.getVersion(invoiceId, versionB);
    if (!a || !b) return null;

    const changes = [];
    this._deepDiff(a, b, '', changes);
    return { from: versionA, to: versionB, changes };
  }

  /**
   * Record a reconciliation check.
   */
  reconcile(invoiceId, expected, actual, notes) {
    const match = Math.abs(expected - actual) < 0.01;
    const record = {
      invoiceId,
      timestamp: new Date().toISOString(),
      expected,
      actual,
      discrepancy: Math.round((actual - expected) * 100) / 100,
      match,
      notes: notes || '',
      status: match ? 'reconciled' : 'discrepancy',
    };
    this.reconciliations.push(record);
    this._emit('reconcile', record);
    return record;
  }

  /**
   * Get all reconciliation records for an invoice.
   */
  getReconciliations(invoiceId) {
    return this.reconciliations.filter(r => r.invoiceId === invoiceId);
  }

  /**
   * Mark an invoice as finalized (no further edits without new version).
   */
  finalize(invoiceId, author) {
    const current = this.get(invoiceId);
    if (!current) throw new Error(`Invoice ${invoiceId} not found`);
    current.status = 'finalized';
    current.audit.modifiedAt = new Date().toISOString();
    current.audit.modifiedBy = author || 'system';
    return this.commit(current, author);
  }

  /**
   * Mark as paid.
   */
  markPaid(invoiceId, paymentRef, author) {
    const current = this.get(invoiceId);
    if (!current) throw new Error(`Invoice ${invoiceId} not found`);
    current.status = 'paid';
    current.terms.paymentRef = paymentRef;
    current.audit.modifiedAt = new Date().toISOString();
    current.audit.modifiedBy = author || 'system';
    return this.commit(current, author);
  }

  /**
   * List all invoices (optionally filtered by status).
   */
  list(filter = {}) {
    const results = [];
    for (const [id, entry] of this.store) {
      const inv = entry.current.data;
      if (filter.status && inv.status !== filter.status) continue;
      if (filter.client && inv.client.code !== filter.client) continue;
      results.push({
        invoiceId: id,
        client: inv.client.name,
        totalDue: inv.totals.totalDue,
        status: inv.status,
        invoiceDate: inv.terms.invoiceDate,
        versions: entry.versions.length,
      });
    }
    return results;
  }

  /**
   * Export full event log for auditing.
   */
  getEventLog() {
    return [...this.events];
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // INTERNAL
  // ═══════════════════════════════════════════════════════════════════════════

  _nextVersion(invoiceId) {
    const entry = this.store.get(invoiceId);
    return entry ? entry.versions.length + 1 : 1;
  }

  _hash(obj) {
    return crypto.createHash('sha256').update(JSON.stringify(obj)).digest('hex').slice(0, 16);
  }

  _emit(event, payload) {
    this.events.push({ event, timestamp: new Date().toISOString(), ...payload });
  }

  _deepDiff(a, b, path, changes) {
    if (typeof a !== typeof b) {
      changes.push({ path, from: a, to: b });
      return;
    }
    if (typeof a !== 'object' || a === null || b === null) {
      if (a !== b) changes.push({ path, from: a, to: b });
      return;
    }
    if (Array.isArray(a) && Array.isArray(b)) {
      if (JSON.stringify(a) !== JSON.stringify(b)) {
        changes.push({ path, from: `[${a.length} items]`, to: `[${b.length} items]` });
      }
      return;
    }
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    for (const key of keys) {
      this._deepDiff(a[key], b[key], path ? `${path}.${key}` : key, changes);
    }
  }
}

module.exports = { BillingLedger };
