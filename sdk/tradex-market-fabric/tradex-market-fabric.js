/**
 * TRADEX MARKET FABRIC — Complementary Product for TRADEX + ITP
 * RSHIP ID: RSHIP-2026-TRADEFABRIC-001
 *
 * TRADE FABRIC sits above TRADEX and the Intelligence Transfer Protocol,
 * coordinating multi-agent strategy propagation, venue intelligence, and
 * ecosystem-level resilience metrics.
 */

import { PHI, PHI_INV } from '../../rship-framework.js';
import TRADEX from '../tradex-agi/tradex-agi.js';
import IntelligenceTransferProtocol from '../../protocols/intelligence-transfer-protocol.js';

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
  }

  registerNode(nodeId, tradexInstance = null) {
    const node = tradexInstance || new TRADEX();
    this.tradexNodes.set(nodeId, {
      node,
      joinedAt: Date.now(),
      health: 'healthy',
      lastHeartbeat: Date.now(),
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

    const averageVaR = nodes.length
      ? nodes.reduce((sum, n) => sum + (n.status.metrics.currentVaR || 0), 0) / nodes.length
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

  status() {
    return {
      rshipId: TRADEFABRIC.RSHIP_ID,
      version: TRADEFABRIC.VERSION,
      nodes: this.tradexNodes.size,
      transferHistory: this.transferProtocol.transferHistory.length,
      ecosystemEvents: this.ecosystemLog.length,
      config: this.config,
    };
  }
}

export default TRADEFABRIC;
