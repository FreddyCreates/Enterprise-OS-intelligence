const PHI = 1.618033988749895;
const PHI_INV = 1 / PHI;

export class EnergyDistributor {
  distribute(totalEnergy, consumers = []) {
    const weightTotal = consumers.reduce((sum, consumer) => sum + (consumer.weight ?? 1), 0) || 1;
    return consumers.map((consumer) => ({
      id: consumer.id,
      energy: Number(((totalEnergy * (consumer.weight ?? 1)) / weightTotal).toFixed(6)),
    }));
  }
}

export class ComputeAllocator {
  allocate(totalCycles, entities = []) {
    return entities.map((entity) => ({
      entityId: entity.entityId,
      cycles: Math.round(totalCycles * ((entity.priority ?? 1) / Math.max(entities.reduce((sum, value) => sum + (value.priority ?? 1), 0), 1))),
    }));
  }
}

export class CycleBudget {
  constructor() {
    this.usage = new Map();
  }

  consume(department, cycles) {
    this.usage.set(department, (this.usage.get(department) || 0) + cycles);
    return this.usage.get(department);
  }

  status() {
    return [...this.usage.entries()].map(([department, cycles]) => ({ department, cycles }));
  }
}

export class ThermalGovernor {
  regulate(load = 0) {
    const thermal = load * PHI;
    return {
      thermal,
      coolingRequired: thermal > 1,
    };
  }
}

export class ResourceThrottle {
  throttle(load = 0) {
    return {
      load,
      factor: load > PHI_INV ? Number((PHI_INV / load).toFixed(6)) : 1,
    };
  }
}

export class PowerCore {
  constructor() {
    this.distributor = new EnergyDistributor();
    this.allocator = new ComputeAllocator();
    this.budget = new CycleBudget();
    this.thermal = new ThermalGovernor();
    this.throttle = new ResourceThrottle();
  }

  tick(totalEnergy, consumers = [], entities = []) {
    const distribution = this.distributor.distribute(totalEnergy, consumers);
    const allocation = this.allocator.allocate(Math.round(totalEnergy * 1000), entities);
    const thermal = this.thermal.regulate(totalEnergy * PHI_INV);
    const throttled = this.throttle.throttle(totalEnergy * PHI_INV);
    return { distribution, allocation, thermal, throttled };
  }
}

export { PHI, PHI_INV };

export default {
  ComputeAllocator,
  CycleBudget,
  EnergyDistributor,
  PHI,
  PHI_INV,
  PowerCore,
  ResourceThrottle,
  ThermalGovernor,
};
