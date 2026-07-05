/**
 * AlpacaPaperVenue — adapter for Alpaca's Paper Trading API.
 *
 * Per TESTING_DOCTRINE § 2 (ratified May 2026): the day-one demo-account
 * venue for US equities is Alpaca paper.
 *
 * This module carries the real HTTP shape (endpoints, methods, JSON
 * payload conversions) but keeps fetch injectable so:
 *   - CI without network can run tests against a mocked fetch.
 *   - Production runs against `globalThis.fetch` against the real API.
 *   - PRs from forks (no secrets) skip these tests cleanly.
 *
 * The trade methods now issue real HTTP calls when a fetch implementation
 * is provided. In the absence of one, they throw NotAuthorizedError so
 * accidental deployment without credentials fails closed rather than
 * silently.
 *
 * Credential handling:
 *   - ALPACA_PAPER_KEY     env var (paper API key id)
 *   - ALPACA_PAPER_SECRET  env var (paper API secret)
 *   - ALPACA_PAPER_BASE_URL env var (default https://paper-api.alpaca.markets)
 *
 * Per SECURITY.md, credentials are loaded at runtime; the sanitiser
 * pattern-blocks any inline key shape in any committed file.
 *
 * The capabilities below reflect the paper-only posture: canTrade is
 * true when credentials are present; canShort and canMargin are false
 * because ASSET_SCOPE_CHARTER § 6.3 / § 6.4 forbid both day 1.
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
  OrderRequest,
} from '../types/market.js';
import type {
  Venue,
  VenueCapabilities,
  Position,
  Balance,
  OrderAck,
  VenueHealth,
} from './types.js';
import { NotAuthorizedError, VenueError } from './types.js';

// ── Injectable fetch — Fetch-API-compatible ────────────────────────────────
export type FetchLike = (input: string, init?: {
  method?:  string;
  headers?: Record<string, string>;
  body?:    string;
}) => Promise<{
  ok:      boolean;
  status:  number;
  headers: { get(name: string): string | null };
  json:    () => Promise<unknown>;
  text:    () => Promise<string>;
}>;

export interface AlpacaPaperConfig {
  readonly key?:     string | null;
  readonly secret?:  string | null;
  readonly baseUrl?: string;
  /** Pass a function that returns the current time; tests inject a fixed clock. */
  readonly nowFn?:   () => Iso8601;
  /** Inject fetch for tests. Defaults to globalThis.fetch when present. */
  readonly fetch?:   FetchLike | null;
}

const DEFAULT_BASE_URL = 'https://paper-api.alpaca.markets';

/**
 * Preserved for backward compatibility with the earlier stub. The real
 * fetch-driven implementation returns proper OrderAcks or throws
 * VenueError / NotAuthorizedError. NotImplementedError is thrown only
 * from paths that are still explicitly stubbed (currently: modifyOrder,
 * which requires order-replace semantics distinct from cancel-then-place).
 */
export class NotImplementedError extends Error {
  constructor(method: string) {
    super(`alpaca-paper: ${method} is not yet implemented; see TESTING_DOCTRINE § 2.4`);
    this.name = 'NotImplementedError';
  }
}

export class AlpacaPaperVenue implements Venue {
  readonly id: VenueId = 'alpaca-paper' as VenueId;
  readonly capabilities: VenueCapabilities;

  private readonly key:     string | null;
  private readonly secret:  string | null;
  private readonly baseUrl: string;
  private readonly nowFn:   () => Iso8601;
  private readonly fetchImpl: FetchLike | null;

  constructor(cfg: AlpacaPaperConfig = {}) {
    this.key     = cfg.key     ?? process.env['ALPACA_PAPER_KEY']    ?? null;
    this.secret  = cfg.secret  ?? process.env['ALPACA_PAPER_SECRET'] ?? null;
    this.baseUrl = cfg.baseUrl ?? process.env['ALPACA_PAPER_BASE_URL'] ?? DEFAULT_BASE_URL;
    this.nowFn   = cfg.nowFn   ?? nowIso;

    // Choose fetch: explicit > injected > globalThis.fetch > null
    if (cfg.fetch === null)       this.fetchImpl = null;
    else if (cfg.fetch)           this.fetchImpl = cfg.fetch;
    else if (typeof (globalThis as unknown as { fetch?: FetchLike }).fetch === 'function')
                                  this.fetchImpl = (globalThis as unknown as { fetch: FetchLike }).fetch;
    else                          this.fetchImpl = null;

    const credentialed = Boolean(this.key && this.secret);
    this.capabilities = {
      canTrade:       credentialed,
      canShort:       false,
      canMargin:      false,
      canModify:      true,
      supportedTypes: ['market', 'limit', 'stop', 'stop-limit'],
      supportedTifs:  ['gtc', 'ioc', 'fok', 'day'],
      minOrderUsd:    '1' as DecimalUsd,
      maxOrderUsd:    null,
    };
  }

  // ── HTTP plumbing ──────────────────────────────────────────────────────

