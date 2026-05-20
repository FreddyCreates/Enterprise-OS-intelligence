/**
 * TRADEX MARKET FABRIC — Complementary Product for TRADEX + ITP
 * RSHIP ID: RSHIP-2026-TRADEFABRIC-001
 *
 * TRADEX MARKET FABRIC sits above TRADEX and the Intelligence Transfer Protocol,
 * coordinating multi-agent strategy propagation, venue intelligence, and
 * ecosystem-level resilience metrics.
 */

import { PHI, PHI_INV } from '../../rship-framework.js';

const MIN_NODE_WEIGHT_FLOOR = 0.0001;
import TRADEX from '../tradex-agi/tradex-agi.js';
import IntelligenceTransferProtocol from '../../protocols/intelligence-transfer-protocol.js';
import TRADEXToolForge from '../tradex-toolforge/tradex-toolforge.js';
import BLUNTTools from '../blunt-tools/blunt-tools.js';
import ALPHAToolMesh from '../alpha-toolmesh/alpha-toolmesh.js';

export class TRADEFABRIC {
  static RSHIP_ID = 'RSHIP-2026-TRADEFABRIC-001';
  static VERSION = '1.0.0';

  constructor(config = {}) {
    this.config = {
      enableKnowledgePropagation: true,
      enableCrossNodeRebalancing: true,
      ...config,
    };

    this.tradexNodes = new Map();
    this.transferProtocol = new IntelligenceTransferProtocol();
    this.transferBridge = this.transferProtocol.createTradingBridge('TRADEFABRIC');
    this.ecosystemLog = [];
    this.toolForge = new TRADEXToolForge();
    this.networkRegistry = new Map();
    this.dataRegistry = new Map();
    this.bluntTools = new BLUNTTools();
    this.alphaToolMesh = new ALPHAToolMesh();
  }

  registerNode(nodeId, tradexInstance = null, nodeWeight = 1) {
    const node = tradexInstance || new TRADEX();
    this.tradexNodes.set(nodeId, {
      node,
      joinedAt: Date.now(),
      health: 'healthy',
      lastHeartbeat: Date.now(),
      nodeWeight: Math.max(MIN_NODE_WEIGHT_FLOOR, nodeWeight),
    });

    return {
      registered: true,
      nodeId,
      nodeCount: this.tradexNodes.size,
    };
  }

  async propagatePlaybook(playbook = {}) {
    if (!this.config.enableKnowledgePropagation) {
      return { propagated: false, reason: 'Knowledge propagation disabled' };
    }

    const targets = Array.from(this.tradexNodes.keys());
    const transferResult = await this.transferBridge.distributePlaybook(targets, playbook);

    this.ecosystemLog.push({
      type: 'playbook_propagation',
      timestamp: Date.now(),
      targets: targets.length,
      success: transferResult.successful,
      failed: transferResult.failed,
    });

    return transferResult;
  }

  aggregateNodeStatus() {
    const nodes = Array.from(this.tradexNodes.entries()).map(([id, data]) => ({
      nodeId: id,
      status: data.node.status(),
      joinedAt: data.joinedAt,
      health: data.health,
    }));

    const weighted = nodes.map(n => ({
      varValue: n.status.metrics.currentVaR || 0,
      weight: this.tradexNodes.get(n.nodeId).nodeWeight || 1,
    }));

    const totalWeight = weighted.reduce((s, x) => s + x.weight, 0);
    const averageVaR = totalWeight > 0
      ? weighted.reduce((sum, x) => sum + x.varValue * x.weight, 0) / totalWeight
      : 0;

    return {
      nodeCount: nodes.length,
      averageVaR,
      ecosystemRiskBand: averageVaR > PHI_INV ? 'elevated' : 'normal',
      nodes,
    };
  }

  recommendEcosystemActions() {
    const snapshot = this.aggregateNodeStatus();
    const actions = [];

    if (snapshot.ecosystemRiskBand === 'elevated') {
      actions.push('Reduce gross exposure by φ⁻¹ factor across nodes');
      actions.push('Increase hedge ratio and narrow execution windows');
    } else {
      actions.push('Maintain balanced allocation and monitor regime drift');
    }

    if (snapshot.nodeCount >= 3) {
      actions.push('Enable cross-node pair-neutral deployments');
    }

    return {
      timestamp: Date.now(),
      nodeCount: snapshot.nodeCount,
      actions,
    };
  }


  registerNetworkNode(nodeId, peers = [], latencyMs = null) {
    this.networkRegistry.set(nodeId, {
      peers,
      latencyMs,
      updatedAt: Date.now(),
    });
    return { registered: true, nodeId, networkNodes: this.networkRegistry.size };
  }

  ingestDataStream(streamId, metadata = {}) {
    this.dataRegistry.set(streamId, {
      ...metadata,
      updatedAt: Date.now(),
    });
    return { ingested: true, streamId, streams: this.dataRegistry.size };
  }

  registerPersistentTool(name, executor, metadata = {}) {
    return this.toolForge.registerTool(name, executor, metadata);
  }

  async runPersistentTool(name, payload = {}, context = {}) {
    return this.toolForge.runTool(name, payload, context);
  }

  getPersistentToolRun(runId) {
    return this.toolForge.getRun(runId);
  }

  combineEcosystemIntelligence() {
    const status = this.aggregateNodeStatus();
    const networkNodes = this.networkRegistry.size;
    const dataStreams = this.dataRegistry.size;

    return {
      timestamp: Date.now(),
      tradingNodes: status.nodeCount,
      networkNodes,
      dataStreams,
      ecosystemRiskBand: status.ecosystemRiskBand,
      toolforge: this.toolForge.status(),
    };
  }


  registerBluntProductTool(name, executor, metadata = {}) {
    return this.bluntTools.register(name, executor, metadata);
  }

  registerAlphaProductTool(name, executor, metadata = {}) {
    return this.alphaToolMesh.registerAlpha(name, executor, metadata);
  }

  async runBluntProductTool(name, payload = {}, context = {}) {
    return this.bluntTools.run(name, payload, context);
  }

  async runAlphaProductTool(name, payload = {}, context = {}) {
    return this.alphaToolMesh.run(name, payload, context);
  }

  registerAlphaNetworkNode(nodeId, peers = []) {
    return this.alphaToolMesh.registerNode(nodeId, peers);
  }

  registerAlphaDataDomain(domainId, meta = {}) {
    return this.alphaToolMesh.registerDataDomain(domainId, meta);
  }

  crossEcosystemStatus() {
    return {
      timestamp: Date.now(),
      toolForge: this.toolForge.status(),
      crossEcosystem: this.crossEcosystemStatus(),
      blunt: this.bluntTools.status(),
      alpha: this.alphaToolMesh.status(),
    };
  }

  status() {
    return {
      rshipId: TRADEFABRIC.RSHIP_ID,
      version: TRADEFABRIC.VERSION,
      nodes: this.tradexNodes.size,
      transferHistory: this.transferProtocol.transferHistory.length,
      ecosystemEvents: this.ecosystemLog.length,
      config: this.config,
      networkNodes: this.networkRegistry.size,
      dataStreams: this.dataRegistry.size,
      toolForge: this.toolForge.status(),
      crossEcosystem: this.crossEcosystemStatus(),
    };
  }
}

export default TRADEFABRIC;
