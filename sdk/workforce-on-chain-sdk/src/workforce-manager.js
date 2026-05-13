import { EntityLifecycle, EntityLifecycleState } from "./entity-lifecycle.js";
import { TaskDispatcher } from "./task-dispatcher.js";
import { HeartbeatMonitor } from "./heartbeat-monitor.js";
import { UpgradeController } from "./upgrade-controller.js";

export class WorkforceManager {
  constructor() {
    this.entities = new Map();
    this.lifecycle = new EntityLifecycle();
    this.dispatcher = new TaskDispatcher();
    this.heartbeat = new HeartbeatMonitor();
    this.upgrades = new UpgradeController();
  }

  registerEntity(entity) {
    const born = this.lifecycle.birth(entity);
    this.entities.set(entity.id, this.lifecycle.advance(born, EntityLifecycleState.ACTIVE));
    return this.entities.get(entity.id);
  }

  assignTask(entityId, task) {
    const entity = this.entities.get(entityId);
    if (!entity) throw new Error(`Entity not found: ${entityId}`);
    this.entities.set(entityId, this.lifecycle.advance(entity, EntityLifecycleState.PROCESSING));
    return this.dispatcher.assignTask(entity, task);
  }

  recordHeartbeat(entityId, beat) {
    return this.heartbeat.record(entityId, beat);
  }

  getWorkforceStatus() {
    return {
      entities: [...this.entities.values()],
      tasks: this.dispatcher.listTasks(),
      heartbeats: this.heartbeat.status(),
    };
  }
}
