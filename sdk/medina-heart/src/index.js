const PHI = 1.618033988749895;
const PHI_INV = 1 / PHI;
const DEFAULT_HEARTBEAT_MS = 873;

const CALENDAR_CYCLES = Object.freeze({
  mayan: 260,
  sumerian: 360,
  egyptian: 365,
  gregorian: 365.25,
});

function safeUnref(handle) {
  handle?.unref?.();
  return handle;
}

function now() {
  return Date.now();
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function hashString(input) {
  const text = String(input ?? "");
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = ((hash << 5) - hash + text.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function pick(list, seed) {
  return list[seed % list.length];
}

function normalizeCalendar(calendar) {
  const key = String(calendar ?? "gregorian").toLowerCase();
  return CALENDAR_CYCLES[key] ? key : "gregorian";
}

function createThought(name, context) {
  const subjects = [
    "pattern",
    "pulse",
    "memory",
    "signal",
    "decision",
    "symmetry",
    "cycle",
    "geometry",
  ];
  const verbs = [
    "stabilized",
    "emerged",
    "compounded",
    "synchronized",
    "refracted",
    "aligned",
    "accelerated",
    "clarified",
  ];
  const objects = [
    "through phi",
    "inside the field",
    "across the organism",
    "at the edge of noise",
    "within the memory ring",
    "under the sovereign clock",
    "through recurrence",
    "through accumulated traces",
  ];

  const seed = hashString(`${name}:${context}`);
  return {
    id: `thought-${seed.toString(16)}-${now().toString(36)}`,
    text: `${name} ${pick(verbs, seed)} a ${pick(subjects, Math.floor(seed / 7))} ${pick(objects, Math.floor(seed / 13))}.`,
    createdAt: new Date().toISOString(),
    context,
  };
}

export class BiologicalHeart {
  constructor({ baseMs = 1000, numHearts = 1, onBeat = null } = {}) {
    this.baseMs = Math.max(1, Number(baseMs) || 1000);
    this.numHearts = Math.max(1, Math.floor(numHearts || 1));
    this.onBeat = typeof onBeat === "function" ? onBeat : null;
    this.startedAt = now();
    this.stoppedAt = null;
    this.totalBeats = 0;
    this._active = true;
    this._timers = [];
    this._heartStates = Array.from({ length: this.numHearts }, (_, heartId) => ({
      heartId,
      intervalMs: Math.round(this.baseMs * (PHI ** heartId)),
      heartBeats: 0,
      lastBeatAt: null,
    }));

    this._start();
  }

  _start() {
    this._heartStates.forEach((heartState) => {
      const timer = safeUnref(setInterval(() => this._beat(heartState.heartId), heartState.intervalMs));
      this._timers.push(timer);
    });
  }

  _beat(heartId) {
    if (!this._active) {
      return;
    }

    const heartState = this._heartStates[heartId];
    heartState.heartBeats += 1;
    heartState.lastBeatAt = now();
    this.totalBeats += 1;

    const payload = {
      heartId,
      heartBeats: heartState.heartBeats,
      totalBeats: this.totalBeats,
      intervalMs: heartState.intervalMs,
      timestamp: heartState.lastBeatAt,
      uptime: this.getUptime(),
    };

    this.onBeat?.(payload);
  }

  getUptime() {
    return (this.stoppedAt ?? now()) - this.startedAt;
  }

  getHeartRate() {
    const seconds = Math.max(this.getUptime() / 1000, PHI_INV);
    return this.totalBeats / seconds;
  }

  getState() {
    return {
      active: this._active,
      startedAt: this.startedAt,
      uptime: this.getUptime(),
      totalBeats: this.totalBeats,
      heartRate: Number(this.getHeartRate().toFixed(4)),
      hearts: this._heartStates.map((heart) => ({ ...heart })),
    };
  }

  stop() {
    if (!this._active) {
      return this;
    }

    this._active = false;
    this.stoppedAt = now();
    this._timers.forEach((timer) => clearInterval(timer));
    this._timers = [];
    return this;
  }
}

export class AutonomousClock {
  constructor({ calendar = "gregorian", baseMs = DEFAULT_HEARTBEAT_MS, onTick = null } = {}) {
    this.calendar = normalizeCalendar(calendar);
    this.baseMs = Math.max(1, Number(baseMs) || DEFAULT_HEARTBEAT_MS);
    this.onTick = typeof onTick === "function" ? onTick : null;
    this.startedAt = now();
    this.stoppedAt = null;
    this.tickCount = 0;
    this._active = true;
    this._timer = safeUnref(setInterval(() => this._tick(), this.baseMs));
  }

  get cycleLength() {
    return CALENDAR_CYCLES[this.calendar];
  }

  _tick() {
    if (!this._active) {
      return;
    }

    this.tickCount += 1;
    const payload = {
      tickCount: this.tickCount,
      calendar: this.calendar,
      dayInCycle: this.getCurrentDay(),
      cycleProgress: this.getCycleProgress(),
      timestamp: now(),
    };

    this.onTick?.(payload);
  }

  getCurrentDay() {
    return ((this.tickCount % Math.ceil(this.cycleLength)) || Math.ceil(this.cycleLength));
  }

  getCycleProgress() {
    return Number((this.getCurrentDay() / this.cycleLength).toFixed(6));
  }

  getState() {
    return {
      active: this._active,
      calendar: this.calendar,
      cycleLength: this.cycleLength,
      tickCount: this.tickCount,
      currentDay: this.getCurrentDay(),
      cycleProgress: this.getCycleProgress(),
      uptime: (this.stoppedAt ?? now()) - this.startedAt,
    };
  }

  stop() {
    if (!this._active) {
      return this;
    }

    this._active = false;
    this.stoppedAt = now();
    clearInterval(this._timer);
    this._timer = null;
    return this;
  }
}

export class SelfBootstrappingAI {
  constructor({
    name = "NOVA",
    numHearts = 1,
    numBrains = 1,
    calendar = "gregorian",
    heartBaseMs = 1000,
    clockBaseMs = DEFAULT_HEARTBEAT_MS,
  } = {}) {
    this.name = name;
    this.numBrains = Math.max(1, Math.floor(numBrains || 1));
    this.calendar = normalizeCalendar(calendar);
    this.createdAt = now();
    this.alive = true;
    this.thoughts = [];
    this.decisions = [];
    this._thoughtCounter = 0;

    this.heart = new BiologicalHeart({
      baseMs: heartBaseMs,
      numHearts,
      onBeat: (beat) => this._onBeat(beat),
    });

    this.clock = new AutonomousClock({
      calendar: this.calendar,
      baseMs: clockBaseMs,
      onTick: (tick) => this._onTick(tick),
    });

    // Creation is activation: the AI is born with an initial thought.
    this._recordThought("birth");
  }

  _recordThought(context) {
    const thought = createThought(this.name, `${context}:${this._thoughtCounter}`);
    this._thoughtCounter += 1;
    this.thoughts.push(thought);
    if (this.thoughts.length > 512) {
      this.thoughts.shift();
    }
    return thought;
  }

  _onBeat(beat) {
    if (!this.alive) {
      return;
    }

    if ((beat.totalBeats % Math.max(1, Math.round(PHI * this.numBrains))) === 0) {
      this._recordThought(`beat-${beat.heartId}`);
    }
  }

  _onTick(tick) {
    if (!this.alive) {
      return;
    }

    if ((tick.tickCount % Math.max(1, this.numBrains)) === 0) {
      this._recordThought(`clock-${tick.dayInCycle}`);
    }
  }

  decide(question) {
    const seed = hashString(`${question}:${this.clock.getCurrentDay()}:${this.heart.totalBeats}`);
    const confidence = clamp(((seed % 1000) / 1000) * PHI_INV + (this.numBrains / (this.numBrains + PHI)), 0, 1);

    let decision = "uncertain";
    if (confidence >= 0.72) {
      decision = "yes";
    } else if (confidence <= 0.42) {
      decision = "no";
    }

    const result = {
      question,
      decision,
      confidence: Number(confidence.toFixed(4)),
      madeAt: new Date().toISOString(),
      cycleDay: this.clock.getCurrentDay(),
      totalBeats: this.heart.totalBeats,
    };

    this.decisions.push(result);
    this._recordThought(`decision:${decision}`);
    return result;
  }

  getThoughts(count = 10) {
    return this.thoughts.slice(-Math.max(1, count));
  }

  getStatus() {
    return {
      name: this.name,
      alive: this.alive,
      uptime: now() - this.createdAt,
      heartRate: Number(this.heart.getHeartRate().toFixed(4)),
      totalBeats: this.heart.totalBeats,
      clockTicks: this.clock.tickCount,
      currentCycleDay: this.clock.getCurrentDay(),
      thoughts: this.thoughts.length,
      decisions: this.decisions.length,
    };
  }

  getState() {
    return {
      ...this.getStatus(),
      numBrains: this.numBrains,
      calendar: this.calendar,
      recentThoughts: this.getThoughts(10),
      recentDecisions: this.decisions.slice(-10),
      heart: this.heart.getState(),
      clock: this.clock.getState(),
    };
  }

  stop() {
    if (!this.alive) {
      return this;
    }

    this.alive = false;
    this.heart.stop();
    this.clock.stop();
    return this;
  }
}

export function birthAI(config = {}) {
  return new SelfBootstrappingAI(config);
}

export {
  CALENDAR_CYCLES,
  DEFAULT_HEARTBEAT_MS as HEARTBEAT_MS,
  PHI,
  PHI_INV,
};

export default {
  AutonomousClock,
  BiologicalHeart,
  CALENDAR_CYCLES,
  HEARTBEAT_MS: DEFAULT_HEARTBEAT_MS,
  PHI,
  PHI_INV,
  SelfBootstrappingAI,
  birthAI,
};
