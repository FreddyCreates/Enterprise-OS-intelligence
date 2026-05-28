/**
 * CHRONO receipt writer.
 *
 * Every action writes a receipt. The writer enforces:
 *   - selfHash is computed and embedded.
 *   - priorHash links to the prior entry (or GENESIS_HASH).
 *   - the entry is signed by the writer.
 *
 * Backend is pluggable — the writer takes a `ChronoStore` implementation
 * which can be SQLite, D1, or the ICP Public Gateway canister.
 *
 * This module focuses on correctness of the chain. Persistence semantics
 * (durability, consistency) are the store's responsibility.
 */

import { createHash, randomBytes } from 'node:crypto';
import type {
  ChronoEntry,
  ReceiptClass,
} from '../types/chrono.js';
import { GENESIS_HASH } from '../types/chrono.js';
import type {
  Sha256,
  PrincipalId,
  Signature,
  VoxisId,
} from '../types/common.js';
import { nowIso } from '../types/common.js';

export interface ChronoStore {
  /** Returns the latest entry on the given chain, or null if empty. */
  latest(chainId: string): Promise<ChronoEntry | null>;
  /** Appends a fully-formed entry; rejects if priorHash does not match latest. */
  append(entry: ChronoEntry): Promise<void>;
}

export interface ChronoSigner {
  /** Returns the principal that this signer signs as. */
  principal(): PrincipalId;
  /** Signs the given selfHash and returns the signature. */
  sign(selfHash: Sha256): Promise<Signature>;
}

export interface WriteParams<P extends Record<string, unknown> = Record<string, unknown>> {
  readonly chainId:      string;
  readonly receiptClass: ReceiptClass;
  readonly voxisId:      VoxisId | null;
  readonly payload:      P;
}

export class ChronoWriter {
  constructor(
    private readonly store:  ChronoStore,
    private readonly signer: ChronoSigner,
  ) {}

  /** Write a new entry. Returns the entry as appended. */
  async write<P extends Record<string, unknown>>(
    params: WriteParams<P>,
  ): Promise<ChronoEntry<P>> {
    const prior     = await this.store.latest(params.chainId);
    const priorHash = prior ? prior.selfHash : GENESIS_HASH;

    const entryBase = {
      entryId:      ulid(),
      chainId:      params.chainId,
      receiptClass: params.receiptClass,
      writtenAt:    nowIso(),
      writtenBy:    this.signer.principal(),
      voxisId:      params.voxisId,
      priorHash,
      payload:      params.payload,
    };

    const selfHash  = computeSelfHash(entryBase);
    const signature = await this.signer.sign(selfHash);

    const entry: ChronoEntry<P> = {
      ...entryBase,
      signature,
      selfHash,
    };

    await this.store.append(entry as ChronoEntry);
    return entry;
  }
}

/** Compute SHA-256 over the canonical JSON of an entry (sans signature + selfHash). */
function computeSelfHash<P extends Record<string, unknown>>(
  base: Omit<ChronoEntry<P>, 'signature' | 'selfHash'>,
): Sha256 {
  const canonical = canonicalJson(base);
  return createHash('sha256').update(canonical).digest('hex') as Sha256;
}

/** Verify that a chain is intact end-to-end. */
export function verifyChain(entries: ReadonlyArray<ChronoEntry>): {
  readonly ok: boolean;
  readonly brokenAt: number | null;
} {
  let prev: Sha256 = GENESIS_HASH;
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i]!;
    if (e.priorHash !== prev) return { ok: false, brokenAt: i };
    const expectedSelf = computeSelfHash({
      entryId:      e.entryId,
      chainId:      e.chainId,
      receiptClass: e.receiptClass,
      writtenAt:    e.writtenAt,
      writtenBy:    e.writtenBy,
      voxisId:      e.voxisId,
      priorHash:    e.priorHash,
      payload:      e.payload,
    });
    if (expectedSelf !== e.selfHash) return { ok: false, brokenAt: i };
    prev = e.selfHash;
  }
  return { ok: true, brokenAt: null };
}

/** In-memory ChronoStore for tests. */
export class InMemoryChronoStore implements ChronoStore {
  private readonly chains = new Map<string, ChronoEntry[]>();

  async latest(chainId: string): Promise<ChronoEntry | null> {
    const list = this.chains.get(chainId) ?? [];
    return list.length > 0 ? list[list.length - 1]! : null;
  }

  async append(entry: ChronoEntry): Promise<void> {
    const list = this.chains.get(entry.chainId) ?? [];
    const last = list.length > 0 ? list[list.length - 1]! : null;
    const expectedPrior = last ? last.selfHash : GENESIS_HASH;
    if (entry.priorHash !== expectedPrior) {
      throw new Error(
        `chrono.append: priorHash mismatch on chain ${entry.chainId}: ` +
        `expected ${expectedPrior}, got ${entry.priorHash}`,
      );
    }
    list.push(entry);
    this.chains.set(entry.chainId, list);
  }

  /** Test helper: read all entries on a chain. */
  all(chainId: string): ReadonlyArray<ChronoEntry> {
    return Object.freeze([...(this.chains.get(chainId) ?? [])]);
  }
}

/** Test signer that produces deterministic placeholder signatures. */
export class TestSigner implements ChronoSigner {
  constructor(private readonly id: PrincipalId) {}
  principal(): PrincipalId { return this.id; }
  async sign(selfHash: Sha256): Promise<Signature> {
    // Placeholder: sig is sha256(selfHash + ':' + principal).
    return createHash('sha256').update(selfHash + ':' + this.id).digest('hex') as Signature;
  }
}

// ── helpers ──

function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return '[' + value.map(canonicalJson).join(',') + ']';
  const keys = Object.keys(value).sort();
  return '{' + keys.map((k) => JSON.stringify(k) + ':' + canonicalJson((value as Record<string, unknown>)[k])).join(',') + '}';
}

// ULID-ish generator — monotonic per ms, 26 chars Crockford base32.
const CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
let lastMs = 0;
let lastRand: bigint = 0n;
function ulid(): string {
  let ms = Date.now();
  let rand: bigint;
  if (ms === lastMs) {
    lastRand = lastRand + 1n;
    rand = lastRand;
  } else {
    lastMs = ms;
    const buf = randomBytes(10);
    rand = 0n;
    for (const b of buf) rand = (rand << 8n) | BigInt(b);
    lastRand = rand;
  }
  // 10 chars for ms, 16 chars for rand
  const msPart = base32(BigInt(ms), 10);
  const rdPart = base32(rand,         16);
  return msPart + rdPart;
}
function base32(n: bigint, len: number): string {
  let s = '';
  for (let i = 0; i < len; i++) {
    s = CROCKFORD[Number(n & 0x1fn)]! + s;
    n >>= 5n;
  }
  return s;
}
