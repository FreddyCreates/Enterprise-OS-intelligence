export const PHI = 1.618033988749895;

export const COSMIC_CYCLES = Object.freeze({
  solar: 365.25,
  lunar: 29.53,
  venus: 224.7,
  mars: 687,
});

export class CosmicCycleTimer {
  constructor({ cycle = "solar", baseMs = 873 } = {}) {
    this.cycle = COSMIC_CYCLES[cycle] ? cycle : "solar";
    this.baseMs = baseMs;
    this.tickCount = 0;
  }

  tick() {
    this.tickCount += 1;
    const period = COSMIC_CYCLES[this.cycle];
    const phase = (this.tickCount / period) * 2 * Math.PI;
    return {
      cycle: this.cycle,
      tickCount: this.tickCount,
      period,
      phase: Number(phase.toFixed(6)),
      resonance: Number((Math.cos(phase) * PHI).toFixed(6)),
      delayMs: Math.round(this.baseMs * (1 + Math.abs(Math.sin(phase)) * 0.2)),
    };
  }
}

export function createCosmicCycleTimer(config = {}) {
  return new CosmicCycleTimer(config);
}
