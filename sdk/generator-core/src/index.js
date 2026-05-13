import { birthAI } from "../../medina-heart/src/index.js";

function hash(input) {
  let value = 0;
  const text = String(input);
  for (let i = 0; i < text.length; i += 1) {
    value = ((value << 5) - value + text.charCodeAt(i)) | 0;
  }
  return Math.abs(value).toString(16).padStart(16, "0");
}

export class EntityGenerator {
  generate(spec = {}) {
    return {
      id: `entity-${hash(`${spec.name ?? "entity"}:${Date.now()}`)}`,
      name: spec.name ?? "Generated Entity",
      role: spec.role ?? "generalist",
      tier: spec.tier ?? "Bronze",
      createdAt: new Date().toISOString(),
    };
  }
}

export class CodeSynthesizer {
  synthesize(spec = {}) {
    return `export function ${spec.name ?? "generatedFunction"}() {\n  return ${JSON.stringify(spec.output ?? "generated")};\n}\n`;
  }
}

export class CanisterSpawner {
  spawn(entity) {
    return {
      canisterId: `canister-${hash(entity.id)}`,
      entityId: entity.id,
      status: "spawned",
    };
  }
}

export class AgentBirther {
  birth(config = {}) {
    return birthAI({
      name: config.name ?? "GENERATOR-AGENT",
      numHearts: config.numHearts ?? 2,
      numBrains: config.numBrains ?? 2,
      calendar: config.calendar ?? "gregorian",
      heartBaseMs: config.heartBaseMs ?? 10,
      clockBaseMs: config.clockBaseMs ?? 10,
    });
  }
}

export class ArtifactProducer {
  produce(type, content, metadata = {}) {
    return {
      artifactId: `artifact-${hash(`${type}:${Date.now()}`)}`,
      type,
      content,
      metadata,
      producedAt: new Date().toISOString(),
    };
  }
}

export class GeneratorCore {
  constructor() {
    this.entities = new EntityGenerator();
    this.code = new CodeSynthesizer();
    this.canisters = new CanisterSpawner();
    this.agents = new AgentBirther();
    this.artifacts = new ArtifactProducer();
  }
}

export default {
  AgentBirther,
  ArtifactProducer,
  CanisterSpawner,
  CodeSynthesizer,
  EntityGenerator,
  GeneratorCore,
};
