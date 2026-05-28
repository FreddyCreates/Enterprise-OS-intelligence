/**
 * CUSTOS — risk-gate agent (stub).
 *
 * See parralax-aihftfund/RISK_CHARTER.md § 1. The agent that runs the 13
 * gates. CUSTOS is a Level-6 VOXIS that can only be replaced by the
 * operator with a hardware-signer ceremony.
 *
 * NB the file is named custos-agent.ts to avoid colliding with src/custos/
 * (the gate-engine module).
 */

import { BaseAgent } from './base.js';

export class CustosAgent extends BaseAgent {
  protected async onBeat(): Promise<void> {
    // Behaviour deferred to a later commit. The gate engine lives in
    // src/custos/engine.ts (next commit); this agent wires it into the
    // heartbeat-driven evaluation cycle.
  }
}
