export class WorkforceRouter {
  constructor() {
    this.agents = new Map();
    this.assignments = new Map();
  }

  registerAgent(agentId, role, skills = [], availability = "available") {
    this.agents.set(agentId, {
      agentId,
      role,
      skills: [...skills],
      availability,
      taskCount: 0,
    });
    return this;
  }

  assignTask(task) {
    const ranked = [...this.agents.values()]
      .filter((agent) => agent.availability !== "offline")
      .map((agent) => ({
        agent,
        score: task.requiredSkills.filter((skill) => agent.skills.includes(skill)).length - agent.taskCount,
      }))
      .sort((a, b) => b.score - a.score);

    const selected = ranked[0]?.agent ?? null;
    if (!selected) return null;
    selected.taskCount += 1;
    this.assignments.set(task.id ?? `task-${Date.now().toString(36)}`, selected.agentId);
    return selected;
  }

  rebalance() {
    return [...this.agents.values()].sort((a, b) => a.taskCount - b.taskCount);
  }

  getWorkforceStatus() {
    return [...this.agents.values()].map((agent) => ({ ...agent }));
  }

  escalate(taskId, reason) {
    return {
      taskId,
      reason,
      assignedTo: this.assignments.get(taskId) ?? null,
      escalated: true,
    };
  }
}
