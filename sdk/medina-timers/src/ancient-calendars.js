export const PHI = 1.618033988749895;
export const PHI_INV = 1 / PHI;

export const CALENDARS = Object.freeze({
  mayan: 260,
  sumerian: 360,
  egyptian: 365,
  gregorian: 365.25,
});

export class AncientCalendarClock {
  constructor({ calendar = "gregorian", baseMs = 873 } = {}) {
    this.calendar = CALENDARS[calendar] ? calendar : "gregorian";
    this.baseMs = baseMs;
    this.tickCount = 0;
  }

  tick() {
    this.tickCount += 1;
    return this.getState();
  }

  getState() {
    const cycleLength = CALENDARS[this.calendar];
    const dayInCycle = ((this.tickCount % Math.ceil(cycleLength)) || Math.ceil(cycleLength));
    return {
      calendar: this.calendar,
      baseMs: this.baseMs,
      tickCount: this.tickCount,
      cycleLength,
      dayInCycle,
      cycleProgress: Number((dayInCycle / cycleLength).toFixed(6)),
    };
  }
}

export function createAncientCalendarClock(config = {}) {
  return new AncientCalendarClock(config);
}
