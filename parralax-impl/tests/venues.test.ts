import { describe, it, expect } from 'vitest';
import { PaperVenue } from '../src/venues/paper.js';
import { AlpacaPaperVenue, NotImplementedError } from '../src/venues/alpaca-paper.js';
import { NotAuthorizedError } from '../src/venues/types.js';
import {
  emptyOverlay,
  isValidOverlay,
} from '../src/operator-ui/tradingview.js';
import type {
  AssetId,
  Iso8601,
  DecimalUsd,
} from '../src/types/common.js';
import { nowIso } from '../src/types/common.js';
import type { OrderBook, OrderRequest } from '../src/types/market.js';

const ASSET = 'equity:tsla' as AssetId;

function bookOf({ bids, asks }: {
  bids: Array<[string, string]>;
  asks: Array<[string, string]>;
}): OrderBook {
  return {
    venue:      'paper' as never,
    asset:      ASSET,
    bids:       bids.map(([price, size]) => ({ price, size })),
    asks:       asks.map(([price, size]) => ({ price, size })),
    observedAt: nowIso(),
  };
}

function request(overrides: Partial<OrderRequest> = {}): OrderRequest {
  return {
    requestId:    'req-1',
    venue:        'paper' as never,
    asset:        ASSET,
    side:         'buy',
    type:         'market',
    size:         '10',
    timeInForce:  'ioc',
    notionalUsd:  '1000' as DecimalUsd,
    intendedAt:   nowIso(),
    ...overrides,
  };
}

// ── PaperVenue determinism ─────────────────────────────────────────────────

describe('PaperVenue — deterministic in-process matching', () => {
  it('honours the Venue interface and reports paper-venue capabilities', () => {
    const v = new PaperVenue();
    expect(v.id).toBe('paper');
    expect(v.capabilities.canTrade).toBe(true);
    expect(v.capabilities.canShort).toBe(false);   // ASSET_SCOPE § 6.3
    expect(v.capabilities.canMargin).toBe(false);  // ASSET_SCOPE § 6.4
  });

  it('walks the ask side for buy market orders', async () => {
    const v = new PaperVenue({ initialBalances: [{ currency: 'USD', free: '100000', locked: '0', total: '100000' }] });
    v.setOrderBook(ASSET, bookOf({
      bids: [['99.50', '100']],
      asks: [['100.00', '5'], ['100.50', '10'], ['101.00', '20']],
    }));

    const ack = await v.placeOrder(request({ side: 'buy', size: '12', type: 'market', timeInForce: 'ioc' }));
    expect(ack.status).toBe('filled');
    expect(ack.fills.length).toBe(2);
    expect(ack.fills[0]!.size).toBe('5');
    expect(ack.fills[0]!.price).toBe('100');
    expect(ack.fills[1]!.size).toBe('7');
    expect(ack.fills[1]!.price).toBe('100.5');
  });

  it('rejects sell orders below position size when shorts are disabled', async () => {
    const v = new PaperVenue();
    v.setOrderBook(ASSET, bookOf({
      bids: [['100', '100']],
      asks: [['101', '100']],
    }));
    const ack = await v.placeOrder(request({ side: 'sell', size: '5' }));
    expect(ack.status).toBe('rejected');
    expect(ack.reason).toMatch(/shorts disabled/);
  });

  it('produces identical fills on identical inputs (determinism guarantee)', async () => {
    const make = () => {
      const v = new PaperVenue();
      v.setOrderBook(ASSET, bookOf({
        bids: [['99', '5']],
        asks: [['100', '5'], ['101', '5'], ['102', '5']],
      }));
      return v;
    };
    const v1 = make();
    const v2 = make();
    const a1 = await v1.placeOrder(request({ side: 'buy', size: '8' }));
    const a2 = await v2.placeOrder(request({ side: 'buy', size: '8' }));
    expect(a2.fills.length).toBe(a1.fills.length);
    for (let i = 0; i < a1.fills.length; i++) {
      expect(a2.fills[i]!.size).toBe(a1.fills[i]!.size);
      expect(a2.fills[i]!.price).toBe(a1.fills[i]!.price);
    }
  });

  it('limit orders stop walking when the price crosses the limit', async () => {
    const v = new PaperVenue();
    v.setOrderBook(ASSET, bookOf({
      bids: [['99', '5']],
      asks: [['100', '5'], ['101', '5'], ['102', '5']],
    }));
    const ack = await v.placeOrder(request({
      side: 'buy', size: '20', type: 'limit', limitPrice: '100.5', timeInForce: 'ioc',
    }));
    // Only the $100 level should fill; $101 is above the limit.
    expect(ack.fills.length).toBe(1);
    expect(ack.fills[0]!.size).toBe('5');
    expect(ack.status).toBe('partial');
  });

  it('GTC limit orders that find no fill rest as accepted', async () => {
    const v = new PaperVenue();
    v.setOrderBook(ASSET, bookOf({
      bids: [['99', '5']],
      asks: [['100', '5']],
    }));
    const ack = await v.placeOrder(request({
      side: 'buy', size: '5', type: 'limit', limitPrice: '95', timeInForce: 'gtc',
    }));
    expect(ack.status).toBe('accepted');
    expect(ack.fills.length).toBe(0);

    const cancel = await v.cancelOrder(ack.venueOrderId);
    expect(cancel.status).toBe('cancelled');
  });

  it('health() always reports healthy for the paper venue', async () => {
    const v = new PaperVenue();
    const h = await v.health();
    expect(h.outage).toBe(false);
    expect(h.recentFailureRate).toBe(0);
  });
});

