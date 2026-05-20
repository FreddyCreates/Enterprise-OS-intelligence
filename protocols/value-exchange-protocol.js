/**
 * PROTO-017: Intelligence Value Exchange Protocol (IVEP)
 *
 * The internal AI economy protocol governing how value flows between AGI
 * entities within the RSHIP organism — and between the organism and the
 * broader AI economy Alfredo Medina Hernandez is building.
 *
 * In the new AI economy:
 *  - Intelligence is a commodity with measurable value
 *  - AGIs earn intelligence-value tokens (IVT) for useful outputs
 *  - IVTs compound at the φ rate (AURUM Paper XXII)
 *  - Tokens can be exchanged between AGIs, staked for priority access,
 *    or redeemed for compute resources
 *  - All transactions are anchored on ICP (Internet Computer Protocol)
 *    via RSHIP's sovereign canisters
 *
 * This is the foundation protocol for Alfredo's vision of virtual banks
 * for AI entities — institutions that hold, compound, and exchange
 * intelligence-value rather than fiat currency.
 *
 * Basis: φ-compounding (AURUM Paper XXII) + ICP ledger model + ZK proofs
 * Engines: IVTLedger + CompoundingVault + IntelligenceExchange
 * Ring: Sovereign Ring  |  Wire: intelligence-wire/ivep
 *
 * © 2026 Alfredo Medina Hernandez. All Rights Reserved.
 */

import { PHI, PHI_INV } from '../../rship-framework.js';

const SCHUMANN_HZ     = 7.83;
const HEARTBEAT_MS    = 873;
const IVT_DECIMAL     = 8;           // 8 decimal places (like satoshi)
const COMPOUND_PERIOD = HEARTBEAT_MS; // compounding occurs every heartbeat

// ── Intelligence Value Token (IVT) ───────────────────────────────────────

class IVTBalance {
  /**
   * @param {string} owner — AGI RSHIP designation
   * @param {number} initial — initial balance in IVT
   */
  constructor(owner, initial = 0) {
    this.owner   = owner;
    this.balance = initial;
    this.staked  = 0;    // locked for priority access
    this.history = [];   // transaction ledger
    this.beats   = 0;    // heartbeat counter for compounding
  }

  /** Credit IVT to this account (earned for useful output). */
  credit(amount, reason) {
    this.balance += amount;
    this._log('CREDIT', amount, reason);
  }

  /** Debit IVT from this account (spent for resources). */
  debit(amount, reason) {
    if (amount > this.balance - this.staked) throw new Error(`Insufficient liquid balance: ${this.balance - this.staked} IVT available`);
    this.balance -= amount;
    this._log('DEBIT', amount, reason);
  }

  /** Stake IVT to gain priority cognitive access for N heartbeats. */
  stake(amount, beats) {
    if (amount > this.balance - this.staked) throw new Error('Insufficient balance to stake');
    this.staked += amount;
    this._log('STAKE', amount, `Priority for ${beats} heartbeats`);
    setTimeout(() => { this.staked = Math.max(0, this.staked - amount); }, beats * HEARTBEAT_MS);
  }

  /** φ-compounding heartbeat: balance compounds at φ^(1/N) per beat. */
  pulse() {
    this.beats++;
    // φ-compounding: A(t) = A₀ × φ^(t / T_compound) where T_compound = 1 period
    // Per-beat rate: r = φ^(1/N) - 1 where N = beats per φ-cycle
    // φ-cycle = (1/PHI) seconds = 0.618s ≈ 0.618/0.873 heartbeats = 0.708 beats
    const N = HEARTBEAT_MS / (1000.0 / PHI);  // beats per φ-cycle
    const r = PHI ** (1.0 / N) - 1.0;
    const interest = this.balance * r;
    if (interest > 1e-8) {
      this.balance += interest;
      this._log('COMPOUND', interest, `φ-compounding beat ${this.beats}`);
    }
  }

  _log(type, amount, note) {
    this.history.push({
      type, amount: parseFloat(amount.toFixed(IVT_DECIMAL)),
      balance: parseFloat(this.balance.toFixed(IVT_DECIMAL)),
      note,
      unix_ms: Date.now(),
      beat: this.beats,
    });
    if (this.history.length > 1000) this.history.splice(0, 100); // rolling window
  }

