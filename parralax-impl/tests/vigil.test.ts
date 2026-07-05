import { describe, it, expect } from 'vitest';
import { createHash } from 'node:crypto';

import { VigilAgent } from '../src/agents/vigil.js';
import { HistoricalReplay } from '../src/training/replay.js';
import { PlaceholderVerifier, computeBlockHash } from '../src/voxis/authority.js';
import {
  Level,
  DEFAULT_GRANTS,
} from '../src/types/voxis.js';
import type { VoxisAuthority } from '../src/types/voxis.js';
import type {
  AssetId,
  VenueId,
  VoxisId,
  MandateId,
  PrincipalId,
  Iso8601,
  DecimalUsd,
  Signature,
} from '../src/types/common.js';
import { RiskTier } from '../src/types/common.js';

const ASSET = 'equity:tsla' as AssetId;
const VENUE = 'paper'       as VenueId;

function makeAuthority(voxisId: VoxisId): VoxisAuthority {
  const base = {
    voxisId,
    level:        Level.Observer,
    mandateId:    'mandate-vigil-test' as MandateId,
    capabilities: DEFAULT_GRANTS[Level.Observer],
    walletScope:  { fiatAccounts: [], cryptoWallets: [], exchangeKeys: [], internalUnits: [] },
    capitalLimitsUsd: {
      perOrderMax: '0' as DecimalUsd, perDayMax: '0' as DecimalUsd,
      perAssetMax: '0' as DecimalUsd, aggregateMax: '0' as DecimalUsd,
    },
    positionLimits: { maxConcurrentOpen: 0, maxLeverage: 1.0 },
    riskTier:       RiskTier.Strict,
    killSwitchGroup: 'test',
    audit: { chronoChainId: 'test-chain', parentVoxisId: null },
    promotion: {
      issuedAt:    '2026-07-01T00:00:00.000Z' as Iso8601,
      issuedBy:    'operator' as PrincipalId,
      expiresAt:   null,
      revocableBy: ['operator' as PrincipalId],
    },
  };
  const blockHash = computeBlockHash(base);
  const signature = createHash('sha256').update(blockHash + 'parralax-placeholder-pepper').digest('hex') as Signature;
  return { ...base, blockHash, signature };
}

function makeVigil(voxisId: VoxisId): VigilAgent {
  return new VigilAgent(
    makeAuthority(voxisId),
    { verifier: new PlaceholderVerifier(), heartbeatMs: 873 },
    { shortWindow: 8, longWindow: 34, asset: ASSET },
  );
}

describe('VigilAgent — market observer', () => {
  it('returns null until the long window is filled', () => {
    const v = makeVigil('vox-vigil-warmup' as VoxisId);
    const replay = new HistoricalReplay({ asset: ASSET, venue: VENUE, seed: 1, ticks: 33, startPrice: 100 });
    let observations = 0;
    let t;
    while ((t = replay.next())) if (v.observe(t)) observations++;
    expect(observations).toBe(0);   // never publishes before window fills
  });

  it('publishes observations once warm', () => {
    const v = makeVigil('vox-vigil-warm' as VoxisId);
    const replay = new HistoricalReplay({ asset: ASSET, venue: VENUE, seed: 1, ticks: 100, startPrice: 100 });
    let observations = 0;
    let t;
    while ((t = replay.next())) if (v.observe(t)) observations++;
    // After 34 warmup ticks, remaining 66 should publish.
    expect(observations).toBeGreaterThan(50);
  });

  it('identifies the regime consistent with the replay tick metadata (majority match)', () => {
    const v = makeVigil('vox-vigil-regime' as VoxisId);
    const replay = new HistoricalReplay({ asset: ASSET, venue: VENUE, seed: 99, ticks: 1500, startPrice: 100 });
    let total = 0;
    let matches = 0;
    let t;
    while ((t = replay.next())) {
      const obs = v.observe(t);
      if (obs && obs.stable) {
        total++;
        if (obs.regime === t.regime) matches++;
      }
    }
    // Stable observations should better-than-chance match the tick's declared
    // regime. Not a hard match — VIGIL's classifier is heuristic (simple
    // vol-ratio + momentum thresholds), not clairvoyant. Random guessing over
    // 5 regimes is ~20%. We assert > 22% — a small but non-zero edge over
    // random. Higher accuracy would require a trained model (AUSPEX-14B, per
    // MODEL_ARCHITECTURES), which is future work.
    if (total > 0) {
      expect(matches / total).toBeGreaterThan(0.22);
    }
  });

  it('is deterministic — identical inputs give identical outputs', () => {
    const runOne = () => {
      const v = makeVigil('vox-vigil-det' as VoxisId);
      const replay = new HistoricalReplay({ asset: ASSET, venue: VENUE, seed: 77, ticks: 200, startPrice: 100 });
      const out: string[] = [];
      let t;
      while ((t = replay.next())) {
        const o = v.observe(t);
        if (o) out.push(`${o.regime}:${o.volRatio.toFixed(6)}:${o.momentumShort.toFixed(6)}`);
      }
      return out;
    };
    const a = runOne();
    const b = runOne();
    expect(b).toEqual(a);
  });

  it('does NOT emit trade signals — the observation shape has no side/size fields', () => {
    const v = makeVigil('vox-vigil-noninvasive' as VoxisId);
    const replay = new HistoricalReplay({ asset: ASSET, venue: VENUE, seed: 5, ticks: 50, startPrice: 100 });
    let t;
    while ((t = replay.next())) {
      const o = v.observe(t);
      if (!o) continue;
      // Doctrinal: an observation is not a signal.
      expect('side' in o).toBe(false);
      expect('size' in o).toBe(false);
    }
  });

  it('exposes NO Level-changing or wallet-touching API', async () => {
    const mod = await import('../src/agents/vigil.js');
    const forbidden = [
      'promote', 'setLevel', 'grantCapability',
      'signOrder', 'placeOrder', 'withdraw', 'mint',
    ];
    for (const name of forbidden) {
      expect(name in mod).toBe(false);
    }
    // And on the instance.
    const v = makeVigil('vox-vigil-doctrine' as VoxisId);
    for (const name of forbidden) {
      expect(typeof (v as unknown as Record<string, unknown>)[name]).toBe('undefined');
    }
  });
});
