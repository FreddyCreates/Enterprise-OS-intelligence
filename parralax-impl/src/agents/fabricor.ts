/**
 * FABRICOR — asset issuance (stub).
 *
 * See parralax-aihftfund/PLAN.md § 3. Reuses the journal council name; here
 * the artefacts are internal tokens, NFTs, and compute-receipt assets per
 * ASSET_SCOPE_CHARTER § 8 and § 11.
 */

import { BaseAgent } from './base.js';

export class FabricorAgent extends BaseAgent {
  protected async onBeat(): Promise<void> {
    // Behaviour deferred to a later commit. Doctrine honoured by base class.
  }
}
