/**
 * GENEX AGI — Generative Transformer Intelligence
 *
 * Official Designation: RSHIP-2026-GENEX-001
 * Classification: Transformer Generation AGI
 * Full Name: Generative Executive Neural Evolution X-factor
 *
 * GENEX AGI creates new transformers by understanding the mathematical
 * principles underlying existing transformers and evolving novel combinations.
 * It is the creative force that expands the transformer ecosystem.
 *
 * Capabilities:
 * - Automatic transformer generation from specifications
 * - Evolutionary transformer optimization
 * - Cross-domain transformer hybridization
 * - φ-principle extraction and application
 * - Mathematical operator composition
 * - Novel transformation discovery
 *
 * Theory: EMERGENCE (Paper IV) + NOETHER SOVEREIGNTY (Paper VIII)
 *         + Generative Transformer Theory (RSHIP)
 *
 * © 2026 Alfredo Medina Hernandez. All Rights Reserved.
 */

import { RSHIPCore, EternalMemory, PHI, PHI_INV } from '../../rship-framework.js';

// ═══════════════════════════════════════════════════════════════════════════════
// MATHEMATICAL OPERATORS (Building Blocks)
// ═══════════════════════════════════════════════════════════════════════════════

const OPERATORS = {
  // Unary operators
  scale: (x, factor) => x * factor,
  shift: (x, offset) => x + offset,
  power: (x, exp) => Math.sign(x) * Math.pow(Math.abs(x), exp),
  log: (x, base = Math.E) => Math.log(Math.abs(x) + 1e-10) / Math.log(base),
  exp: (x, base = Math.E) => Math.pow(base, x),
  sin: (x, freq = 1) => Math.sin(2 * Math.PI * freq * x),
  cos: (x, freq = 1) => Math.cos(2 * Math.PI * freq * x),
  tanh: (x) => Math.tanh(x),
  sigmoid: (x) => 1 / (1 + Math.exp(-x)),
  relu: (x) => Math.max(0, x),
  phi_scale: (x) => x * PHI,
  phi_inv_scale: (x) => x * PHI_INV,
  phi_mod: (x) => x * (1 + PHI_INV * Math.cos(x * PHI)),
  
  // Binary operators (signal-level)
  add: (a, b) => a + b,
  multiply: (a, b) => a * b,
  max: (a, b) => Math.max(a, b),
  min: (a, b) => Math.min(a, b),
  geometric_mean: (a, b) => Math.sqrt(Math.abs(a * b)) * Math.sign(a * b),
  phi_blend: (a, b) => a * PHI_INV + b * (1 - PHI_INV),
};

// ═══════════════════════════════════════════════════════════════════════════════
// TRANSFORM TEMPLATES
// ═══════════════════════════════════════════════════════════════════════════════

