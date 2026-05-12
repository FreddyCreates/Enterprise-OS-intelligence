const PHI = 1.618033988749895;
const PHI_INV = 1 / PHI;

function normalizeText(value) {
  if (value == null) {
    return "";
  }
  if (typeof value === "string") {
    return value.toLowerCase();
  }
  return JSON.stringify(value).toLowerCase();
}

function tokenize(value) {
  return normalizeText(value).split(/[^a-z0-9]+/).filter(Boolean);
}

function fuzzyScore(value, queryText) {
  const haystack = normalizeText(value);
  const needle = normalizeText(queryText);
  if (!needle || !haystack) {
    return 0;
  }
  if (haystack.includes(needle)) {
    return clamp(needle.length / Math.max(haystack.length, needle.length) + PHI_INV, 0, 1);
  }

  const hayTokens = tokenize(haystack);
  const needleTokens = tokenize(needle);
  const overlap = needleTokens.filter((token) => hayTokens.some((hayToken) => hayToken.includes(token)));
  if (overlap.length === 0) {
    return 0;
  }

  const weightedOverlap = overlap.reduce((sum, token, index) => sum + token.length * (PHI ** -(index + 1)), 0);
  return clamp(weightedOverlap / Math.max(needle.length, 1), 0, 1);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getFieldValue(item, field) {
  if (typeof field === "function") {
    return field(item);
  }
  if (!field) {
    return item;
  }
  return field.split(".").reduce((current, key) => current?.[key], item);
}

function extractNumericWeight(item) {
  const preferredKeys = ["score", "reputation", "phiScore", "value", "rate"];
  for (const key of preferredKeys) {
    if (typeof item?.[key] === "number" && Number.isFinite(item[key])) {
      return item[key];
    }
  }

  const numericValues = Object.values(item || {}).filter((value) => typeof value === "number" && Number.isFinite(value));
  if (numericValues.length > 0) {
    return numericValues.reduce((sum, value) => sum + value, 0) / numericValues.length;
  }

  return 1;
}

export class QueryBuilder {
  constructor(source = []) {
    this._source = Array.isArray(source) ? [...source] : [];
    this._predicates = [];
    this._fuzzy = [];
    this._order = null;
    this._limit = null;
    this._offset = 0;
  }

  where(predicate) {
    if (typeof predicate === "function") {
      this._predicates.push(predicate);
    }
    return this;
  }

  fuzzyMatch(field, queryText, threshold = PHI_INV) {
    this._fuzzy.push({ field, queryText, threshold });
    return this;
  }

  orderBy(field, order = "asc") {
    this._order = { field, order: String(order).toLowerCase() === "desc" ? "desc" : "asc", phiWeighted: false };
    return this;
  }

  orderByPhi(field) {
    this._order = { field, order: "desc", phiWeighted: true };
    return this;
  }

  limit(count) {
    this._limit = Math.max(0, Number(count) || 0);
    return this;
  }

  offset(count) {
    this._offset = Math.max(0, Number(count) || 0);
    return this;
  }

  execute() {
    let results = [...this._source];

    this._predicates.forEach((predicate) => {
      results = results.filter((item, index) => predicate(item, index));
    });

    this._fuzzy.forEach(({ field, queryText, threshold }) => {
      results = results
        .map((item) => ({
          item,
          score: fuzzyScore(getFieldValue(item, field), queryText),
        }))
        .filter((entry) => entry.score >= threshold)
        .sort((a, b) => b.score - a.score)
        .map((entry) => ({ ...entry.item, _phiMatchScore: Number(entry.score.toFixed(4)) }));
    });

    if (this._order) {
      const { field, order, phiWeighted } = this._order;
      results = results
        .map((item, index) => {
          const rawValue = getFieldValue(item, field);
          const numericValue = typeof rawValue === "number" ? rawValue : Number(rawValue) || 0;
          const sortableValue = phiWeighted ? numericValue * (PHI ** -(index + 1)) : rawValue;
          return { item, sortableValue };
        })
        .sort((a, b) => {
          if (a.sortableValue < b.sortableValue) {
            return order === "desc" ? 1 : -1;
          }
          if (a.sortableValue > b.sortableValue) {
            return order === "desc" ? -1 : 1;
          }
          return 0;
        })
        .map((entry) => entry.item);
    }

    if (this._offset) {
      results = results.slice(this._offset);
    }

    if (this._limit != null) {
      results = results.slice(0, this._limit);
    }

    return results;
  }

  aggregate() {
    const data = this.execute();
    const weighted = data.map((item, index) => extractNumericWeight(item) * (PHI ** -(index + 1)));
    const phiSum = weighted.reduce((sum, value) => sum + value, 0);
    const phiMean = data.length ? phiSum / data.length : 0;

    return {
      count: data.length,
      phiMean: Number(phiMean.toFixed(4)),
      phiSum: Number(phiSum.toFixed(4)),
      phiMax: Number((Math.max(...weighted, 0)).toFixed(4)),
      phiMin: Number((weighted.length ? Math.min(...weighted) : 0).toFixed(4)),
      data,
    };
  }
}

function annotateEntry(name, data, kind) {
  if (data && typeof data === "object" && !Array.isArray(data)) {
    return {
      name,
      kind,
      ...data,
      data,
    };
  }

  return {
    name,
    kind,
    value: data,
    data,
  };
}

export class IntelligenceQueryEngine {
  constructor() {
    this.protocols = new Map();
    this.modules = new Map();
    this.agents = new Map();
    this.memories = [];
  }

  registerProtocol(name, protocol) {
    this.protocols.set(name, protocol);
    return this;
  }

  registerModule(name, module) {
    this.modules.set(name, module);
    return this;
  }

  registerAgent(name, agent) {
    this.agents.set(name, agent);
    return this;
  }

  addMemory(memory) {
    this.memories.push({
      id: memory?.id ?? `memory-${Date.now().toString(36)}`,
      createdAt: memory?.createdAt ?? new Date().toISOString(),
      ...memory,
    });
    return this;
  }

  queryProtocols() {
    return new QueryBuilder([...this.protocols.entries()].map(([name, data]) => annotateEntry(name, data, "protocol")));
  }

  queryModules() {
    return new QueryBuilder([...this.modules.entries()].map(([name, data]) => annotateEntry(name, data, "module")));
  }

  queryAgents() {
    return new QueryBuilder([...this.agents.entries()].map(([name, data]) => annotateEntry(name, data, "agent")));
  }

  queryMemories() {
    return new QueryBuilder(this.memories.map((memory) => ({ kind: "memory", ...memory })));
  }

  _searchCollection(entries, queryText, threshold, kind) {
    return entries
      .map(([name, data]) => {
        const text = `${name} ${JSON.stringify(data)}`;
        const score = fuzzyScore(text, queryText);
        return {
          name,
          kind,
          data,
          score: Number(score.toFixed(4)),
        };
      })
      .filter((entry) => entry.score >= threshold)
      .sort((a, b) => b.score - a.score);
  }

  search(queryText, threshold = 0.5) {
    return {
      protocols: this._searchCollection([...this.protocols.entries()], queryText, threshold, "protocol"),
      modules: this._searchCollection([...this.modules.entries()], queryText, threshold, "module"),
      agents: this._searchCollection([...this.agents.entries()], queryText, threshold, "agent"),
      memories: this.memories
        .map((memory) => ({
          ...memory,
          score: Number(fuzzyScore(memory.content ?? JSON.stringify(memory), queryText).toFixed(4)),
        }))
        .filter((entry) => entry.score >= threshold)
        .sort((a, b) => b.score - a.score),
    };
  }

  getStats() {
    return {
      protocols: this.protocols.size,
      modules: this.modules.size,
      agents: this.agents.size,
      memories: this.memories.length,
      totalSources: this.protocols.size + this.modules.size + this.agents.size + this.memories.length,
    };
  }
}

export class TimeSeriesQuery {
  constructor(data = []) {
    this._data = Array.isArray(data) ? data.map((entry) => ({ ...entry })) : [];
  }

  phiMovingAverage(field, windowSize = 7) {
    const window = Math.max(1, Math.floor(windowSize || 1));
    this._data = this._data.map((entry, index, array) => {
      const subset = array.slice(Math.max(0, index - window + 1), index + 1);
      let weightedSum = 0;
      let weightTotal = 0;

      subset.forEach((item, subsetIndex) => {
        const weight = PHI ** -(subset.length - subsetIndex);
        weightedSum += (Number(item[field]) || 0) * weight;
        weightTotal += weight;
      });

      return {
        ...entry,
        [`${field}_phi_ma`]: Number((weightedSum / Math.max(weightTotal, 1)).toFixed(4)),
      };
    });

    return this;
  }

  phiEMA(field, alpha = PHI_INV) {
    let previous = null;
    this._data = this._data.map((entry) => {
      const current = Number(entry[field]) || 0;
      previous = previous == null ? current : alpha * current + (1 - alpha) * previous;
      return {
        ...entry,
        [`${field}_phi_ema`]: Number(previous.toFixed(4)),
      };
    });
    return this;
  }

  getData() {
    return [...this._data];
  }
}

export function query(source = []) {
  return new QueryBuilder(source);
}

export function createQueryEngine() {
  return new IntelligenceQueryEngine();
}

export function timeSeries(data = []) {
  return new TimeSeriesQuery(data);
}

export { PHI, PHI_INV, fuzzyScore };

export default {
  IntelligenceQueryEngine,
  PHI,
  PHI_INV,
  QueryBuilder,
  TimeSeriesQuery,
  createQueryEngine,
  query,
  timeSeries,
};
