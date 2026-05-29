/**
 * Venue interface — the contract every adapter conforms to.
 *
 * Per TESTING_DOCTRINE § 2.2:
 *   read methods (getQuote, getOrderBook, getPositions, getBalances)
 *     are always available — they use public market data and do not
 *     require credentials.
 *
 *   trade methods (placeOrder, cancelOrder, modifyOrder) require
 *     credentials. They fail closed (NotAuthorizedError) when credentials
 *     are absent.
 *
 *   health() returns the data CUSTOS gate.venue reads when deciding
 *     whether to allow routing to this venue.
 *
 * Conformance to this interface is what makes adapter swapping possible:
 *   the same Venue contract is honoured by the paper venue (deterministic),
 *   the Alpaca paper adapter (real API + simulated fills), and any future
 *   live adapter (real API + real fills). VECTOR / VENDITOR see only the
 *   interface.
 */

import type {
  AssetId,
  VenueId,
  Iso8601,
  DecimalUsd,
} from '../types/common.js';
import type {
  Quote,
  OrderBook,
  OrderRequest,
  Fill,
  Side,
  DecimalString,
} from '../types/market.js';

// ── What the venue can do ───────────────────────────────────────────────────
export interface VenueCapabilities {
  readonly canTrade:        boolean;   // false if no credentials configured
  readonly canShort:        boolean;
  readonly canMargin:       boolean;
  readonly canModify:       boolean;
  readonly supportedTypes:  ReadonlyArray<'market' | 'limit' | 'stop' | 'stop-limit' | 'reduce-only'>;
  readonly supportedTifs:   ReadonlyArray<'gtc' | 'ioc' | 'fok' | 'day'>;
  readonly minOrderUsd:     DecimalUsd;
  readonly maxOrderUsd:     DecimalUsd | null;   // null = unlimited
}

// ── Read shapes ─────────────────────────────────────────────────────────────
export interface Position {
  readonly venue:           VenueId;
  readonly asset:           AssetId;
  readonly side:            Side;            // long position -> 'buy' side basis
  readonly qty:             DecimalString;
  readonly avgPrice:        DecimalString;
  readonly unrealisedPnLUsd: DecimalUsd;
  readonly openedAt:        Iso8601;
}

export interface Balance {
  readonly venue:    VenueId;
  readonly currency: string;          // e.g. 'USD', 'USDC'
  readonly free:     DecimalString;
  readonly locked:   DecimalString;   // held against open orders
  readonly total:    DecimalString;
}

// ── Order acknowledgement ───────────────────────────────────────────────────
export type OrderAckStatus =
  | 'accepted'      // venue accepted; may or may not be filled yet
  | 'rejected'      // venue refused; reason in `reason`
  | 'filled'        // venue accepted AND fully filled
  | 'partial'       // venue accepted AND partially filled
  | 'cancelled'     // venue acknowledged cancellation
  | 'unknown';      // we got a response but cannot classify it

export interface OrderAck {
  readonly venue:        VenueId;
  readonly requestId:    string;           // matches OrderRequest.requestId
  readonly venueOrderId: string;           // venue's id for the order
  readonly status:       OrderAckStatus;
  readonly fills:        ReadonlyArray<Fill>;
  readonly reason:       string | null;    // present iff rejected
  readonly acknowledgedAt: Iso8601;
}

// ── Health ──────────────────────────────────────────────────────────────────
export interface VenueHealth {
  readonly venue:              VenueId;
  readonly observedAt:         Iso8601;
  readonly p99OrderLatencyMs:  number;
  readonly recentFailureRate:  number;     // 0..1
  readonly marketDataAgeMs:    number;
  readonly outage:             boolean;
  readonly notes:              string;
}

// ── Errors (typed; never strings) ───────────────────────────────────────────
export class VenueError extends Error {
  constructor(public readonly venue: VenueId, message: string) {
    super(message);
    this.name = 'VenueError';
  }
}
export class NotAuthorizedError extends VenueError {
  constructor(venue: VenueId, public readonly method: string) {
    super(venue, `not authorized: ${method} requires credentials`);
    this.name = 'NotAuthorizedError';
  }
}
export class VenueOutageError extends VenueError {
  constructor(venue: VenueId) {
    super(venue, 'venue is in outage; CUSTOS gate.venue will block this');
    this.name = 'VenueOutageError';
  }
}

// ── The contract ────────────────────────────────────────────────────────────
export interface Venue {
  /** Identity */
  readonly id:           VenueId;
  readonly capabilities: VenueCapabilities;

  // Read — always available
  getQuote(asset: AssetId):       Promise<Quote>;
  getOrderBook(asset: AssetId):   Promise<OrderBook>;
  getPositions():                 Promise<ReadonlyArray<Position>>;
  getBalances():                  Promise<ReadonlyArray<Balance>>;

  // Trade — requires credentials; throws NotAuthorizedError if absent
  placeOrder(req: OrderRequest):  Promise<OrderAck>;
  cancelOrder(venueOrderId: string): Promise<OrderAck>;
  modifyOrder(venueOrderId: string, req: OrderRequest): Promise<OrderAck>;

  // Health — drives CUSTOS gate.venue
  health(): Promise<VenueHealth>;
}