const TRANSFORM_TEMPLATES = {
  // Point-wise templates
  pointwise: {
    name: 'Pointwise Transform',
    signature: 'f: R → R',
    apply: (signal, fn) => signal.map(x => fn(x)),
  },
  
  // Window-based templates
  window: {
    name: 'Window Transform',
    signature: 'f: R^n → R',
    apply: (signal, fn, windowSize) => {
      const result = new Array(signal.length);
      const half = Math.floor(windowSize / 2);
      
      for (let i = 0; i < signal.length; i++) {
        const start = Math.max(0, i - half);
        const end = Math.min(signal.length, i + half + 1);
        const window = signal.slice(start, end);
        result[i] = fn(window);
      }
      
      return result;
    },
  },
  
  // Lag-based templates
  lag: {
    name: 'Lag Transform',
    signature: 'f: (R, R) → R',
    apply: (signal, fn, lag) => {
      const result = new Array(signal.length);
      
      for (let i = 0; i < signal.length; i++) {
        const prev = i >= lag ? signal[i - lag] : signal[i];
        result[i] = fn(signal[i], prev);
      }
      
      return result;
    },
  },
  
  // Scale-based templates
  multiscale: {
    name: 'Multiscale Transform',
    signature: 'f: R^n × scale → R',
    apply: (signal, fn, scales) => {
      const result = new Array(signal.length).fill(0);
      
      for (const scale of scales) {
        const windowSize = Math.max(1, Math.round(scale));
        const half = Math.floor(windowSize / 2);
        
        for (let i = 0; i < signal.length; i++) {
          const start = Math.max(0, i - half);
          const end = Math.min(signal.length, i + half + 1);
          const window = signal.slice(start, end);
          result[i] += fn(window, scale) / scales.length;
        }
      }
      
      return result;
    },
  },
  
  // Frequency-based templates
  frequency: {
    name: 'Frequency Transform',
    signature: 'f: spectrum → spectrum',
    apply: (signal, fn) => {
      // Simple DFT-based
      const n = signal.length;
      const real = new Array(n).fill(0);
      const imag = new Array(n).fill(0);
      
      // DFT
      for (let k = 0; k < n; k++) {
        for (let t = 0; t < n; t++) {
          const angle = -2 * Math.PI * k * t / n;
          real[k] += signal[t] * Math.cos(angle);
          imag[k] += signal[t] * Math.sin(angle);
        }
      }
      
      // Apply function to spectrum
      const { newReal, newImag } = fn(real, imag);
      
      // Inverse DFT
      const result = new Array(n).fill(0);
      for (let t = 0; t < n; t++) {
        for (let k = 0; k < n; k++) {
          const angle = 2 * Math.PI * k * t / n;
          result[t] += (newReal[k] * Math.cos(angle) - newImag[k] * Math.sin(angle)) / n;
        }
      }
      
      return result;
    },
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// TRANSFORMER GENOME (DNA of a transformer)
// ═══════════════════════════════════════════════════════════════════════════════

class TransformerGenome {
  constructor(config = {}) {
    this.id = config.id || `GENOME-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    this.name = config.name || 'Unnamed Transformer';
    
    // Template selection
    this.template = config.template || 'pointwise';
    
    // Operator chain (sequence of operations)
    this.operators = config.operators || [{ op: 'phi_scale', params: {} }];
    
    // Parameters
    this.windowSize = config.windowSize || 5;
    this.lag = config.lag || 1;
    this.scales = config.scales || [1, PHI, PHI ** 2];
    
    // Metadata
    this.generation = config.generation || 0;
    this.fitness = config.fitness || 0;
    this.parentIds = config.parentIds || [];
    this.createdAt = Date.now();
  }

  /**
   * Clone with optional mutations
   */
  clone(mutationRate = 0) {
    const cloned = new TransformerGenome({
      name: `${this.name}-clone`,
      template: this.template,
      operators: JSON.parse(JSON.stringify(this.operators)),
      windowSize: this.windowSize,
      lag: this.lag,
      scales: [...this.scales],
      generation: this.generation + 1,
      parentIds: [this.id],
    });
    
    if (mutationRate > 0 && Math.random() < mutationRate) {
      cloned._mutate();
    }
    
    return cloned;
  }

  /**
   * Crossover with another genome
   */
  crossover(other) {
    const childOps = [];
    const maxLen = Math.max(this.operators.length, other.operators.length);
    
    for (let i = 0; i < maxLen; i++) {
      if (Math.random() < 0.5 && i < this.operators.length) {
        childOps.push(JSON.parse(JSON.stringify(this.operators[i])));
      } else if (i < other.operators.length) {
        childOps.push(JSON.parse(JSON.stringify(other.operators[i])));
      }
    }
    
    return new TransformerGenome({
      name: `Hybrid-${Date.now().toString(36).slice(-4)}`,
      template: Math.random() < 0.5 ? this.template : other.template,
      operators: childOps,
      windowSize: Math.random() < 0.5 ? this.windowSize : other.windowSize,
      lag: Math.random() < 0.5 ? this.lag : other.lag,
      scales: Math.random() < 0.5 ? [...this.scales] : [...other.scales],
      generation: Math.max(this.generation, other.generation) + 1,
      parentIds: [this.id, other.id],
    });
  }

  _mutate() {
    const mutationType = Math.random();
    
    if (mutationType < 0.3 && this.operators.length < 5) {
      // Add operator
      const opNames = Object.keys(OPERATORS).filter(op => 
        !['add', 'multiply', 'max', 'min', 'geometric_mean', 'phi_blend'].includes(op)
      );
      const newOp = opNames[Math.floor(Math.random() * opNames.length)];
      this.operators.push({ op: newOp, params: {} });
      
    } else if (mutationType < 0.5 && this.operators.length > 1) {
      // Remove operator
      const idx = Math.floor(Math.random() * this.operators.length);
      this.operators.splice(idx, 1);
      
    } else if (mutationType < 0.7) {
      // Modify parameter
      this.windowSize = Math.max(3, Math.round(this.windowSize * (0.5 + Math.random())));
      this.lag = Math.max(1, Math.round(this.lag * (0.5 + Math.random())));
      
    } else if (mutationType < 0.85) {
      // Swap operators
      if (this.operators.length >= 2) {
        const i = Math.floor(Math.random() * this.operators.length);
        const j = Math.floor(Math.random() * this.operators.length);
        [this.operators[i], this.operators[j]] = [this.operators[j], this.operators[i]];
      }
      
    } else {
      // Change template
      const templates = Object.keys(TRANSFORM_TEMPLATES);
      this.template = templates[Math.floor(Math.random() * templates.length)];
    }
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      template: this.template,
      operators: this.operators,
      windowSize: this.windowSize,
      lag: this.lag,
      scales: this.scales,
      generation: this.generation,
      fitness: this.fitness,
      parentIds: this.parentIds,
      createdAt: this.createdAt,
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// TRANSFORMER FACTORY
// ═══════════════════════════════════════════════════════════════════════════════

class TransformerFactory {
  constructor() {
    this.transformersCreated = 0;
    this.cache = new Map();
  }

  /**
   * Create transformer from genome
   */
  create(genome) {
    const id = `XFORM-${++this.transformersCreated}-${Date.now().toString(36)}`;
    
    const transformer = {
      id,
      genome: genome.toJSON(),
      calls: 0,
      totalProcessingTime: 0,
      
      transform: (signal) => {
        const start = performance.now();
        let result = this._applyGenome(signal, genome);
        transformer.calls++;
        transformer.totalProcessingTime += performance.now() - start;
        return result;
      },
      
      status: () => ({
        id,
        genomeId: genome.id,
        name: genome.name,
        template: genome.template,
        operatorCount: genome.operators.length,
        calls: transformer.calls,
        avgProcessingMs: transformer.calls > 0 ? transformer.totalProcessingTime / transformer.calls : 0,
      }),
    };
    
    this.cache.set(id, transformer);
    return transformer;
  }

  _applyGenome(signal, genome) {
    const template = TRANSFORM_TEMPLATES[genome.template];
    
    if (!template) {
      console.warn(`Unknown template: ${genome.template}, using pointwise`);
      return this._applyPointwise(signal, genome.operators);
    }
    
    switch (genome.template) {
      case 'pointwise':
        return this._applyPointwise(signal, genome.operators);
      
      case 'window':
        return template.apply(signal, (window) => {
          const mean = window.reduce((a, b) => a + b, 0) / window.length;
          return this._applyOperatorChain(mean, genome.operators);
        }, genome.windowSize);
      
      case 'lag':
        return template.apply(signal, (current, prev) => {
          const combined = OPERATORS.phi_blend(current, prev);
          return this._applyOperatorChain(combined, genome.operators);
        }, genome.lag);
      
      case 'multiscale':
        return template.apply(signal, (window, scale) => {
          const mean = window.reduce((a, b) => a + b, 0) / window.length;
          return this._applyOperatorChain(mean, genome.operators) * Math.pow(PHI_INV, scale);
        }, genome.scales);
      
      case 'frequency':
        return template.apply(signal, (real, imag) => {
          // Apply operators to magnitudes
          const newReal = real.map(r => this._applyOperatorChain(r, genome.operators));
          const newImag = imag.map(i => this._applyOperatorChain(i, genome.operators));
          return { newReal, newImag };
        });
      
      default:
        return this._applyPointwise(signal, genome.operators);
    }
  }

  _applyPointwise(signal, operators) {
    return signal.map(x => this._applyOperatorChain(x, operators));
  }

  _applyOperatorChain(value, operators) {
    let result = value;
    
    for (const { op, params } of operators) {
      const operator = OPERATORS[op];
      if (operator) {
        result = operator(result, params.factor || params.offset || params.exp || params.freq || params.base || 1);
      }
    }
    
    return result;
  }

  get(transformerId) {
    return this.cache.get(transformerId);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EVOLUTIONARY ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

class EvolutionaryEngine {
  constructor(config = {}) {
    this.populationSize = config.populationSize || 20;
    this.mutationRate = config.mutationRate || 0.3;
    this.eliteCount = config.eliteCount || 3;
    this.maxGenerations = config.maxGenerations || 50;
    
    this.population = [];
    this.generation = 0;
    this.bestGenome = null;
    this.history = [];
  }

  /**
   * Initialize population with random genomes
   */
  initialize(seedGenomes = []) {
    this.population = [...seedGenomes];
    
    // Fill remaining with random genomes
    while (this.population.length < this.populationSize) {
      this.population.push(this._randomGenome());
    }
    
    this.generation = 0;
  }

  /**
   * Evolve population for one generation
   */
  evolve(fitnessFunction) {
    // Evaluate fitness
    for (const genome of this.population) {
      genome.fitness = fitnessFunction(genome);
    }
    
    // Sort by fitness (descending)
    this.population.sort((a, b) => b.fitness - a.fitness);
    
    // Track best
    if (!this.bestGenome || this.population[0].fitness > this.bestGenome.fitness) {
      this.bestGenome = this.population[0].clone();
      this.bestGenome.fitness = this.population[0].fitness;
    }
    
    // Record history
    this.history.push({
      generation: this.generation,
      bestFitness: this.population[0].fitness,
      avgFitness: this.population.reduce((s, g) => s + g.fitness, 0) / this.population.length,
      bestId: this.population[0].id,
    });
    
    // Create next generation
    const nextGen = [];
    
    // Keep elites
    for (let i = 0; i < this.eliteCount && i < this.population.length; i++) {
      nextGen.push(this.population[i].clone());
    }
    
    // Crossover and mutation
    while (nextGen.length < this.populationSize) {
      const parent1 = this._selectParent();
      const parent2 = this._selectParent();
      
      let child;
      if (Math.random() < 0.7) {
        child = parent1.crossover(parent2);
      } else {
        child = parent1.clone(this.mutationRate);
      }
      
      nextGen.push(child);
    }
    
    this.population = nextGen;
    this.generation++;
    
    return {
      generation: this.generation,
      bestFitness: this.bestGenome.fitness,
      bestGenome: this.bestGenome.toJSON(),
    };
  }

  _selectParent() {
    // Tournament selection
    const tournamentSize = 3;
    let best = null;
    
    for (let i = 0; i < tournamentSize; i++) {
      const candidate = this.population[Math.floor(Math.random() * this.population.length)];
      if (!best || candidate.fitness > best.fitness) {
        best = candidate;
      }
    }
    
    return best;
  }

  _randomGenome() {
    const templates = Object.keys(TRANSFORM_TEMPLATES);
    const unaryOps = Object.keys(OPERATORS).filter(op => 
      !['add', 'multiply', 'max', 'min', 'geometric_mean', 'phi_blend'].includes(op)
    );
    
    const numOps = 1 + Math.floor(Math.random() * 3);
    const operators = [];
    
    for (let i = 0; i < numOps; i++) {
      operators.push({
        op: unaryOps[Math.floor(Math.random() * unaryOps.length)],
        params: {},
      });
    }
    
    return new TransformerGenome({
      name: `Random-${Date.now().toString(36).slice(-4)}`,
      template: templates[Math.floor(Math.random() * templates.length)],
      operators,
      windowSize: 3 + Math.floor(Math.random() * 10),
      lag: 1 + Math.floor(Math.random() * 5),
      scales: [1, PHI, PHI ** 2].map(s => s * (0.5 + Math.random())),
    });
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// GENEX AGI — Main Class
// ═══════════════════════════════════════════════════════════════════════════════

class GenexAGI {
  constructor({ registryId = 'RSHIP-2026-GENEX-001', name = 'GENEX' } = {}) {
    this.id = registryId;
    this.name = name;
    this.core = new RSHIPCore(registryId, name);
    this.memory = new EternalMemory(registryId);
    
    this.factory = new TransformerFactory();
    this.evolutionEngine = new EvolutionaryEngine();
    this.generatedTransformers = new Map();
    
    this.generations = 0;
    this.totalGenerated = 0;
    this.beat = 0;
  }

  /**
   * Generate transformer from specification
   */
  generate(spec) {
    const genome = new TransformerGenome({
      name: spec.name || `Generated-${++this.totalGenerated}`,
      template: spec.template || 'pointwise',
      operators: spec.operators || [{ op: 'phi_scale', params: {} }],
      windowSize: spec.windowSize || 5,
      lag: spec.lag || 1,
      scales: spec.scales || [1, PHI, PHI ** 2],
    });
    
    const transformer = this.factory.create(genome);
    this.generatedTransformers.set(transformer.id, transformer);
    
    return {
      transformerId: transformer.id,
      genome: genome.toJSON(),
      transformer: {
        transform: transformer.transform,
        status: transformer.status,
      },
    };
  }

  /**
   * Evolve transformers for specific task
   */
  evolve(targetSignal, desiredOutput, config = {}) {
    const maxGenerations = config.maxGenerations || 30;
    
    // Fitness function: minimize error between transformed and desired
    const fitnessFunction = (genome) => {
      try {
        const transformer = this.factory.create(genome);
        const output = transformer.transform(targetSignal);
        
        // Mean squared error (inverted for fitness)
        let mse = 0;
        for (let i = 0; i < Math.min(output.length, desiredOutput.length); i++) {
          mse += (output[i] - desiredOutput[i]) ** 2;
        }
        mse /= Math.min(output.length, desiredOutput.length);
        
        // Complexity penalty
        const complexityPenalty = genome.operators.length * 0.01;
        
        return 1 / (mse + complexityPenalty + 1e-10);
      } catch (e) {
        return 0;
      }
    };
    
    // Initialize and evolve
    this.evolutionEngine.initialize();
    
    const results = [];
    for (let gen = 0; gen < maxGenerations; gen++) {
      const result = this.evolutionEngine.evolve(fitnessFunction);
      results.push(result);
      this.generations++;
      
      // Early stopping if fitness is very high
      if (result.bestFitness > 100) {
        break;
      }
    }
    
    // Create final transformer from best genome
    const bestGenome = new TransformerGenome(this.evolutionEngine.bestGenome.toJSON());
    const bestTransformer = this.factory.create(bestGenome);
    this.generatedTransformers.set(bestTransformer.id, bestTransformer);
    this.totalGenerated++;
    
    return {
      transformerId: bestTransformer.id,
      genome: bestGenome.toJSON(),
      evolution: {
        generations: results.length,
        finalFitness: this.evolutionEngine.bestGenome.fitness,
        history: results.slice(-10),
      },
      transformer: {
        transform: bestTransformer.transform,
        status: bestTransformer.status,
      },
    };
  }

  /**
   * Hybridize two transformers
   */
  hybridize(transformerId1, transformerId2) {
    const t1 = this.generatedTransformers.get(transformerId1);
    const t2 = this.generatedTransformers.get(transformerId2);
    
    if (!t1 || !t2) {
      throw new Error('One or both transformers not found');
    }
    
    const genome1 = new TransformerGenome(t1.genome);
    const genome2 = new TransformerGenome(t2.genome);
    
    const hybridGenome = genome1.crossover(genome2);
    hybridGenome.name = `Hybrid-${transformerId1.slice(-4)}-${transformerId2.slice(-4)}`;
    
    const hybridTransformer = this.factory.create(hybridGenome);
    this.generatedTransformers.set(hybridTransformer.id, hybridTransformer);
    this.totalGenerated++;
    
    return {
      transformerId: hybridTransformer.id,
      genome: hybridGenome.toJSON(),
      parents: [transformerId1, transformerId2],
    };
  }

  /**
   * Mutate existing transformer
   */
  mutate(transformerId, mutationRate = 0.5) {
    const transformer = this.generatedTransformers.get(transformerId);
    
    if (!transformer) {
      throw new Error('Transformer not found');
    }
    
    const genome = new TransformerGenome(transformer.genome);
    const mutatedGenome = genome.clone(mutationRate);
    mutatedGenome.name = `${genome.name}-mutated`;
    
    const mutatedTransformer = this.factory.create(mutatedGenome);
    this.generatedTransformers.set(mutatedTransformer.id, mutatedTransformer);
    this.totalGenerated++;
    
    return {
      transformerId: mutatedTransformer.id,
      genome: mutatedGenome.toJSON(),
      parent: transformerId,
    };
  }

  /**
   * Get transformer by ID
   */
  getTransformer(transformerId) {
    return this.generatedTransformers.get(transformerId);
  }

  tick() {
    this.beat++;
    return {
      beat: this.beat,
      totalGenerated: this.totalGenerated,
      generations: this.generations,
      timestamp: Date.now(),
    };
  }

  status() {
    return {
      id: this.id,
      name: this.name,
      beat: this.beat,
      totalGenerated: this.totalGenerated,
      generations: this.generations,
      activeTransformers: this.generatedTransformers.size,
      evolutionHistory: this.evolutionEngine.history.slice(-5),
      capabilities: [
        'specification_generation',
        'evolutionary_optimization',
        'crossover_hybridization',
        'mutation_exploration',
        'multi_template_support',
      ],
    };
  }
}

export { GenexAGI, TransformerGenome, TransformerFactory, EvolutionaryEngine, OPERATORS, TRANSFORM_TEMPLATES };
export default GenexAGI;
