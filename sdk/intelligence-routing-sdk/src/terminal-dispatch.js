export class TerminalDispatch {
  constructor() {
    this.terminals = new Map();
  }

  createTerminal(terminalId, config = {}) {
    this.terminals.set(terminalId, {
      terminalId,
      type: config.type ?? "local",
      capabilities: [...(config.capabilities || [])],
      maxConcurrency: config.maxConcurrency ?? 1,
      activeTasks: 0,
      completedTasks: 0,
      online: true,
    });
    return this;
  }

  async dispatch(terminalId, command) {
    const terminal = this.terminals.get(terminalId);
    if (!terminal) throw new Error(`Terminal not found: ${terminalId}`);
    terminal.activeTasks += 1;
    const result = {
      terminalId,
      command,
      status: "executed",
      completedAt: new Date().toISOString(),
    };
    terminal.activeTasks -= 1;
    terminal.completedTasks += 1;
    return result;
  }

  async broadcast(command) {
    return Promise.all([...this.terminals.keys()].map((terminalId) => this.dispatch(terminalId, command)));
  }

  getTerminalStatus(terminalId) {
    return this.terminals.get(terminalId) || null;
  }

  listTerminals() {
    return [...this.terminals.values()].map((terminal) => ({ ...terminal }));
  }
}
