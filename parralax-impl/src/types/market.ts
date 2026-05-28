/**
 * Market types — quotes, orders, fills.
 *
 * All numeric prices and sizes use decimal-string representation so we never
 * accidentally hit float-rounding in capital-bearing calculations.
 */

import type { AssetId, VenueId, Iso8601, DecimalUsd } from './common.js';

export type Side = 'buy' | 'sell';

export type OrderType =
  | 'market'
  | 'limit'
  | 'stop'
  | 'stop-limit'
  | 'reduce-only';

export type TimeInForce =
  | 'gtc'   // good till cancelled
  | 'ioc'   // immediate or cancel
  | 'fok'   // fill or kill
  | 'day';

export type DecimalString = string;   // decimal numeric, never float

export interface Quote {
  readonly venue:     VenueId;
  readonly asset:     AssetId;
  readonly bid:       DecimalString;
  readonly ask:       DecimalString;
  readonly bidSize:   DecimalString;
  readonly askSize:   DecimalString;
  readonly observedAt: Iso8601;
}

export interface OrderBookLevel {
  readonly price: DecimalString;
  readonly size:  DecimalString;
}

export interface OrderBook {
  readonly venue:      VenueId;
  readonly asset:      AssetId;
  readonly bids:       ReadonlyArray<OrderBookLevel>;   // sorted high-to-low
  readonly asks:       ReadonlyArray<OrderBookLevel>;   // sorted low-to-high
  readonly observedAt: Iso8601;
}

export interface OrderRequest {
  readonly requestId:    string;            // ULID
  readonly venue:        VenueId;
  readonly asset:        AssetId;
  readonly side:         Side;
  readonly type:         OrderType;
  readonly size:         DecimalString;
  readonly limitPrice?:  DecimalString;
  readonly stopPrice?:   DecimalString;
  readonly timeInForce:  TimeInForce;
  readonly notionalUsd:  DecimalUsd;        // pre-computed; gated by CUSTOS
  readonly intendedAt:   Iso8601;
}

export interface Fill {
  readonly fillId:      string;             // ULID
  readonly orderId:     string;
  readonly venue:       VenueId;
  readonly asset:       AssetId;
  readonly side:        Side;
  readonly size:        DecimalString;
  readonly price:       DecimalString;
  readonly feesUsd:     DecimalUsd;
  readonly filledAt:    Iso8601;
  readonly venueTxRef:  string;             // venue-side reference (order id, tx hash, etc.)
}
