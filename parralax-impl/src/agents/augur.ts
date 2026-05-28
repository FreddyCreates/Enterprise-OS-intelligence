/**
 * AUGUR — signal diviner (stub).
 *
 * See parralax-aihftfund/PLAN.md § 3 for this agent's role.
 * Generates entry/exit signals with confidence scores. PROPHET is the
 * prediction-market mandate variant (see PREDICTION_MARKETS_CHARTER § 4).
 */

import { BaseAgent } from './base.js';

export class AugurAgent extends BaseAgent {
  protected async onBeat(): Promise<void> {
    // Behaviour deferred to a later commit. Doctrine honoured by base class.
  }
}
