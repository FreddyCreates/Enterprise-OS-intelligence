export class RiskGateEngine {
  constructor(gates = []) {
    this.gates = gates;
  }

  evaluate(context) {
    const checks = this.gates.map((gate) => {
      let value = 0;
      switch (gate.type) {
        case "drawdown":
          value = context.drawdown ?? 0;
          break;
        case "volatility":
          value = context.volatility ?? 0;
          break;
        case "exposure":
          value = context.exposure ?? 0;
          break;
        case "leverage":
          value = context.leverage ?? 0;
          break;
        case "kill-switch":
          value = context.killSwitch ? 1 : 0;
          break;
        default:
          value = 0;
      }
      return {
        id: gate.id,
        type: gate.type,
        action: gate.action,
        value,
        passed: value <= gate.limit,
      };
    });

    return {
      passed: checks.every((check) => check.passed),
      checks,
      blockingActions: checks.filter((check) => !check.passed).map((check) => check.action),
    };
  }
}

export class KillSwitch {
  constructor() {
    this.active = false;
    this.reason = null;
  }

  trigger(reason) {
    this.active = true;
    this.reason = reason;
    return { active: this.active, reason: this.reason };
  }

  reset() {
    this.active = false;
    this.reason = null;
    return { active: this.active };
  }
}

export class CapitalAllocator {
  allocate(capital, strategies = []) {
    const totalWeight = strategies.reduce((sum, strategy) => sum + (strategy.weight ?? 1), 0) || 1;
    return strategies.map((strategy) => ({
      strategyId: strategy.id,
      capital: Number(((capital * (strategy.weight ?? 1)) / totalWeight).toFixed(2)),
    }));
  }
}
