import { PhiCoordinateGenerator } from "./phi-coordinate-generator.js";

function semanticScore(query, text) {
  const tokens = String(query).toLowerCase().split(/\s+/).filter(Boolean);
  const haystack = String(text).toLowerCase();
  return tokens.reduce((sum, token) => sum + (haystack.includes(token) ? 1 : 0), 0) / Math.max(tokens.length, 1);
}

export class DualLayerSearch {
  constructor() {
    this.generator = new PhiCoordinateGenerator();
  }

  searchSemantic(query, corpus = []) {
    return corpus
      .map((entry) => ({ ...entry, score: semanticScore(query, entry.text) }))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score);
  }

  searchResonance(coordinates, corpus = [], threshold = 0.5) {
    return corpus
      .map((entry) => {
        const distance = this.generator.distance(coordinates, entry.coordinates);
        return { ...entry, score: 1 / (1 + distance) };
      })
      .filter((entry) => entry.score >= threshold)
      .sort((a, b) => b.score - a.score);
  }

  dualRead(input, corpus = [], weights = { semanticWeight: 0.6, resonanceWeight: 0.4 }) {
    const semantic = this.searchSemantic(input.text, corpus);
    const resonance = this.searchResonance(input.coordinates, corpus, 0);
    const combined = new Map();

    semantic.forEach((entry) => combined.set(entry.id, { ...entry, score: entry.score * weights.semanticWeight }));
    resonance.forEach((entry) => {
      const current = combined.get(entry.id) || { ...entry, score: 0 };
      current.score += entry.score * weights.resonanceWeight;
      combined.set(entry.id, current);
    });

    return [...combined.values()].sort((a, b) => b.score - a.score);
  }
}
