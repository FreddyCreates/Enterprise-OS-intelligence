/**
 * VENDITOR — venue executor (stub).
 *
 * See parralax-aihftfund/PLAN.md § 3. The concrete venue-side adapter that
 * speaks to a specific exchange / broker / DEX. A new VENDITOR subclass per
 * venue; paper VENDITOR is the deterministic in-process implementation.
 */

import { BaseAgent } from './base.js';

export class VenditorAgent extends BaseAgent {
  protected async onBeat(): Promise<void> {
    // Behaviour deferred to a later commit. Doctrine honoured by base class.
  }
}
