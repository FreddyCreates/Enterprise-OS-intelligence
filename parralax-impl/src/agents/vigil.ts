/**
 * VIGIL — market observer (stub).
 *
 * See parralax-aihftfund/PLAN.md § 3 for this agent's role.
 * Read price action, volatility, liquidity, order books, on-chain flows.
 * Default authority: Level 0 (Observer). No capability to act.
 */

import { BaseAgent } from './base.js';

export class VigilAgent extends BaseAgent {
  protected async onBeat(): Promise<void> {
    // Behaviour deferred to a later commit. Doctrine honoured by base class.
  }
}
