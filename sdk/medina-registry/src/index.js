const PHI = 1.618033988749895;
const PHI_INV = 1 / PHI;

const BUILTIN_PACKAGES = [
  ["@medina/sovereign-cycle-protocol", "1.0.0", "873ms heartbeat protocol", ["protocol", "heartbeat", "phi"]],
  ["@medina/autonomous-division-protocol", "1.0.0", "AI division coordination protocol", ["protocol", "coordination", "fibonacci"]],
  ["@medina/neural-synchronization-protocol", "1.0.0", "21-species neurochemistry synchronization protocol", ["protocol", "neural", "oscillation"]],
  ["@medina/emergence-detection-protocol", "1.0.0", "Ising/Landau/percolation emergence detector", ["protocol", "emergence", "phase-transition"]],
  ["@medina/cognitive-memory-protocol", "1.0.0", "Working, episodic, and semantic memory protocol", ["protocol", "memory", "cognition"]],
  ["@medina/adaptive-learning-protocol", "1.0.0", "Lyapunov stability and antifragility protocol", ["protocol", "learning", "lyapunov"]],
  ["@medina/scalability-coordination-protocol", "1.0.0", "Swarm coordination and quorum sensing protocol", ["protocol", "swarm", "coordination"]],
  ["@medina/medina-heart", "1.0.0", "Self-bootstrapping biological heart", ["sdk", "heart", "bootstrap"]],
  ["@medina/medina-registry", "1.0.0", "Sovereign private package registry", ["sdk", "registry", "sovereign"]],
  ["@medina/organism-ai", "1.0.0", "Multi-model AI orchestration engine", ["sdk", "orchestration", "ai"]],
  ["@medina/medina-queries", "1.0.0", "Intelligence query engine", ["sdk", "queries", "search"]],
  ["@medina/protocol-composer", "1.0.0", "Protocol composition engine", ["sdk", "protocol", "composer"]],
  ["@medina/organism-bootstrap", "1.0.0", "ICP bootstrap helpers for organism deployment", ["sdk", "bootstrap", "icp"]],
  ["@medina/paralegal-ai", "0.1.0-alpha", "Legal professional AI", ["ai", "legal", "analysis"]],
  ["@medina/analyst-ai", "0.1.0-alpha", "Business analyst AI", ["ai", "business", "analysis"]],
  ["@medina/student-ai", "0.1.0-alpha", "Student learning AI", ["ai", "education", "student"]],
];