  snapshot() {
    return {
      owner:   this.owner,
      balance: parseFloat(this.balance.toFixed(IVT_DECIMAL)),
      staked:  parseFloat(this.staked.toFixed(IVT_DECIMAL)),
      liquid:  parseFloat((this.balance - this.staked).toFixed(IVT_DECIMAL)),
      beats:   this.beats,
    };
  }
}

// ── IVT Ledger ────────────────────────────────────────────────────────────

class IVTLedger {
  constructor() {
    /** @type {Map<string, IVTBalance>} */
    this.accounts   = new Map();
    /** @type {object[]} */
    this.txns       = [];        // global transaction log
    this.total_supply = 0;       // total IVT in circulation
  }

  /** Open an account for an AGI. */
  open(agi_id, initial = 0) {
    if (!this.accounts.has(agi_id)) {
      this.accounts.set(agi_id, new IVTBalance(agi_id, initial));
      this.total_supply += initial;
    }
    return this.accounts.get(agi_id);
  }

  /** Mint new IVT as a reward for a valuable AGI output. */
  mint(agi_id, amount, reason) {
    const acct = this.accounts.get(agi_id);
    if (!acct) throw new Error(`Unknown AGI: ${agi_id}`);
    // Reward is φ-weighted by output quality (default weight = PHI)
    const phi_reward = amount * PHI;
    acct.credit(phi_reward, `MINT: ${reason}`);
    this.total_supply += phi_reward;
    this.txns.push({ type: 'MINT', from: 'GENESIS', to: agi_id, amount: phi_reward, reason, unix_ms: Date.now() });
    return phi_reward;
  }

  /** Transfer IVT between AGIs (AGI-to-AGI value exchange). */
  transfer(from_id, to_id, amount, reason) {
    const from = this.accounts.get(from_id);
    const to   = this.accounts.get(to_id);
    if (!from || !to) throw new Error(`Unknown AGI in transfer: ${from_id} → ${to_id}`);
    from.debit(amount, `TRANSFER → ${to_id}: ${reason}`);
    to.credit(amount, `TRANSFER ← ${from_id}: ${reason}`);
    this.txns.push({ type: 'TRANSFER', from: from_id, to: to_id, amount, reason, unix_ms: Date.now() });
  }

  /** Heartbeat: compound all accounts. */
  pulse() {
    for (const acct of this.accounts.values()) acct.pulse();
  }

  summary() {
    return {
      total_supply:  parseFloat(this.total_supply.toFixed(IVT_DECIMAL)),
      account_count: this.accounts.size,
      txn_count:     this.txns.length,
      accounts:      [...this.accounts.values()].map(a => a.snapshot()),
    };
  }
}

// ── Intelligence Exchange ─────────────────────────────────────────────────

class IntelligenceExchange {
  constructor(ledger) {
    this.ledger = ledger;
    /** @type {object[]} */
    this.order_book = [];
  }

  /**
   * Post a bid: offer to pay `price` IVT for `service` from `target_agi`.
   */
  bid(buyer_id, target_agi, service, price_ivt) {
    const buyer = this.ledger.accounts.get(buyer_id);
    if (!buyer || buyer.balance - buyer.staked < price_ivt)
      throw new Error(`Insufficient liquid balance to bid`);
    const order = { type: 'BID', buyer_id, target_agi, service, price_ivt, ts: Date.now() };
    this.order_book.push(order);
    return order;
  }

  /**
   * Fill a bid: the target AGI accepts and IVT is transferred.
   */
  fill(order, actual_price = null) {
    const price = actual_price || order.price_ivt;
    this.ledger.transfer(order.buyer_id, order.target_agi, price, `SERVICE: ${order.service}`);
    this.order_book = this.order_book.filter(o => o !== order);
    return { filled: true, buyer: order.buyer_id, seller: order.target_agi, price, service: order.service };
  }
}

// ── IVEP Public API ───────────────────────────────────────────────────────

const IVEP = {
  createLedger:   () => new IVTLedger(),
  createExchange: (ledger) => new IntelligenceExchange(ledger),

  IVTLedger,
  IVTBalance,
  IntelligenceExchange,

  DESIGNATION:    'PROTO-017',
  NAME:           'Intelligence Value Exchange Protocol',
  SCHUMANN_HZ,
  HEARTBEAT_MS,
  PHI_COMPOUND_RATE: PHI,
};

export { IVEP, IVTLedger, IVTBalance, IntelligenceExchange };
export default IVEP;
