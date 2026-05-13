const PHI = 1.618033988749895;
const PHI_INV = 1 / PHI;

function hash(input) {
  let value = 0;
  const text = String(input);
  for (let i = 0; i < text.length; i += 1) {
    value = ((value << 5) - value + text.charCodeAt(i)) | 0;
  }
  return Math.abs(value).toString(16).padStart(16, "0");
}

export class TransportLayer {
  constructor() {
    this.messages = [];
  }

  send(channel, payload) {
    const message = {
      id: `msg-${hash(`${channel}:${Date.now()}`)}`,
      channel,
      payload,
      sentAt: new Date().toISOString(),
    };
    this.messages.push(message);
    return message;
  }

  list(channel = null) {
    return channel ? this.messages.filter((message) => message.channel === channel) : [...this.messages];
  }
}

export class SovereignRegistry {
  constructor() {
    this.packages = new Map();
  }

  register(packageInfo) {
    this.packages.set(packageInfo.name, packageInfo);
    return packageInfo;
  }

  resolve(name) {
    return this.packages.get(name) ?? null;
  }
}

export class VersionEngine {
  bump(version = "0.1.0", level = "patch") {
    const [major, minor, patch] = version.split(".").map((value) => Number(value) || 0);
    if (level === "major") return `${major + 1}.0.0`;
    if (level === "minor") return `${major}.${minor + 1}.0`;
    return `${major}.${minor}.${patch + 1}`;
  }

  compound(version = "0.1.0", signal = PHI_INV) {
    const next = this.bump(version, signal > PHI_INV ? "minor" : "patch");
    return { version: next, phiSignal: signal };
  }
}

export class EntityMessaging {
  constructor(transport = new TransportLayer()) {
    this.transport = transport;
  }

  notify(entityId, payload) {
    return this.transport.send(`entity:${entityId}`, payload);
  }
}

export class DistributionEngine {
  distribute(packageInfo, entities = [], transport = new TransportLayer()) {
    return entities.map((entityId) => transport.send(`distribution:${entityId}`, packageInfo));
  }
}

export class SovereignServer {
  constructor() {
    this.routes = new Map();
  }

  register(path, handler) {
    this.routes.set(path, handler);
    return this;
  }

  handle(path, payload = {}) {
    const handler = this.routes.get(path);
    if (!handler) return { status: 404, error: "NOT_FOUND", path };
    return { status: 200, data: handler(payload) };
  }
}

export class SovereignProtocolSDK {
  constructor() {
    this.transport = new TransportLayer();
    this.registry = new SovereignRegistry();
    this.versioning = new VersionEngine();
    this.messaging = new EntityMessaging(this.transport);
    this.distribution = new DistributionEngine();
    this.server = new SovereignServer();
  }
}

export { PHI, PHI_INV };

export default {
  DistributionEngine,
  EntityMessaging,
  PHI,
  PHI_INV,
  SovereignProtocolSDK,
  SovereignRegistry,
  SovereignServer,
  TransportLayer,
  VersionEngine,
};
