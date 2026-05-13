export class HeartbeatMonitor {
  constructor() {
    this.beats = new Map();
  }

  record(entityId, beat) {
    this.beats.set(entityId, { beat, recordedAt: new Date().toISOString() });
    return this.beats.get(entityId);
  }

  status() {
    return [...this.beats.entries()].map(([entityId, data]) => ({ entityId, ...data }));
  }
}
