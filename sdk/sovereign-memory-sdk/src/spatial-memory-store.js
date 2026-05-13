import { PhiCoordinateGenerator } from "./phi-coordinate-generator.js";

function hash(input) {
  let value = 0;
  const text = String(input);
  for (let i = 0; i < text.length; i += 1) {
    value = ((value << 5) - value + text.charCodeAt(i)) | 0;
  }
  return Math.abs(value).toString(16).padStart(16, "0");
}

export class SpatialMemoryStore {
  constructor({ ringCount = 7, beatResolution = 64 } = {}) {
    this.generator = new PhiCoordinateGenerator();
    this.ringCount = ringCount;
    this.beatResolution = beatResolution;
    this.records = new Map();
  }

  store(key, value, coordinates = null) {
    const recordCoordinates = coordinates || this.generator.generate(this.records.size, {
      ringCount: this.ringCount,
      beatResolution: this.beatResolution,
    });
    const record = {
      id: `mem-${Date.now().toString(36)}-${this.records.size}`,
      key,
      value,
      coordinates: recordCoordinates,
      hash: hash(JSON.stringify(value)),
      storedAt: new Date().toISOString(),
    };
    this.records.set(key, record);
    return record;
  }

  retrieve(key) {
    return this.records.get(key) || null;
  }

  listByRing(ring) {
    return [...this.records.values()].filter((record) => record.coordinates.ring === ring);
  }

  listByBeat(beat) {
    return [...this.records.values()].filter((record) => record.coordinates.beat === beat);
  }
}
