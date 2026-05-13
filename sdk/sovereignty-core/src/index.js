const PHI = 1.618033988749895;

function hash(input) {
  let value = 0;
  const text = String(input);
  for (let i = 0; i < text.length; i += 1) {
    value = ((value << 5) - value + text.charCodeAt(i)) | 0;
  }
  return Math.abs(value).toString(16).padStart(16, "0");
}

export class IdentityEngine {
  createIdentity(name, metadata = {}) {
    const id = `sovereign-${hash(`${name}:${Date.now()}`)}`;
    return {
      id,
      principal: `${id.slice(0, 5)}-${id.slice(5, 10)}-${id.slice(10, 15)}`,
      name,
      metadata,
    };
  }
}

export class OwnershipVerifier {
  createProof(ownerId, resource, payload = "") {
    const proof = hash(`${ownerId}:${resource}:${payload}`);
    return { ownerId, resource, proof };
  }

  verify(expectedProof, ownerId, resource, payload = "") {
    return expectedProof === this.createProof(ownerId, resource, payload).proof;
  }
}

export class DataSovereignty {
  constructor() {
    this.consents = new Map();
  }

  grant(ownerId, resource, scope = "read") {
    this.consents.set(`${ownerId}:${resource}:${scope}`, true);
    return true;
  }

  canLeave(ownerId, resource, scope = "read") {
    return this.consents.get(`${ownerId}:${resource}:${scope}`) === true;
  }
}

export class AccessController {
  constructor() {
    this.roles = new Map();
  }

  registerRole(role, capabilities = []) {
    this.roles.set(role, new Set(capabilities));
    return this;
  }

  authorize(role, capability) {
    return this.roles.get(role)?.has(capability) ?? false;
  }
}

export class SelfCustody {
  constructor() {
    this.keys = new Map();
  }

  issue(entityId) {
    const key = `key-${hash(`${entityId}:${PHI}:${Date.now()}`)}`;
    this.keys.set(entityId, key);
    return key;
  }

  get(entityId) {
    return this.keys.get(entityId) ?? null;
  }
}

export class SovereigntyCore {
  constructor() {
    this.identity = new IdentityEngine();
    this.ownership = new OwnershipVerifier();
    this.data = new DataSovereignty();
    this.access = new AccessController();
    this.custody = new SelfCustody();
  }

  birthIdentity(name, metadata = {}) {
    const identity = this.identity.createIdentity(name, metadata);
    const key = this.custody.issue(identity.id);
    return { ...identity, key };
  }
}

export { PHI };

export default {
  AccessController,
  DataSovereignty,
  IdentityEngine,
  OwnershipVerifier,
  PHI,
  SelfCustody,
  SovereigntyCore,
};
