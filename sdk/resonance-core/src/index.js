const PHI = 1.618033988749895;
const PHI_INV = 1 / PHI;
const HEARTBEAT_MS = 873;

function average(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

export class PhiOscillator {
  constructor({ frequency = PHI_INV } = {}) {
    this.frequency = frequency;
    this.phase = 0;
  }

  tick(dt = HEARTBEAT_MS / 1000) {
    this.phase += this.frequency * dt;
    return this.phase;
  }
}

export class KuramotoCoupler {
  constructor(phases = [0, 1, 2], coupling = PHI) {
    this.phases = [...phases];
    this.coupling = coupling;
  }

  step(dt = HEARTBEAT_MS / 1000) {
    const n = this.phases.length;
    this.phases = this.phases.map((thetaI, i) => {
      const interaction = this.phases.reduce((sum, thetaJ) => sum + Math.sin(thetaJ - thetaI), 0);
      return thetaI + ((this.coupling / n) * interaction * dt);
    });
    return [...this.phases];
  }

  order() {
    const re = average(this.phases.map((value) => Math.cos(value)));
    const im = average(this.phases.map((value) => Math.sin(value)));
    return Math.sqrt(re * re + im * im);
  }
}

export class PhaseLock {
  lock(phases = [], target = 0) {
    return phases.map((phase) => phase + PHI_INV * (target - phase));
  }
}

export class FrequencyAligner {
  align(frequencies = []) {
    const anchor = average(frequencies);
    return frequencies.map((value, index) => Number((anchor * (PHI ** (index * 0.05))).toFixed(6)));
  }
}

export class HarmonicField {
  constructor() {
    this.resonances = [];
  }

  deposit(value) {
    this.resonances.push(value);
    if (this.resonances.length > 128) this.resonances.shift();
    return this.intensity();
  }

  intensity() {
    return Number(average(this.resonances).toFixed(6));
  }
}

export class ResonanceCore {
  constructor({ nodeCount = 4 } = {}) {
    this.oscillator = new PhiOscillator();
    this.coupler = new KuramotoCoupler(Array.from({ length: nodeCount }, (_, index) => index), PHI);
    this.phaseLock = new PhaseLock();
    this.aligner = new FrequencyAligner();
    this.field = new HarmonicField();
    this.beat = 0;
  }

  tick() {
    const masterPhase = this.oscillator.tick();
    const phases = this.coupler.step();
    const locked = this.phaseLock.lock(phases, masterPhase);
    const aligned = this.aligner.align(locked.map((phase) => Math.abs(phase) + PHI_INV));
    this.field.deposit(this.coupler.order());
    this.beat += 1;
    return {
      beat: this.beat,
      heartbeatMs: HEARTBEAT_MS,
      orderParameter: Number(this.coupler.order().toFixed(6)),
      harmonicIntensity: this.field.intensity(),
      alignedFrequencies: aligned,
    };
  }
}

export { HEARTBEAT_MS, PHI, PHI_INV };

export default {
  FrequencyAligner,
  HarmonicField,
  HEARTBEAT_MS,
  KuramotoCoupler,
  PHI,
  PHI_INV,
  PhaseLock,
  PhiOscillator,
  ResonanceCore,
};
