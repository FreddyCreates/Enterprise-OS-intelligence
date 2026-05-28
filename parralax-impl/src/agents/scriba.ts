/**
 * SCRIBA — trade receipt indexer (stub).
 *
 * See parralax-aihftfund/PLAN.md § 3. Reuses the journal council name;
 * here SCRIBA indexes every trade-related CHRONO entry into the audit
 * read surface that powers operator dashboards and external compliance
 * exports.
 */

import { BaseAgent } from './base.js';

export class ScribaAgent extends BaseAgent {
  protected async onBeat(): Promise<void> {
    // Behaviour deferred to a later commit. Doctrine honoured by base class.
  }
}
