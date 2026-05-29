/**
 * PaperVenue — the deterministic, in-process matching engine.
 *
 * Per TESTING_DOCTRINE § 1 (Layer 2): the foundation of the test pyramid.
 * Same inputs produce the same fills. No external network. No third-party
 * dependencies. Runs in CI on every PR.
 *
 * Behaviour:
 *   - Holds an in-memory order book per asset, seeded externally.
 *   - Holds positions per (asset).
 *   - Holds balances per (currency).
 *   - placeOrder walks the book according to OrderType + TimeInForce and
 *     returns a deterministic OrderAck with the resulting Fills.
 *   - cancelOrder removes any unfilled remainder.
 *   - health() always returns healthy.
 *
 * This venue is not a market simulator. It is a fills simulator with a
 * controlled book. Adversarial market scenarios are produced by injecting
 * crafted books — the test does the choreography.
 */

import type {
  AssetId,
  VenueId,
  Iso8601,
  DecimalUsd,
} from '../types/common.js';
import { nowIso } from '../types/common.js';
import type {
  Quote,
  OrderBook,
  OrderBookLevel,
  OrderRequest,
  Fill,
  Side,
} from '../types/market.js';
import type {
  Venue,
  VenueCapabilities,
  Position,
  Balance,
  OrderAck,
  VenueHealth,
} from './types.js';

export interface PaperVenueConfig {
  readonly id?:           VenueId;
  readonly initialBalances?: ReadonlyArray<Omit<Balance, 'venue'>>;
  readonly feeBps?:       number;       // basis points charged on fills; default 0
}

const DEFAULT_CAPABILITIES: VenueCapabilities = {
  canTrade:       true,
  canShort:       false,
  canMargin:      false,
  canModify:      true,
  supportedTypes: ['market', 'limit', 'reduce-only'],
  supportedTifs:  ['gtc', 'ioc', 'fok', 'day'],
  minOrderUsd:    '1' as DecimalUsd,
  maxOrderUsd:    null,
};

interface OpenOrder {
  readonly request:       OrderRequest;
  readonly venueOrderId:  string;
  remainingQty:           number;       // mutable
  readonly placedAt:      Iso8601;
}

export class PaperVenue implements Venue {
  readonly id: VenueId;
  readonly capabilities: VenueCapabilities = DEFAULT_CAPABILITIES;

  private readonly books: Map<AssetId, OrderBook> = new Map();
  private positions: Map<AssetId, { qty: number; avgPrice: number; openedAt: Iso8601 }> = new Map();
  private balances:  Map<string,   { free: number; locked: number }>                    = new Map();
  private openOrders: Map<string, OpenOrder> = new Map();
  private orderCounter = 0;
  private readonly feeBps: number;

  constructor(cfg: PaperVenueConfig = {}) {
    this.id     = (cfg.id ?? 'paper') as VenueId;
    this.feeBps = cfg.feeBps ?? 0;
    for (const b of cfg.initialBalances ?? []) {
      this.balances.set(b.currency, {
        free:   Number(b.free),
        locked: Number(b.locked),
      });
    }
  }

  // ── Test helpers (not part of the Venue contract) ────────────────────────

  /** Seed or replace the order book for an asset. */
  setOrderBook(asset: AssetId, book: OrderBook): void {
    this.books.set(asset, book);
  }

  /** Force a balance — useful for test setup. */
  setBalance(currency: string, free: number, locked = 0): void {
    this.balances.set(currency, { free, locked });
  }

  // ── Read ──────────────────────────────────────────────────────────────────

  async getQuote(asset: AssetId): Promise<Quote> {
    const book = this.requireBook(asset);
    const bestBid = book.bids[0];
    const bestAsk = book.asks[0];
    if (!bestBid || !bestAsk) {
      throw new Error(`paper: empty book for ${asset}`);
    }
    return {
      venue:     this.id,
      asset,
      bid:       bestBid.price,
      ask:       bestAsk.price,
      bidSize:   bestBid.size,
      askSize:   bestAsk.size,
      observedAt: nowIso(),
    };
  }

  async getOrderBook(asset: AssetId): Promise<OrderBook> {
    return this.requireBook(asset);
  }

  async getPositions(): Promise<ReadonlyArray<Position>> {
    const out: Position[] = [];
    for (const [asset, p] of this.positions) {
      if (p.qty === 0) continue;
      out.push({
        venue:    this.id,
        asset,
        side:     p.qty > 0 ? 'buy' : 'sell',
        qty:      String(Math.abs(p.qty)),
        avgPrice: String(p.avgPrice),
        unrealisedPnLUsd: '0' as DecimalUsd,   // requires mark price; computed by caller
        openedAt: p.openedAt,
      });
    }
    return out;
  }

  async getBalances(): Promise<ReadonlyArray<Balance>> {
    const out: Balance[] = [];
    for (const [currency, b] of this.balances) {
      out.push({
        venue:    this.id,
        currency,
        free:     String(b.free),
        locked:   String(b.locked),
        total:    String(b.free + b.locked),
      });
    }
    return out;
  }

  // ── Trade ────────────────────────────────────────────────────────────────

