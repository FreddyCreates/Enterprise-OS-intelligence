/**
 * @medina/parralax-aihftfund — public exports.
 *
 * The implementation scaffold's surface area. Each export honours one of the
 * charter documents at /parralax-aihftfund/.
 */

// ── Types ──
export * from './types/common.js';
export * from './types/voxis.js';
export * from './types/chrono.js';
export * from './types/market.js';

// ── VOXIS (Authority Charter) ──
export {
  PlaceholderVerifier,
  computeBlockHash,
  readDoctrine,
} from './voxis/authority.js';
export type { SignatureVerifier } from './voxis/authority.js';

// ── CHRONO (audit substrate) ──
export {
  ChronoWriter,
  InMemoryChronoStore,
  TestSigner,
  verifyChain,
} from './chrono/receipt.js';
export type { ChronoStore, ChronoSigner, WriteParams } from './chrono/receipt.js';

// ── CUSTOS (Risk Charter) ──
export * from './custos/gates.js';

// ── KILL SWITCH (Kill Switch Doctrine) ──
export * from './killswitch/state.js';
