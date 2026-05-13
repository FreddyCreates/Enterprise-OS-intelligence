export class TaskDispatcher {
  constructor() {
    this.queue = [];
  }

  assignTask(entity, task) {
    const record = {
      entityId: entity.id,
      taskId: task.id ?? `task-${Date.now().toString(36)}`,
      description: task.description,
      priority: task.priority ?? 1,
      assignedAt: new Date().toISOString(),
      status: "queued",
    };
    this.queue.push(record);
    return record;
  }

  listTasks(entityId = null) {
    return entityId ? this.queue.filter((task) => task.entityId === entityId) : [...this.queue];
  }
}
