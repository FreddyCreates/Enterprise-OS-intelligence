/**
 * Common shared types — the primitives used everywhere.
 *
 * Per the doctrine: there are no implicit any types, no string-as-everything,
 * no number-as-USD. The type system is the first wall against confusion.
 */

/** A ULID — Crockford base32, 26 chars, monotonic per ms. */
export type Ulid = string & { readonly __brand: 'Ulid' };

/** A SHA-256 hex digest. 64 chars, lowercase. */
export type Sha256 = string & { readonly __brand: 'Sha256' };

/** An ISO-8601 UTC timestamp string. */
export type Iso8601 = string & { readonly __brand: 'Iso8601' };

/**
 * A signing principal identifier. Could be an operator, a council member,
 * or a named autonomous source (e.g. 'auto:custos.engine').
 */
export type PrincipalId = string & { readonly __brand: 'PrincipalId' };

/** An ed25519 (or equivalent) signature, hex-encoded. */
export type Signature = string & { readonly __brand: 'Signature' };

/** A VOXIS instance identifier. */
export type VoxisId = string & { readonly __brand: 'VoxisId' };

/** A mandate identifier — what authorises a VOXIS. */
export type MandateId = string & { readonly __brand: 'MandateId' };

/** A strategy identifier. */
export type StrategyId = string & { readonly __brand: 'StrategyId' };

/** A canonical asset identifier, e.g. 'crypto:btc' or 'equity:tsla'. */
export type AssetId = string & { readonly __brand: 'AssetId' };

/** A venue identifier, e.g. 'alpaca-paper' or 'binance-spot'. */
export type VenueId = string & { readonly __brand: 'VenueId' };

/** A USD-equivalent amount, expressed as a decimal string (never a float). */
export type DecimalUsd = string & { readonly __brand: 'DecimalUsd' };

/** A basis-points value (1 bp = 0.01%). */
export type Bps = number & { readonly __brand: 'Bps' };

/** Asset family — must match ASSET_SCOPE_CHARTER.md § 1. */
export const AssetFamily = {
  CryptoSpot:        'crypto-spot',
  Stablecoin:        'stablecoin',
  Fiat:              'fiat',
  Equity:            'equity',
  AiTokenExternal:   'ai-token-external',
  Nft:               'nft',
  PredictionMarket:  'prediction-market',
  InternalUnit:      'internal-unit',
  InternalPxToken:   'internal-px-token',
} as const;
export type AssetFamily = typeof AssetFamily[keyof typeof AssetFamily];

/** Risk tier — see RISK_CHARTER.md § 6. */
export const RiskTier = {
  Strict:   'STRICT',
  Standard: 'STANDARD',
  Wide:     'WIDE',
} as const;
export type RiskTier = typeof RiskTier[keyof typeof RiskTier];

/** Helpers — runtime construction of branded primitives. */

export function asUlid(s: string): Ulid {
  if (!/^[0-9A-HJKMNP-TV-Z]{26}$/.test(s)) {
    throw new Error(`Invalid ULID: ${s}`);
  }
  return s as Ulid;
}

export function asSha256(s: string): Sha256 {
  if (!/^[0-9a-f]{64}$/.test(s)) {
    throw new Error(`Invalid SHA-256 hex: ${s}`);
  }
  return s as Sha256;
}

export function asIso8601(s: string): Iso8601 {
  const d = new Date(s);
  if (Number.isNaN(d.getTime()) || d.toISOString() !== s) {
    throw new Error(`Invalid ISO-8601: ${s}`);
  }
  return s as Iso8601;
}

export function nowIso(): Iso8601 {
  return new Date().toISOString() as Iso8601;
}
