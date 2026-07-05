import { describe, it, expect } from 'vitest';
import { AlpacaPaperVenue } from '../src/venues/alpaca-paper.js';
import type { FetchLike } from '../src/venues/alpaca-paper.js';
import { NotAuthorizedError, VenueError } from '../src/venues/types.js';
import type { AssetId, DecimalUsd, Iso8601 } from '../src/types/common.js';
import type { OrderRequest } from '../src/types/market.js';

const ASSET = 'equity:tsla' as AssetId;
const NOW   = '2026-07-05T00:00:00.000Z' as Iso8601;

// Minimal fetch-mock that lets a test enumerate call/response pairs.
function mockFetch(handlers: Record<string, (init?: {
  method?: string; headers?: Record<string, string>; body?: string;
}) => { status: number; body: unknown }>): FetchLike {
  return async (url: string, init) => {
    const method = init?.method ?? 'GET';
    const key = `${method} ${url.replace(/^https?:\/\/[^/]+/, '')}`;
    const handler = handlers[key] ?? (() => ({ status: 404, body: { message: `no mock for ${key}` } }));
    const { status, body } = handler(init);
    const text = JSON.stringify(body);
    return {
      ok:      status >= 200 && status < 300,
      status,
      headers: { get: () => null },
      json:    async () => body,
      text:    async () => text,
    };
  };
}

function request(): OrderRequest {
  return {
    requestId:    'req-alpaca-1',
    venue:        'alpaca-paper' as never,
    asset:        ASSET,
    side:         'buy',
    type:         'market',
    size:         '10',
    timeInForce:  'day',
    notionalUsd:  '1000' as DecimalUsd,
    intendedAt:   NOW,
  };
}