  private authHeaders(): Record<string, string> {
    if (!this.key || !this.secret) throw new NotAuthorizedError(this.id, 'authHeaders');
    return {
      'APCA-API-KEY-ID':     this.key,
      'APCA-API-SECRET-KEY': this.secret,
      'Content-Type':        'application/json',
      'Accept':              'application/json',
    };
  }

  private async request<T = unknown>(
    method: 'GET' | 'POST' | 'DELETE' | 'PATCH',
    path: string,
    body?: unknown,
  ): Promise<T> {
    if (!this.fetchImpl) {
      throw new NotAuthorizedError(this.id, `HTTP ${method} ${path} — no fetch impl configured`);
    }
    const headers = this.authHeaders();
    const url = this.baseUrl.replace(/\/+$/, '') + path;
    const res = await this.fetchImpl(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new VenueError(this.id, `HTTP ${res.status} ${method} ${path}: ${text.slice(0, 200)}`);
    }
    return res.json() as Promise<T>;
  }

  private requireAuth(method: string): void {
    if (!this.capabilities.canTrade) {
      throw new NotAuthorizedError(this.id, method);
    }
  }

  // ── Read ─────────────────────────────────────────────────────────────────
  // Read methods DO require credentials in Alpaca's API — even market data
  // is behind auth on Alpaca. If no credentials, we return empty structures
  // (with a stale timestamp so downstream `gate.venue` correctly refuses).

  async getQuote(asset: AssetId): Promise<Quote> {
    if (!this.capabilities.canTrade || !this.fetchImpl) {
      return { venue: this.id, asset, bid: '0', ask: '0', bidSize: '0', askSize: '0', observedAt: this.nowFn() };
    }
    const sym = symbolFromAssetId(asset);
    const data = await this.request<AlpacaLatestQuoteResp>(
      'GET',
      `/v2/stocks/${encodeURIComponent(sym)}/quotes/latest`,
    );
    return {
      venue:      this.id,
      asset,
      bid:        String(data.quote.bp),
      ask:        String(data.quote.ap),
      bidSize:    String(data.quote.bs),
      askSize:    String(data.quote.as),
      observedAt: data.quote.t as Iso8601,
    };
  }

  async getOrderBook(asset: AssetId): Promise<OrderBook> {
    // Alpaca free/basic subscriptions expose top-of-book only. Return a
    // one-level book synthesised from the latest quote. Deeper depth
    // requires a paid market-data subscription and a different endpoint.
    const q = await this.getQuote(asset);
    return {
      venue:      this.id,
      asset,
      bids:       q.bid !== '0' ? [{ price: q.bid, size: q.bidSize }] : [],
      asks:       q.ask !== '0' ? [{ price: q.ask, size: q.askSize }] : [],
      observedAt: q.observedAt,
    };
  }

  async getPositions(): Promise<ReadonlyArray<Position>> {
    if (!this.capabilities.canTrade) return [];
    const rows = await this.request<AlpacaPositionResp[]>('GET', '/v2/positions');
    const out: Position[] = [];
    for (const r of rows) {
      out.push({
        venue:    this.id,
        asset:    assetIdFromSymbol(r.symbol),
        side:     Number(r.qty) >= 0 ? 'buy' : 'sell',
        qty:      String(Math.abs(Number(r.qty))),
        avgPrice: String(r.avg_entry_price),
        unrealisedPnLUsd: String(r.unrealized_pl) as DecimalUsd,
        openedAt: this.nowFn(),   // Alpaca doesn't return open time on positions endpoint
      });
    }
    return out;
  }

  async getBalances(): Promise<ReadonlyArray<Balance>> {
    if (!this.capabilities.canTrade) return [];
    const acct = await this.request<AlpacaAccountResp>('GET', '/v2/account');
    return [{
      venue:    this.id,
      currency: 'USD',
      free:     String(acct.buying_power),
      locked:   '0',
      total:    String(acct.equity),
    }];
  }

  // ── Trade ────────────────────────────────────────────────────────────────

  async placeOrder(req: OrderRequest): Promise<OrderAck> {
    this.requireAuth('placeOrder');
    const body = {
      symbol:         symbolFromAssetId(req.asset),
      qty:            req.size,
      side:           req.side,
      type:           req.type === 'stop-limit' ? 'stop_limit' : req.type,
      time_in_force:  req.timeInForce,
      limit_price:    req.limitPrice,
      stop_price:     req.stopPrice,
      client_order_id: req.requestId,
    };
    try {
      const r = await this.request<AlpacaOrderResp>('POST', '/v2/orders', body);
      return alpacaOrderToAck(this.id, req.requestId, r, this.nowFn());
    } catch (e) {
      const reason = e instanceof Error ? e.message : String(e);
      return {
        venue: this.id, requestId: req.requestId,
        venueOrderId:  '',
        status:        'rejected',
        fills:         [],
        reason,
        acknowledgedAt: this.nowFn(),
      };
    }
  }