  async placeOrder(req: OrderRequest): Promise<OrderAck> {
    const venueOrderId = `paper-${++this.orderCounter}`;
    const placedAt     = nowIso();

    if (!this.capabilities.canShort && req.side === 'sell') {
      const currentLong = this.positions.get(req.asset)?.qty ?? 0;
      if (currentLong < Number(req.size)) {
        return {
          venue:           this.id,
          requestId:       req.requestId,
          venueOrderId,
          status:          'rejected',
          fills:           [],
          reason:          'paper: shorts disabled and insufficient long position to sell',
          acknowledgedAt:  placedAt,
        };
      }
    }

    const book = this.requireBook(req.asset);
    const fills = this.walkBook(req, book, venueOrderId, placedAt);

    // Apply fills to balances and positions.
    let filledQty = 0;
    for (const f of fills) {
      const px = Number(f.price);
      const qty = Number(f.size) * (req.side === 'buy' ? 1 : -1);
      filledQty += Number(f.size);
      const prior = this.positions.get(req.asset) ?? { qty: 0, avgPrice: 0, openedAt: placedAt };
      const newQty = prior.qty + qty;
      const newAvg = newQty === 0
        ? 0
        : (prior.qty * prior.avgPrice + qty * px) / newQty;
      this.positions.set(req.asset, {
        qty:      newQty,
        avgPrice: newAvg,
        openedAt: prior.qty === 0 ? placedAt : prior.openedAt,
      });
      // Cash impact (USD only; pretend everything is USD-quoted).
      const usd = this.balances.get('USD') ?? { free: 0, locked: 0 };
      const cashDelta = req.side === 'buy' ? -(Number(f.size) * px) : Number(f.size) * px;
      const feeUsd    = (Number(f.size) * px) * (this.feeBps / 10_000);
      usd.free += cashDelta - feeUsd;
      this.balances.set('USD', usd);
    }

    const reqSize = Number(req.size);
    let status: OrderAck['status'];
    if (fills.length === 0)              status = 'rejected';
    else if (filledQty >= reqSize - 1e-9) status = 'filled';
    else                                  status = 'partial';

    // For GTC: leave the remaining qty open. For IOC/FOK/day on a paper venue: drop it.
    if (status === 'partial' && req.timeInForce === 'gtc') {
      this.openOrders.set(venueOrderId, {
        request: req,
        venueOrderId,
        remainingQty: reqSize - filledQty,
        placedAt,
      });
    }
    if (status === 'rejected' && req.type === 'limit' && req.timeInForce === 'gtc') {
      // No fills against current book; resting limit order.
      this.openOrders.set(venueOrderId, {
        request: req,
        venueOrderId,
        remainingQty: reqSize,
        placedAt,
      });
      status = 'accepted';
    }

    return {
      venue:           this.id,
      requestId:       req.requestId,
      venueOrderId,
      status,
      fills,
      reason:          status === 'rejected' ? 'paper: no fills against the current book' : null,
      acknowledgedAt:  placedAt,
    };
  }

  async cancelOrder(venueOrderId: string): Promise<OrderAck> {
    const open = this.openOrders.get(venueOrderId);
    if (!open) {
      return {
        venue: this.id, requestId: '', venueOrderId,
        status: 'unknown', fills: [],
        reason: 'paper: no open order with that id',
        acknowledgedAt: nowIso(),
      };
    }
    this.openOrders.delete(venueOrderId);
    return {
      venue: this.id, requestId: open.request.requestId, venueOrderId,
      status: 'cancelled', fills: [], reason: null,
      acknowledgedAt: nowIso(),
    };
  }

  async modifyOrder(venueOrderId: string, req: OrderRequest): Promise<OrderAck> {
    await this.cancelOrder(venueOrderId);
    return this.placeOrder(req);
  }

  async health(): Promise<VenueHealth> {
    return {
      venue:               this.id,
      observedAt:          nowIso(),
      p99OrderLatencyMs:   0,
      recentFailureRate:   0,
      marketDataAgeMs:     0,
      outage:              false,
      notes:               'paper venue is always healthy',
    };
  }

  // ── Internals ────────────────────────────────────────────────────────────

  private requireBook(asset: AssetId): OrderBook {
    const book = this.books.get(asset);
    if (!book) throw new Error(`paper: no book set for ${asset}; call setOrderBook() in test setup`);
    return book;
  }

  /**
   * Walk the book and produce deterministic fills.
   * For BUY: walk asks in ascending price.
   * For SELL: walk bids in descending price.
   * Limit orders stop walking when price crosses the limit.
   */
  private walkBook(
    req:           OrderRequest,
    book:          OrderBook,
    venueOrderId:  string,
    placedAt:      Iso8601,
  ): Fill[] {
    const levels: OrderBookLevel[] = req.side === 'buy' ? [...book.asks] : [...book.bids];
    const limit: number | null = req.type === 'limit' && req.limitPrice ? Number(req.limitPrice) : null;
    let remaining = Number(req.size);
    const fills: Fill[] = [];
    let fillCounter = 0;

    for (const level of levels) {
      if (remaining <= 1e-12) break;
      const px = Number(level.price);
      if (limit !== null) {
        if (req.side === 'buy'  && px > limit) break;   // book ask exceeds our limit
        if (req.side === 'sell' && px < limit) break;
      }
      const take = Math.min(remaining, Number(level.size));
      fills.push({
        fillId:     `paper-fill-${venueOrderId}-${++fillCounter}`,
        orderId:    venueOrderId,
        venue:      this.id,
        asset:      req.asset,
        side:       req.side as Side,
        size:       String(take),
        price:      String(px),
        feesUsd:    String(take * px * (this.feeBps / 10_000)) as DecimalUsd,
        filledAt:   placedAt,
        venueTxRef: `paper-tx-${venueOrderId}-${fillCounter}`,
      });
      remaining -= take;
    }

    return fills;
  }
}