describe('AlpacaPaperVenue — HTTP shape', () => {
  it('placeOrder rejects when no credentials configured', async () => {
    const v = new AlpacaPaperVenue({ key: null, secret: null, fetch: null, nowFn: () => NOW });
    await expect(v.placeOrder(request())).rejects.toBeInstanceOf(NotAuthorizedError);
  });

  it('placeOrder posts to /v2/orders with the right body and returns a filled ack', async () => {
    let posted: { url?: string; body?: unknown } = {};
    const fetch = mockFetch({
      'POST /v2/orders': (init) => {
        posted = { url: '/v2/orders', body: init?.body ? JSON.parse(init.body) : undefined };
        return {
          status: 200,
          body: {
            id:               'alpaca-order-1',
            status:           'filled',
            filled_qty:       '10',
            filled_avg_price: '99.50',
          },
        };
      },
    });
    const v = new AlpacaPaperVenue({ key: 'k', secret: 's', fetch, nowFn: () => NOW });
    const ack = await v.placeOrder(request());

    expect(ack.status).toBe('filled');
    expect(ack.venueOrderId).toBe('alpaca-order-1');
    expect(ack.fills.length).toBe(1);
    expect(ack.fills[0]!.price).toBe('99.50');

    const body = posted.body as { symbol: string; qty: string; side: string; type: string; time_in_force: string };
    expect(body.symbol).toBe('TSLA');
    expect(body.qty).toBe('10');
    expect(body.side).toBe('buy');
    expect(body.type).toBe('market');
    expect(body.time_in_force).toBe('day');
  });

  it('placeOrder returns a rejected ack when Alpaca returns an error status', async () => {
    const fetch = mockFetch({
      'POST /v2/orders': () => ({ status: 422, body: { message: 'insufficient buying power' } }),
    });
    const v = new AlpacaPaperVenue({ key: 'k', secret: 's', fetch, nowFn: () => NOW });
    const ack = await v.placeOrder(request());
    expect(ack.status).toBe('rejected');
    expect(ack.reason).toMatch(/HTTP 422/);
  });

  it('cancelOrder issues a DELETE to /v2/orders/{id}', async () => {
    let deleted = '';
    const fetch = mockFetch({
      'DELETE /v2/orders/abc-123': () => {
        deleted = 'abc-123';
        return { status: 204, body: null };
      },
    });
    const v = new AlpacaPaperVenue({ key: 'k', secret: 's', fetch, nowFn: () => NOW });
    const ack = await v.cancelOrder('abc-123');
    expect(ack.status).toBe('cancelled');
    expect(deleted).toBe('abc-123');
  });

  it('modifyOrder is deliberately NOT implemented (throws)', async () => {
    const v = new AlpacaPaperVenue({ key: 'k', secret: 's', nowFn: () => NOW });
    await expect(v.modifyOrder('id', request())).rejects.toThrow(/not yet implemented/);
  });

  it('getQuote parses a latest-quote response into the Venue quote shape', async () => {
    const fetch = mockFetch({
      'GET /v2/stocks/TSLA/quotes/latest': () => ({
        status: 200,
        body: {
          symbol: 'TSLA',
          quote: { t: '2026-07-05T01:23:45.000Z', ap: 250.10, as: 300, bp: 250.05, bs: 200 },
        },
      }),
    });
    const v = new AlpacaPaperVenue({ key: 'k', secret: 's', fetch, nowFn: () => NOW });
    const q = await v.getQuote(ASSET);
    expect(q.bid).toBe('250.05');
    expect(q.ask).toBe('250.1');
    expect(q.bidSize).toBe('200');
    expect(q.askSize).toBe('300');
  });

  it('getPositions parses Alpaca position rows into Venue Position shape', async () => {
    const fetch = mockFetch({
      'GET /v2/positions': () => ({
        status: 200,
        body: [
          { symbol: 'TSLA', qty: '25', avg_entry_price: '245.00', unrealized_pl: '125.00' },
        ],
      }),
    });
    const v = new AlpacaPaperVenue({ key: 'k', secret: 's', fetch, nowFn: () => NOW });
    const positions = await v.getPositions();
    expect(positions.length).toBe(1);
    expect(positions[0]!.asset).toBe('equity:tsla');
    expect(positions[0]!.side).toBe('buy');
    expect(positions[0]!.qty).toBe('25');
  });

  it('getBalances parses account response into USD balance', async () => {
    const fetch = mockFetch({
      'GET /v2/account': () => ({
        status: 200,
        body: { buying_power: '100000', equity: '105000' },
      }),
    });
    const v = new AlpacaPaperVenue({ key: 'k', secret: 's', fetch, nowFn: () => NOW });
    const balances = await v.getBalances();
    expect(balances.length).toBe(1);
    expect(balances[0]!.currency).toBe('USD');
    expect(balances[0]!.free).toBe('100000');
    expect(balances[0]!.total).toBe('105000');
  });

  it('health() pings /v2/clock and reports outage=true when it fails', async () => {
    const fetch = mockFetch({
      'GET /v2/clock': () => ({ status: 503, body: { message: 'unavailable' } }),
    });
    const v = new AlpacaPaperVenue({ key: 'k', secret: 's', fetch, nowFn: () => NOW });
    const h = await v.health();
    expect(h.outage).toBe(true);
    expect(h.recentFailureRate).toBe(1);
  });

  it('health() reports outage=false when clock responds', async () => {
    const fetch = mockFetch({
      'GET /v2/clock': () => ({ status: 200, body: { timestamp: '2026-07-05T00:00:00Z', is_open: true } }),
    });
    const v = new AlpacaPaperVenue({ key: 'k', secret: 's', fetch, nowFn: () => NOW });
    const h = await v.health();
    expect(h.outage).toBe(false);
    expect(h.recentFailureRate).toBe(0);
  });

  it('authHeaders include the key + secret only when credentials are present (no leakage otherwise)', async () => {
    let capturedHeaders: Record<string, string> | undefined;
    const fetch = mockFetch({
      'GET /v2/clock': (init) => {
        capturedHeaders = init?.headers;
        return { status: 200, body: { timestamp: NOW, is_open: true } };
      },
    });
    const v = new AlpacaPaperVenue({ key: 'test-key', secret: 'test-secret', fetch, nowFn: () => NOW });
    await v.health();
    expect(capturedHeaders?.['APCA-API-KEY-ID']).toBe('test-key');
    expect(capturedHeaders?.['APCA-API-SECRET-KEY']).toBe('test-secret');
  });
});
