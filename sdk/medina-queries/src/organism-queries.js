import { query, createQueryEngine, timeSeries } from "./index.js";

export function queryOrganisms(source = []) {
  return query(source);
}

export function createOrganismQueryEngine() {
  return createQueryEngine();
}

export function heartbeatSeries(data = []) {
  return timeSeries(data);
}

export default {
  createOrganismQueryEngine,
  heartbeatSeries,
  queryOrganisms,
};
