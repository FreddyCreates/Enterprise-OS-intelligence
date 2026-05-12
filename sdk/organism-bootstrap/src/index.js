const PHI = 1.618033988749895;
const PHI_INV = 1 / PHI;
const HEARTBEAT_MS = 873;
const HEARTBEAT_NS = 873_000_000;

function sanitizeName(name) {
  return String(name)
    .trim()
    .replace(/[^a-zA-Z0-9_]/g, "_")
    .replace(/^(\d)/, "_$1");
}

function toStableString(value) {
  if (typeof value === "string") {
    return value;
  }
  return JSON.stringify(value);
}

export class StateManager {
  constructor() {
    this._stable = new Map();
    this._transient = new Map();
  }

  setStable(key, value) {
    this._stable.set(key, value);
    return this;
  }

  getStable(key) {
    return this._stable.get(key);
  }

  setTransient(key, value) {
    this._transient.set(key, value);
    return this;
  }

  getTransient(key) {
    return this._transient.get(key);
  }

  serializeStableState() {
    const stableVars = [...this._stable.entries()].map(([key, value], index) => {
      const numericValue = typeof value === "number" ? value : toStableString(value).length;
      const phiWeight = numericValue * (PHI ** -(index + 1));
      return {
        key,
        value: toStableString(value),
        phiWeight: Number(phiWeight.toFixed(4)),
      };
    });

    return {
      stableVars,
      totalEntries: stableVars.length,
      phiSum: Number(stableVars.reduce((sum, entry) => sum + entry.phiWeight, 0).toFixed(4)),
    };
  }
}

export class DeploymentValidator {
  constructor() {
    this._checks = [];
  }

  addCheck(name, checkFn) {
    if (typeof checkFn !== "function") {
      throw new Error("checkFn must be a function");
    }

    this._checks.push({ name, checkFn });
    return this;
  }

  async validate() {
    const results = [];
    for (const check of this._checks) {
      let output;
      try {
        output = await check.checkFn();
      } catch (error) {
        output = {
          passed: false,
          message: error.message,
        };
      }

      results.push({
        name: check.name,
        passed: Boolean(output?.passed),
        message: output?.message ?? "",
        phiScore: output?.passed ? PHI : 0,
      });
    }

    const totalScore = results.reduce((sum, result) => sum + result.phiScore, 0);
    const maxScore = results.length * PHI;
    return {
      results,
      totalScore: Number(totalScore.toFixed(4)),
      maxScore: Number(maxScore.toFixed(4)),
      successRate: results.length ? Number((results.filter((result) => result.passed).length / results.length).toFixed(4)) : 0,
      passed: results.every((result) => result.passed),
    };
  }
}

export class OrganismBootstrap {
  constructor({ canisterId = null, network = "local" } = {}) {
    this.canisterId = canisterId;
    this.network = network;
    this.modules = new Map();
    this.state = new StateManager();
  }

  registerModule(name, moduleDefinition = {}) {
    this.modules.set(name, {
      name,
      actorName: sanitizeName(name),
      ...moduleDefinition,
    });
    return this;
  }

  generateMotokoWrapper(moduleName) {
    const module = this.modules.get(moduleName);
    if (!module) {
      throw new Error(`Unknown module: ${moduleName}`);
    }

    const actorName = module.actorName;
    const serializedConfig = toStableString(module.config || {});

    return `import Timer "mo:base/Timer";
import Debug "mo:base/Debug";
import Float "mo:base/Float";
import Int "mo:base/Int";
import Nat "mo:base/Nat";
import Text "mo:base/Text";

actor ${actorName} {
  let PHI : Float = ${PHI};
  let HEARTBEAT_MS : Nat = ${HEARTBEAT_NS};

  stable var beatCount : Nat = 0;
  stable var isActive : Bool = true;
  stable var moduleName : Text = "${moduleName}";
  stable var serializedConfig : Text = ${JSON.stringify(serializedConfig)};

  func onHeartbeat(beat : Nat) : async () {
    Debug.print("[" # moduleName # "] heartbeat " # Nat.toText(beat));
  };

  let heartbeat = Timer.recurringTimer(
    #nanoseconds(HEARTBEAT_MS),
    func() : async () {
      if (isActive) {
        beatCount += 1;
        await onHeartbeat(beatCount);
      };
    }
  );

  public query func getState() : async {
    beatCount : Nat;
    isActive : Bool;
    moduleName : Text;
    phiRatio : Float;
    config : Text;
  } {
    {
      beatCount = beatCount;
      isActive = isActive;
      moduleName = moduleName;
      phiRatio = Float.fromInt(Int.abs(Int.fromNat(beatCount))) * PHI;
      config = serializedConfig;
    }
  };

  public func activate() : async () {
    isActive := true;
  };

  public func deactivate() : async () {
    isActive := false;
  };
};
`;
  }

  generateDfxConfig() {
    const canisters = {};
    this.modules.forEach((module) => {
      canisters[module.actorName] = {
        type: "motoko",
        main: `src/${module.actorName}.mo`,
      };
    });

    return JSON.stringify(
      {
        canisters,
        defaults: {
          build: {
            packtool: "",
          },
        },
        output_env_file: ".env",
        version: 1,
      },
      null,
      2,
    );
  }

  generateDeployScript() {
    const names = [...this.modules.values()].map((module) => module.actorName);
    return `#!/usr/bin/env bash
set -euo pipefail

NETWORK="${this.network}"
MODULES=(${names.map((name) => JSON.stringify(name)).join(" ")})

if ! command -v dfx >/dev/null 2>&1; then
  echo "dfx is required but was not found on PATH" >&2
  exit 1
fi

echo "Deploying organism modules to network: ${this.network}"
dfx start --background --clean 2>/dev/null || true

for module in "\${MODULES[@]}"; do
  echo "Deploying $module"
  dfx deploy "$module" --network "$NETWORK"
done

echo "Deployment complete."
`;
  }

  getDeploymentPackage() {
    const wrappers = {};
    this.modules.forEach((module, moduleName) => {
      wrappers[`${module.actorName}.mo`] = this.generateMotokoWrapper(moduleName);
    });

    return {
      wrappers,
      dfxJson: this.generateDfxConfig(),
      deployScript: this.generateDeployScript(),
      moduleManifest: [...this.modules.values()].map((module) => ({
        name: module.name,
        actorName: module.actorName,
      })),
    };
  }
}

export function createBootstrap(config = {}) {
  return new OrganismBootstrap(config);
}

export function createStateManager() {
  return new StateManager();
}

export function createValidator() {
  return new DeploymentValidator();
}

export {
  HEARTBEAT_MS,
  HEARTBEAT_NS,
  PHI,
  PHI_INV,
};

export default {
  DeploymentValidator,
  HEARTBEAT_MS,
  HEARTBEAT_NS,
  OrganismBootstrap,
  PHI,
  PHI_INV,
  StateManager,
  createBootstrap,
  createStateManager,
  createValidator,
};
