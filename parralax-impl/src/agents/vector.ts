/**
 * VECTOR — execution carrier (stub).
 *
 * See parralax-aihftfund/PLAN.md § 3. Maps a trade through venues; carries
 * the trace from claim to consequence. Reuses the existing ORO agent name.
 */

import { BaseAgent } from './base.js';

export class VectorAgent extends BaseAgent {
  protected async onBeat(): Promise<void> {
    // Behaviour deferred to a later commit. Doctrine honoured by base class.
  }
}
