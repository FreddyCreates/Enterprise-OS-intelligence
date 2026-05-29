/**
 * AlpacaPaperVenue — stub adapter for Alpaca's Paper Trading API.
 *
 * Per TESTING_DOCTRINE § 2 (ratified May 2026): the day-one demo-account
 * venue for US equities is Alpaca paper.
 *
 * This file is a SKELETON. It honours the Venue interface fully so VECTOR
 * / VENDITOR can compile against it, but every trade method throws
 * NotImplementedError until the real Alpaca client is wired (a separate
 * commit, per the simulation-to-live promotion path).
 *
 * Read methods return synthetic / empty responses suitable for type
 * checks; tests against the real Alpaca paper API are opt-in via
 * ALPACA_PAPER_KEY presence (per TESTING_DOCTRINE § 4).
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
import { NotAuthorizedError } from './types.js';

export interface AlpacaPaperConfig {
  readonly key?:     string | null;
  readonly secret?:  string | null;
  readonly baseUrl?: string;
  /** Pass a function that returns the current time; tests inject a fixed clock. */
  readonly nowFn?:   () => Iso8601;
}

const DEFAULT_BASE_URL = 'https://paper-api.alpaca.markets';

export class NotImplementedError extends Error {
  constructor(method: string) {
    super(`alpaca-paper: ${method} is a stub; live implementation lands per TESTING_DOCTRINE § 2.4`);
    this.name = 'NotImplementedError';
  }
}

export class AlpacaPaperVenue implements Venue {
  readonly id: VenueId = 'alpaca-paper' as VenueId;
  readonly capabilities: VenueCapabilities;

  private readonly key:     string | null;
  private readonly secret:  string | null;
  /**
   * Base URL kept on the instance so the live-implementation commit can
   * use it without changing the constructor signature. Marked as
   * intentionally unused on the stub by the leading underscore.
   */
  private readonly _baseUrl: string;
  private readonly nowFn:   () => Iso8601;

  constructor(cfg: AlpacaPaperConfig = {}) {
    this.key      = cfg.key     ?? process.env['ALPACA_PAPER_KEY']    ?? null;
    this.secret   = cfg.secret  ?? process.env['ALPACA_PAPER_SECRET'] ?? null;
    this._baseUrl = cfg.baseUrl ?? process.env['ALPACA_PAPER_BASE_URL'] ?? DEFAULT_BASE_URL;
    this.nowFn    = cfg.nowFn   ?? nowIso;

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

  private requireAuth(method: string): void {
    if (!this.capabilities.canTrade) {
      throw new NotAuthorizedError(this.id, method);
    }
  }

  // ── Read (always available; stub returns synthetic data) ─────────────────

  async getQuote(asset: AssetId): Promise<Quote> {
    // STUB. Real implementation calls Alpaca's IEX/Polygon feed.
    return {
      venue:      this.id,
      asset,
      bid:        '0',
      ask:        '0',
      bidSize:    '0',
      askSize:    '0',
      observedAt: this.nowFn(),
    };
  }

  async getOrderBook(asset: AssetId): Promise<OrderBook> {
    // STUB. Alpaca free-tier offers top-of-book only; deeper depth requires
    // a paid market-data subscription. The real implementation respects
    // whatever depth the configured subscription level provides.
    return {
      venue:      this.id,
      asset,
      bids:       [],
      asks:       [],
      observedAt: this.nowFn(),
    };
  }

  async getPositions(): Promise<ReadonlyArray<Position>> {
    if (!this.capabilities.canTrade) return [];
    // STUB. Real: GET /v2/positions
    return [];
  }

  async getBalances(): Promise<ReadonlyArray<Balance>> {
    if (!this.capabilities.canTrade) return [];
    // STUB. Real: GET /v2/account
    return [];
  }

  // ── Trade (requires credentials; throws NotAuthorizedError if absent) ────

  async placeOrder(_req: OrderRequest): Promise<OrderAck> {
    this.requireAuth('placeOrder');
    throw new NotImplementedError('placeOrder');
  }

  async cancelOrder(_venueOrderId: string): Promise<OrderAck> {
    this.requireAuth('cancelOrder');
    throw new NotImplementedError('cancelOrder');
  }

  async modifyOrder(_venueOrderId: string, _req: OrderRequest): Promise<OrderAck> {
    this.requireAuth('modifyOrder');
    throw new NotImplementedError('modifyOrder');
  }

  // ── Health ────────────────────────────────────────────────────────────────

  async health(): Promise<VenueHealth> {
    // STUB. Real implementation pings `${this._baseUrl}/v2/clock` and times
    // round-trip. The base URL appears in the notes so the operator can
    // confirm which Alpaca environment the adapter is pointed at.
    return {
      venue:               this.id,
      observedAt:          this.nowFn(),
      p99OrderLatencyMs:   0,
      recentFailureRate:   0,
      marketDataAgeMs:     0,
      outage:              !this.capabilities.canTrade,
      notes:               this.capabilities.canTrade
        ? `alpaca-paper: stub healthy; target=${this._baseUrl}; replace with real ping in next commit`
        : `alpaca-paper: no credentials; target=${this._baseUrl}; trade methods will fail closed`,
    };
  }
}
