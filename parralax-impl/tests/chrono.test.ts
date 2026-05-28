import { describe, it, expect } from 'vitest';
import {
  ChronoWriter,
  InMemoryChronoStore,
  TestSigner,
  verifyChain,
} from '../src/chrono/receipt.js';
import { ReceiptClass } from '../src/types/chrono.js';
import type { PrincipalId, VoxisId } from '../src/types/common.js';

describe('CHRONO — receipt chain', () => {
  it('links entries via priorHash → selfHash', async () => {
    const store  = new InMemoryChronoStore();
    const signer = new TestSigner('test-signer' as PrincipalId);
    const writer = new ChronoWriter(store, signer);
    const chain  = 'test-chain';

    const e1 = await writer.write({
      chainId: chain,
      receiptClass: ReceiptClass.ActionAuthorised,
      voxisId: 'v1' as VoxisId,
      payload: { n: 1 },
    });
    const e2 = await writer.write({
      chainId: chain,
      receiptClass: ReceiptClass.ActionAuthorised,
      voxisId: 'v1' as VoxisId,
      payload: { n: 2 },
    });
    const e3 = await writer.write({
      chainId: chain,
      receiptClass: ReceiptClass.GateCapital,
      voxisId: 'v1' as VoxisId,
      payload: { n: 3 },
    });

    expect(e2.priorHash).toBe(e1.selfHash);
    expect(e3.priorHash).toBe(e2.selfHash);
  });

  it('rejects an append whose priorHash does not match latest', async () => {
    const store  = new InMemoryChronoStore();
    const signer = new TestSigner('test-signer' as PrincipalId);
    const writer = new ChronoWriter(store, signer);
    const chain  = 'fork-test';

    await writer.write({
      chainId: chain, receiptClass: ReceiptClass.ActionAuthorised,
      voxisId: null, payload: { n: 1 },
    });

    // Forge an entry with a wrong priorHash.
    await expect(
      store.append({
        entryId: 'BAD-0001',
        chainId: chain,
        receiptClass: ReceiptClass.ActionAuthorised,
        writtenAt: new Date().toISOString() as unknown as never,
        writtenBy: 'attacker' as PrincipalId,
        voxisId: null,
        priorHash: ('f'.repeat(64) as unknown as never),
        payload: {},
        signature: ('0'.repeat(64) as unknown as never),
        selfHash:  ('0'.repeat(64) as unknown as never),
      }),
    ).rejects.toThrow(/priorHash mismatch/);
  });

  it('verifyChain detects a broken link', async () => {
    const store  = new InMemoryChronoStore();
    const signer = new TestSigner('test-signer' as PrincipalId);
    const writer = new ChronoWriter(store, signer);
    const chain  = 'integrity-test';

    await writer.write({ chainId: chain, receiptClass: ReceiptClass.GateCapital,    voxisId: null, payload: { i: 0 } });
    await writer.write({ chainId: chain, receiptClass: ReceiptClass.GateExposure,   voxisId: null, payload: { i: 1 } });
    await writer.write({ chainId: chain, receiptClass: ReceiptClass.GateLeverage,   voxisId: null, payload: { i: 2 } });

    const entries = store.all(chain);
    expect(verifyChain(entries)).toEqual({ ok: true, brokenAt: null });

    // Tamper with an entry's payload (without recomputing selfHash).
    const tampered = entries.map((e, idx) =>
      idx === 1 ? ({ ...e, payload: { i: 999 } }) : e
    );
    const result = verifyChain(tampered);
    expect(result.ok).toBe(false);
    expect(result.brokenAt).toBe(1);
  });
});