function hashString(input) {
  const text = String(input ?? "");
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = ((hash << 5) - hash + text.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function compareVersions(a, b) {
  const left = String(a).split(".").map((part) => parseInt(part, 10) || 0);
  const right = String(b).split(".").map((part) => parseInt(part, 10) || 0);
  const length = Math.max(left.length, right.length);
  for (let i = 0; i < length; i += 1) {
    const delta = (left[i] || 0) - (right[i] || 0);
    if (delta !== 0) {
      return delta;
    }
  }
  return 0;
}

function scoreTextMatch(query, text) {
  const q = String(query ?? "").trim().toLowerCase();
  const t = String(text ?? "").toLowerCase();
  if (!q || !t) {
    return 0;
  }
  if (t === q) {
    return PHI ** 3;
  }
  if (t.includes(q)) {
    return PHI ** 2 * (q.length / Math.max(t.length, q.length));
  }

  const qTokens = q.split(/\s+/).filter(Boolean);
  const tTokens = t.split(/\s+/).filter(Boolean);
  const shared = qTokens.filter((token) => tTokens.some((candidate) => candidate.includes(token)));
  if (shared.length === 0) {
    return 0;
  }

  return shared.reduce((sum, token, index) => sum + token.length * (PHI ** -(index + 1)), 0) / Math.max(q.length, 1);
}

function createPackageRecord(packageInfo, moduleExports = {}) {
  const now = Date.now();
  return {
    name: packageInfo.name,
    version: packageInfo.version,
    description: packageInfo.description || "",
    main: packageInfo.main || "src/index.js",
    keywords: Array.isArray(packageInfo.keywords) ? [...packageInfo.keywords] : [],
    dependencies: { ...(packageInfo.dependencies || {}) },
    author: packageInfo.author || "Medina Tech",
    exports: moduleExports,
    publishedAt: now,
    downloads: 0,
    installs: 0,
  };
}

export class SovereignRegistry {
  constructor({ preseed = true } = {}) {
    this.createdAt = Date.now();
    this._packages = new Map();
    this._installed = new Map();

    if (preseed) {
      this._registerBuiltins();
    }
  }

  _registerBuiltins() {
    BUILTIN_PACKAGES.forEach(([name, version, description, keywords]) => {
      this.publish(
        {
          name,
          version,
          description,
          keywords,
          author: "Medina Tech",
        },
        {
          packageName: name,
          version,
          builtIn: true,
        },
      );
    });
  }

  _ensurePackageStore(name) {
    if (!this._packages.has(name)) {
      this._packages.set(name, new Map());
    }
    return this._packages.get(name);
  }

  _resolveVersion(name, version = null) {
    const versions = this._packages.get(name);
    if (!versions || versions.size === 0) {
      return null;
    }
    if (version && versions.has(version)) {
      return version;
    }
    return [...versions.keys()].sort(compareVersions).at(-1) ?? null;
  }

  publish(packageInfo, moduleExports = {}) {
    if (!packageInfo?.name) {
      throw new Error("packageInfo.name is required");
    }
    if (!packageInfo?.version) {
      throw new Error("packageInfo.version is required");
    }

    const versions = this._ensurePackageStore(packageInfo.name);
    const record = createPackageRecord(packageInfo, moduleExports);
    versions.set(record.version, record);

    return {
      success: true,
      package: `${record.name}@${record.version}`,
      publishedAt: record.publishedAt,
    };
  }

  install(packageName, version = null) {
    const resolvedVersion = this._resolveVersion(packageName, version);
    if (!resolvedVersion) {
      throw new Error(`Package not found: ${packageName}${version ? `@${version}` : ""}`);
    }

    const record = this._packages.get(packageName).get(resolvedVersion);
    record.downloads += 1;
    record.installs += 1;

    const installRecord = {
      installedAt: Date.now(),
      package: `${record.name}@${record.version}`,
    };

    this._installed.set(record.name, installRecord);

    return {
      success: true,
      package: installRecord.package,
      installedAt: installRecord.installedAt,
      exports: record.exports,
      dependencies: { ...record.dependencies },
    };
  }

  list(filter = "") {
    const matcher = String(filter).trim().toLowerCase();
    return [...this._packages.keys()]
      .map((name) => this.getInfo(name))
      .filter(Boolean)
      .filter((record) => !matcher || record.name.toLowerCase().includes(matcher))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  search(query) {
    const q = String(query ?? "").trim();
    return this.list()
      .map((record) => {
        const keywordScore = (record.keywords || []).reduce(
          (sum, keyword, index) => sum + scoreTextMatch(q, keyword) * (PHI ** -(index + 1)),
          0,
        );
        const score =
          scoreTextMatch(q, record.name) * PHI +
          scoreTextMatch(q, record.description) +
          keywordScore;

        return {
          ...record,
          score: Number(score.toFixed(4)),
        };
      })
      .filter((record) => record.score > 0)
      .sort((a, b) => b.score - a.score);
  }

  getInfo(packageName, version = null) {
    const resolvedVersion = this._resolveVersion(packageName, version);
    if (!resolvedVersion) {
      return null;
    }

    const record = this._packages.get(packageName).get(resolvedVersion);
    const installRecord = this._installed.get(packageName);

    return {
      name: record.name,
      version: record.version,
      description: record.description,
      main: record.main,
      keywords: [...record.keywords],
      dependencies: { ...record.dependencies },
      downloads: record.downloads,
      installs: record.installs,
      publishedAt: record.publishedAt,
      installedAt: installRecord?.installedAt ?? null,
    };
  }

  getDependencyTree(packageName, version = null, seen = new Set()) {
    const resolvedVersion = this._resolveVersion(packageName, version);
    if (!resolvedVersion) {
      return null;
    }

    const identifier = `${packageName}@${resolvedVersion}`;
    if (seen.has(identifier)) {
      return {
        name: packageName,
        version: resolvedVersion,
        circular: true,
        dependencies: [],
      };
    }

    seen.add(identifier);
    const record = this._packages.get(packageName).get(resolvedVersion);
    const dependencies = Object.entries(record.dependencies || {}).map(([dependencyName, dependencyVersion]) =>
      this.getDependencyTree(dependencyName, dependencyVersion, new Set(seen)) || {
        name: dependencyName,
        version: dependencyVersion,
        missing: true,
        dependencies: [],
      },
    );

    return {
      name: packageName,
      version: resolvedVersion,
      dependencies,
    };
  }

  getStats() {
    const latestPackages = this.list();
    const topKeywords = new Map();
    let totalDownloads = 0;

    latestPackages.forEach((pkg) => {
      totalDownloads += pkg.downloads;
      (pkg.keywords || []).forEach((keyword) => {
        topKeywords.set(keyword, (topKeywords.get(keyword) || 0) + 1);
      });
    });

    return {
      totalPackages: latestPackages.length,
      totalDownloads,
      installedPackages: this._installed.size,
      topKeywords: [...topKeywords.entries()]
        .map(([keyword, count]) => ({ keyword, count }))
        .sort((a, b) => b.count - a.count || a.keyword.localeCompare(b.keyword))
        .slice(0, 10),
      registryAge: Date.now() - this.createdAt,
      phiSeal: hashString(`registry:${this.createdAt}`).toString(16),
    };
  }
}

const REGISTRY = new SovereignRegistry();

export function getRegistry() {
  return REGISTRY;
}

export function publish(packageInfo, moduleExports = {}) {
  return REGISTRY.publish(packageInfo, moduleExports);
}

export function install(packageName, version = null) {
  return REGISTRY.install(packageName, version);
}

export function list(filter = "") {
  return REGISTRY.list(filter);
}

export function search(query) {
  return REGISTRY.search(query);
}

export function getInfo(packageName, version = null) {
  return REGISTRY.getInfo(packageName, version);
}

export function getDependencyTree(packageName, version = null) {
  return REGISTRY.getDependencyTree(packageName, version);
}

export function getStats() {
  return REGISTRY.getStats();
}

export { BUILTIN_PACKAGES, PHI, PHI_INV };

export default {
  BUILTIN_PACKAGES,
  PHI,
  PHI_INV,
  SovereignRegistry,
  getDependencyTree,
  getInfo,
  getRegistry,
  getStats,
  install,
  list,
  publish,
  search,
};
