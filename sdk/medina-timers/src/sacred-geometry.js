export const PHI = 1.618033988749895;
export const GOLDEN_ANGLE = 2.399963229728653;

export class SacredGeometryTimer {
  constructor({ baseMs = 873 } = {}) {
    this.baseMs = baseMs;
    this.beat = 0;
  }

  tick() {
    this.beat += 1;
    const theta = this.beat * GOLDEN_ANGLE;
    const rho = Math.sqrt(this.beat) * PHI;
    return {
      beat: this.beat,
      theta: Number(theta.toFixed(6)),
      phi: Number((theta / PHI).toFixed(6)),
      rho: Number(rho.toFixed(6)),
      delayMs: Math.round(this.baseMs * (1 + (Math.sin(theta) * 0.1))),
    };
  }
}

export function createSacredGeometryTimer(config = {}) {
  return new SacredGeometryTimer(config);
}
