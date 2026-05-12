import { query, createQueryEngine } from "./index.js";

export function queryGovernance(source = []) {
  return query(source);
}

export function createGovernanceQueryEngine() {
  return createQueryEngine();
}

export default {
  createGovernanceQueryEngine,
  queryGovernance,
};
