export class LivingDocument {
  constructor() {
    this.documents = new Map();
  }

  create(title, content) {
    const id = `doc-${Date.now().toString(36)}-${this.documents.size}`;
    this.documents.set(id, {
      id,
      title,
      content,
      history: [{ type: "create", content, at: new Date().toISOString() }],
    });
    return this.documents.get(id);
  }

  evolve(id, mutation) {
    const doc = this.documents.get(id);
    if (!doc) throw new Error(`Document not found: ${id}`);
    if (mutation.type === "append") {
      doc.content += mutation.content;
    } else if (mutation.type === "replace") {
      doc.content = mutation.content;
    }
    doc.history.push({ ...mutation, at: new Date().toISOString() });
    return doc;
  }

  snapshot(id) {
    const doc = this.documents.get(id);
    if (!doc) return null;
    return Object.freeze({ id: doc.id, title: doc.title, content: doc.content });
  }

  getEvolutionHistory(id) {
    return this.documents.get(id)?.history ?? [];
  }
}
