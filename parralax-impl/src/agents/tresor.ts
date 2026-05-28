/**
 * TRESOR — treasury (stub).
 *
 * See parralax-aihftfund/PLAN.md § 3. From Latin thesaurus (treasury).
 * Tracks capital pools, moves funds between accounts, manages stablecoin
 * balances. Owns the internal-accounting-unit schema.
 */

import { BaseAgent } from './base.js';

export class TresorAgent extends BaseAgent {
  protected async onBeat(): Promise<void> {
    // Behaviour deferred to a later commit. Doctrine honoured by base class.
  }
}
