/**
 * BLUNT Tools — Direct utility toolpack on top of TRADEX ToolForge
 * RSHIP ID: RSHIP-2026-BLUNT-001
 */

import TRADEXToolForge from '../tradex-toolforge/tradex-toolforge.js';

export class BLUNTTools {
  static RSHIP_ID = 'RSHIP-2026-BLUNT-001';
  static VERSION = '1.0.0';

  constructor(config = {}) {
    this.config = {
      mode: 'direct-utility',
      ...config,
    };

    this.forge = new TRADEXToolForge(config.toolForge || {});
    this.bluntLedger = [];
  }

  register(name, executor, metadata = {}) {
    return this.forge.registerBluntTool(name, executor, {
      product: 'BLUNT',
      ...metadata,
    });
  }

  async run(name, payload = {}, context = {}) {
    const result = await this.forge.runTool(name, payload, context);
    this.bluntLedger.push({ ts: Date.now(), name, result });
    return result;
  }

  status() {
    return {
      rshipId: BLUNTTools.RSHIP_ID,
      version: BLUNTTools.VERSION,
      entries: this.bluntLedger.length,
      forge: this.forge.status(),
      config: this.config,
    };
  }
}

export default BLUNTTools;
