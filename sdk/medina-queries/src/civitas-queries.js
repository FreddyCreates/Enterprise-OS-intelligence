import { query, createQueryEngine } from "./index.js";

export function queryInstitutions(source = []) {
  return query(source);
}

export function createCivitasQueryEngine() {
  return createQueryEngine();
}

export default {
  createCivitasQueryEngine,
  queryInstitutions,
};
