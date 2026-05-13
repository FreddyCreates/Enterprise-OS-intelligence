export const EntityLifecycleState = Object.freeze({
  BIRTH: "BIRTH",
  ACTIVE: "ACTIVE",
  PROCESSING: "PROCESSING",
  RESTING: "RESTING",
  UPGRADING: "UPGRADING",
  TERMINATED: "TERMINATED",
});

export class EntityLifecycle {
  birth(entity) {
    return { ...entity, state: EntityLifecycleState.BIRTH, bornAt: new Date().toISOString() };
  }

  advance(entity, state) {
    return { ...entity, state, updatedAt: new Date().toISOString() };
  }
}
