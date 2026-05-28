import { describe, it, expect } from 'vitest';
import {
  PlaceholderVerifier,
  computeBlockHash,
  readDoctrine,
} from '../src/voxis/authority.js';
import {
  Level,
  Capability,
  DEFAULT_GRANTS,
} from '../src/types/voxis.js';
import type { VoxisAuthority } from '../src/types/voxis.js';
import type {
  VoxisId,
  MandateId,
  PrincipalId,
  Iso8601,
  DecimalUsd,
  Signature,
} from '../src/types/common.js';
import { RiskTier } from '../src/types/common.js';
import { createHash } from 'node:crypto';

function makeSignedAuthority(
  overrides: Partial<VoxisAuthority> = {},
  pepper = 'parralax-placeholder-pepper',
): VoxisAuthority {
  const base = {
    voxisId:    'voxis-test-001' as VoxisId,
    level:      Level.Observer,
    mandateId:  'mandate-test-001' as MandateId,
    capabilities: DEFAULT_GRANTS[Level.Observer],
    walletScope: {
      fiatAccounts:  [],
      cryptoWallets: [],
      exchangeKeys:  [],
      internalUnits: [],
    },
    capitalLimitsUsd: {
      perOrderMax:  '0' as DecimalUsd,
      perDayMax:    '0' as DecimalUsd,
      perAssetMax:  '0' as DecimalUsd,
      aggregateMax: '0' as DecimalUsd,
    },
    positionLimits: { maxConcurrentOpen: 0, maxLeverage: 1.0 },
    riskTier:        RiskTier.Strict,
    killSwitchGroup: 'test',
    audit: { chronoChainId: 'test-chain', parentVoxisId: null },
    promotion: {
      issuedAt:    '2026-05-28T00:00:00.000Z' as Iso8601,
      issuedBy:    'operator' as PrincipalId,
      expiresAt:   null,
      revocableBy: ['operator' as PrincipalId],
    },
    ...overrides,
  };

  const blockHash = computeBlockHash(base);
  const signature = createHash('sha256').update(blockHash + pepper).digest('hex') as Signature;
  return { ...base, blockHash, signature };
}

describe('VoxisAuthority — the doctrine block', () => {
  it('accepts a well-formed signed block and returns a frozen copy', async () => {
    const auth = makeSignedAuthority();
    const result = await readDoctrine(auth, new PlaceholderVerifier());

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(Object.isFrozen(result.authority)).toBe(true);
      expect(result.authority.voxisId).toBe('voxis-test-001');
      expect(result.authority.level).toBe(Level.Observer);
    }
  });

  it('rejects a block whose signature is invalid', async () => {
    const auth = makeSignedAuthority();
    const tampered = { ...auth, signature: ('0' + auth.signature.slice(1)) as Signature };
    const result = await readDoctrine(tampered, new PlaceholderVerifier());

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/signature/);
  });

  it('rejects a block whose blockHash does not match its contents', async () => {
    const auth = makeSignedAuthority();
    // Tamper with the level (would silently elevate authority if accepted).
    const tampered: VoxisAuthority = { ...auth, level: Level.RestrictedSovereign };
    const result = await readDoctrine(tampered, new PlaceholderVerifier());

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/blockHash|tampered/);
  });

  it('cannot have its capabilities mutated after freezing', async () => {
    const auth = makeSignedAuthority();
    const result = await readDoctrine(auth, new PlaceholderVerifier());
    if (!result.ok) throw new Error('precondition failed');

    expect(() => {
      // @ts-expect-error - intentional mutation attempt
      result.authority.capabilities.push(Capability.OrderPlaceLive);
    }).toThrow();
  });

  it('default Observer grants do NOT include any execution capability', () => {
    const grants = DEFAULT_GRANTS[Level.Observer];
    expect(grants).not.toContain(Capability.OrderPlaceLive);
    expect(grants).not.toContain(Capability.PaperOrderPlace);
    expect(grants).not.toContain(Capability.ProposalSubmit);
    expect(grants).not.toContain(Capability.KillTrip);
    expect(grants).not.toContain(Capability.ChildSpawn);
    expect(grants).not.toContain(Capability.CapitalReallocate);
  });

  it('default Restricted Sovereign grants are monotonically additive over Observer', () => {
    const observer = new Set(DEFAULT_GRANTS[Level.Observer]);
    const sovereign = new Set(DEFAULT_GRANTS[Level.RestrictedSovereign]);
    for (const cap of observer) expect(sovereign.has(cap)).toBe(true);
  });

  it('no capability ever exists that resets a kill switch or raises a level', () => {
    const all = Object.values(Capability);
    expect(all).not.toContain('kill:reset');
    expect(all).not.toContain('level:raise');
    expect(all).not.toContain('mandate:edit');
    expect(all).not.toContain('withdraw');
  });
});
