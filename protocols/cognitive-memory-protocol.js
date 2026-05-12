/**
 * PROTO-015: Cognitive Memory Protocol (CMP)
 *
 * Working memory, episodic storage, semantic consolidation, and phi-weighted
 * forgetting curves.
 */

const PHI = 1.618033988749895;
const PHI_INV = 1 / PHI;
const HEARTBEAT_MS = 873;
const WORKING_MEMORY_CAPACITY = 7;

function scoreImportance(entry, index) {
  return (entry.importance || 0.5) * (PHI ** -(index + 1));
}

class CognitiveMemoryProtocol {
  constructor() {
    this.beat = 0;
    this.workingMemory = [];
    this.episodicMemory = [];
    this.semanticMemory = new Map();
  }

  remember(content, { importance = 0.5, tags = [] } = {}) {
    const entry = {
      id: `mem-${Date.now().toString(36)}-${this.beat}`,
      content,
      importance,
      tags,
      createdAt: Date.now(),
      recalls: 0,
    };

    this.workingMemory.push(entry);
    if (this.workingMemory.length > WORKING_MEMORY_CAPACITY + 2) {
      this.workingMemory.shift();
    }

    this.episodicMemory.push(entry);
    return entry;
  }

  recall(query = "") {
    const matcher = String(query).toLowerCase();
    return this.episodicMemory
      .filter((entry) => entry.content.toLowerCase().includes(matcher) || entry.tags.some((tag) => String(tag).toLowerCase().includes(matcher)))
      .map((entry) => {
        entry.recalls += 1;
        return entry;
      })
      .slice(-10);
  }

  consolidate() {
    this.workingMemory.forEach((entry) => {
      entry.tags.forEach((tag) => {
        const current = this.semanticMemory.get(tag) || { count: 0, totalImportance: 0 };
        current.count += 1;
        current.totalImportance += entry.importance;
        this.semanticMemory.set(tag, current);
      });
    });
    return this.semanticSummary();
  }

  forgettingCurve() {
    return this.episodicMemory.map((entry, index) => ({
      id: entry.id,
      retention: Number((entry.importance * (PHI_INV ** Math.max(this.beat - index, 0))).toFixed(6)),
    }));
  }

  semanticSummary() {
    return [...this.semanticMemory.entries()].map(([tag, value]) => ({
      tag,
      count: value.count,
      meanImportance: Number((value.totalImportance / Math.max(value.count, 1)).toFixed(6)),
    }));
  }

  step({ thought = null } = {}) {
    this.beat += 1;
    if (thought) {
      this.remember(thought.content || String(thought), thought);
    }
    if (this.beat % 3 === 0) {
      this.consolidate();
    }
    return this.status();
  }

  status() {
    const weightedWorking = this.workingMemory.reduce((sum, entry, index) => sum + scoreImportance(entry, index), 0);
    return {
      code: "CMP",
      name: "Cognitive Memory",
      version: "1.0.0",
      beat: this.beat,
      heartbeatMs: HEARTBEAT_MS,
      workingMemorySize: this.workingMemory.length,
      episodicMemorySize: this.episodicMemory.length,
      semanticCategories: this.semanticMemory.size,
      weightedWorkingLoad: Number(weightedWorking.toFixed(6)),
      forgettingCurveMean: Number(
        (
          this.forgettingCurve().reduce((sum, entry) => sum + entry.retention, 0) /
          Math.max(this.episodicMemory.length, 1)
        ).toFixed(6)
      ),
    };
  }
}

module.exports = {
  PHI,
  PHI_INV,
  HEARTBEAT_MS,
  WORKING_MEMORY_CAPACITY,
  CognitiveMemoryProtocol,
};
