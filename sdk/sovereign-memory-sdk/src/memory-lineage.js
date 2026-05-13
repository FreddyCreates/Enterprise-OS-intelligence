export class MemoryLineage {
  constructor() {
    this.parents = new Map();
  }

  recordAncestor(childId, parentId) {
    this.parents.set(childId, parentId);
    return this;
  }

  getLineage(id) {
    const lineage = [];
    let cursor = this.parents.get(id) || null;
    while (cursor) {
      lineage.unshift(cursor);
      cursor = this.parents.get(cursor) || null;
    }
    return lineage;
  }

  fork(id, forkName = "fork") {
    const forkId = `${forkName}-${Date.now().toString(36)}`;
    this.parents.set(forkId, id);
    return { sourceId: id, forkId };
  }

  consolidate(ids = []) {
    return {
      rootAncestors: ids.map((id) => this.getLineage(id)[0] || id),
      mergedAt: new Date().toISOString(),
    };
  }
}
