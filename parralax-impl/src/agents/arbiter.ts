/**
 * ARBITER — settlement / sealing (stub).
 *
 * See parralax-aihftfund/PLAN.md § 3. Reuses the journal council name;
 * here ARBITER runs end-of-period sealing, dispute resolution, and emits
 * the periodic build-manifest equivalent (a session manifest hashing every
 * trade and every gate evaluation since the prior seal).
 */

import { BaseAgent } from './base.js';

export class ArbiterAgent extends BaseAgent {
  protected async onBeat(): Promise<void> {
    // Behaviour deferred to a later commit. Doctrine honoured by base class.
  }
}