// ── AlpacaPaperVenue stub conformance ──────────────────────────────────────

describe('AlpacaPaperVenue — stub adapter (Venue interface conformance)', () => {
  it('reports canTrade=false when no credentials are present', () => {
    const v = new AlpacaPaperVenue({ key: null, secret: null });
    expect(v.capabilities.canTrade).toBe(false);
    expect(v.capabilities.canShort).toBe(false);
    expect(v.capabilities.canMargin).toBe(false);
  });

  it('reports canTrade=true when credentials are present', () => {
    const v = new AlpacaPaperVenue({ key: 'test-key', secret: 'test-secret' });
    expect(v.capabilities.canTrade).toBe(true);
    expect(v.capabilities.canShort).toBe(false);
    expect(v.capabilities.canMargin).toBe(false);
  });

  it('throws NotAuthorizedError on trade methods when credentials absent', async () => {
    const v = new AlpacaPaperVenue({ key: null, secret: null });
    await expect(v.placeOrder(request())).rejects.toBeInstanceOf(NotAuthorizedError);
    await expect(v.cancelOrder('x')).rejects.toBeInstanceOf(NotAuthorizedError);
    await expect(v.modifyOrder('x', request())).rejects.toBeInstanceOf(NotAuthorizedError);
  });

  it('placeOrder/cancelOrder return a real Ack (not throw) when credentials present — HTTP semantics ratified', async () => {
    // With credentials, placeOrder and cancelOrder go through the HTTP client
    // (which returns a rejected Ack on error rather than throwing an internal
    // implementation-error). Only modifyOrder is still deliberately NotImplemented
    // per TESTING_DOCTRINE § 2 — Alpaca order-replace has subtle semantics
    // warranting its own commit and its own tests.
    //
    // We inject a fetch that always 401s so this test doesn't hit the network;
    // the shape asserted is: the venue exposed a real HTTP client with credentials,
    // not the old always-throw stub.
    const alwaysFail: import('../src/venues/alpaca-paper.js').FetchLike = async () => ({
      ok: false, status: 401,
      headers: { get: () => null },
      json: async () => ({ message: 'unauthorized' }),
      text: async () => '{"message":"unauthorized"}',
    });
    const v = new AlpacaPaperVenue({ key: 'k', secret: 's', fetch: alwaysFail });
    const placeAck = await v.placeOrder(request());
    expect(placeAck.status).toBe('rejected');
    expect(placeAck.reason).toMatch(/HTTP 401/);

    const cancelAck = await v.cancelOrder('some-id');
    expect(cancelAck.status).toBe('unknown');
    expect(cancelAck.reason).toMatch(/HTTP 401/);

    // modifyOrder is the deliberate exception — still NotImplemented.
    await expect(v.modifyOrder('x', request())).rejects.toBeInstanceOf(NotImplementedError);
  });

  it('read methods work without credentials (synthetic stub data)', async () => {
    const v = new AlpacaPaperVenue({ key: null, secret: null });
    const q = await v.getQuote(ASSET);
    expect(q.venue).toBe('alpaca-paper');
    expect(q.asset).toBe(ASSET);

    const positions = await v.getPositions();
    expect(positions).toEqual([]);

    const balances = await v.getBalances();
    expect(balances).toEqual([]);

    const h = await v.health();
    expect(h.outage).toBe(true);
    expect(h.notes).toMatch(/no credentials/);
  });
});

// ── TradingView overlay shape ──────────────────────────────────────────────

describe('TradingView operator overlay — read-only shape', () => {
  it('emptyOverlay produces a valid OperatorOverlay', () => {
    const o = emptyOverlay(nowIso());
    expect(isValidOverlay(o)).toBe(true);
    expect(o.positions).toEqual([]);
    expect(o.signals).toEqual([]);
    expect(o.fills).toEqual([]);
    expect(o.gates).toEqual({});
    expect(o.killSwitch).toEqual([]);
    expect(o.drawdown).toEqual([]);
    expect(o.heartbeat.beat).toBe(0);
  });

  it('isValidOverlay rejects malformed input', () => {
    expect(isValidOverlay(null)).toBe(false);
    expect(isValidOverlay({})).toBe(false);
    expect(isValidOverlay({ asOf: 'now', positions: 'oops' })).toBe(false);
  });

  it('module exports NO function that triggers a PARRALAX side effect from a TradingView caller', async () => {
    // Read every export name from the tradingview overlay module and assert
    // none of them suggests an authority-conferring action. This is the
    // TESTING_DOCTRINE § 3.2 assertion encoded as a test.
    const mod = await import('../src/operator-ui/tradingview.js');
    const forbiddenNames = [
      'signOrder', 'placeOrder', 'cancelOrder', 'modifyOrder',
      'tripKillSwitch', 'resetKillSwitch',
      'promoteAgent', 'demoteAgent',
      'mintToken', 'editMandate',
      'withdraw',
    ];
    for (const name of forbiddenNames) {
      expect(name in mod).toBe(false);
    }
  });
});