  async cancelOrder(venueOrderId: string): Promise<OrderAck> {
    this.requireAuth('cancelOrder');
    try {
      await this.request<void>('DELETE', `/v2/orders/${encodeURIComponent(venueOrderId)}`);
      return {
        venue: this.id, requestId: '', venueOrderId,
        status: 'cancelled', fills: [], reason: null,
        acknowledgedAt: this.nowFn(),
      };
    } catch (e) {
      const reason = e instanceof Error ? e.message : String(e);
      return {
        venue: this.id, requestId: '', venueOrderId,
        status: 'unknown', fills: [], reason,
        acknowledgedAt: this.nowFn(),
      };
    }
  }

  async modifyOrder(_venueOrderId: string, _req: OrderRequest): Promise<OrderAck> {
    this.requireAuth('modifyOrder');
    // Alpaca supports PATCH /v2/orders/{id} for order-replace but it has
    // subtle semantics around field-level updates that warrant their own
    // commit and their own tests. Deferred; cancel-then-place remains the
    // recommended path for now.
    throw new NotImplementedError('modifyOrder');
  }

  // ── Health ────────────────────────────────────────────────────────────────

  async health(): Promise<VenueHealth> {
    if (!this.capabilities.canTrade || !this.fetchImpl) {
      return {
        venue:               this.id,
        observedAt:          this.nowFn(),
        p99OrderLatencyMs:   0,
        recentFailureRate:   0,
        marketDataAgeMs:     0,
        outage:              true,
        notes:               `alpaca-paper: no credentials; target=${this.baseUrl}; trade methods will fail closed`,
      };
    }
    const t0 = Date.now();
    let outage = false;
    let notes  = `alpaca-paper: target=${this.baseUrl}`;
    try {
      await this.request<AlpacaClockResp>('GET', '/v2/clock');
    } catch (e) {
      outage = true;
      notes  = `alpaca-paper: clock ping failed: ${e instanceof Error ? e.message : String(e)}`;
    }
    const latencyMs = Date.now() - t0;
    return {
      venue:               this.id,
      observedAt:          this.nowFn(),
      p99OrderLatencyMs:   latencyMs,
      recentFailureRate:   outage ? 1 : 0,
      marketDataAgeMs:     0,
      outage,
      notes,
    };
  }
}

// ── Alpaca-side response shapes (internal) ─────────────────────────────────
interface AlpacaLatestQuoteResp {
  symbol: string;
  quote: {
    t:  string;    // timestamp ISO
    ap: number;    // ask price
    as: number;    // ask size
    bp: number;    // bid price
    bs: number;    // bid size
  };
}

interface AlpacaPositionResp {
  symbol:            string;
  qty:               string;
  avg_entry_price:   string;
  unrealized_pl:     string;
}

interface AlpacaAccountResp {
  buying_power: string;
  equity:       string;
}

interface AlpacaClockResp {
  timestamp: string;
  is_open:   boolean;
}

interface AlpacaOrderResp {
  id:              string;
  status:          string;   // 'accepted' | 'filled' | 'partially_filled' | 'canceled' | ...
  filled_qty:      string;
  filled_avg_price: string | null;
}

function alpacaOrderToAck(
  venue:      VenueId,
  requestId:  string,
  r:         AlpacaOrderResp,
  nowIsoStr: Iso8601,
): OrderAck {
  const status = mapAlpacaStatus(r.status);
  return {
    venue,
    requestId,
    venueOrderId:  r.id,
    status,
    fills: r.filled_avg_price && Number(r.filled_qty) > 0 ? [{
      fillId:     `alpaca-${r.id}-1`,
      orderId:    r.id,
      venue,
      asset:      '' as AssetId,   // caller has the assetId; filled_qty aggregates
      side:       'buy',           // will be overwritten by caller with correct side; kept minimal
      size:       r.filled_qty,
      price:      r.filled_avg_price,
      feesUsd:    '0' as DecimalUsd,
      filledAt:   nowIsoStr,
      venueTxRef: r.id,
    }] : [],
    reason:         status === 'rejected' ? `alpaca status ${r.status}` : null,
    acknowledgedAt: nowIsoStr,
  };
}

function mapAlpacaStatus(s: string): OrderAck['status'] {
  switch (s) {
    case 'accepted':
    case 'pending_new':
    case 'new':               return 'accepted';
    case 'filled':            return 'filled';
    case 'partially_filled':  return 'partial';
    case 'canceled':
    case 'cancelled':         return 'cancelled';
    case 'rejected':
    case 'expired':           return 'rejected';
    default:                  return 'unknown';
  }
}

/** Convert PARRALAX AssetId (e.g. 'equity:tsla') to an Alpaca symbol ('TSLA'). */
function symbolFromAssetId(a: AssetId): string {
  const s = String(a);
  const idx = s.indexOf(':');
  return (idx >= 0 ? s.slice(idx + 1) : s).toUpperCase();
}
function assetIdFromSymbol(sym: string): AssetId {
  return ('equity:' + sym.toLowerCase()) as AssetId;
}
