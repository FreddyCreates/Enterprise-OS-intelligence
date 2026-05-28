/**
 * VOXIS base agent.
 *
 * Every PARRALAX agent extends this class. The base enforces the doctrine
 * (Paper IV) at the language level:
 *
 *   - the doctrine block is read on every beat, via readDoctrine()
 *   - the block's signature is verified every time
 *   - on failure, the agent halts; the .alive flag flips false
 *   - the agent emits actions ONLY through propose(), which is the only
 *     output channel
 *
 * Subclasses implement onBeat() to do their work. They DO NOT decide
 * whether to act — they propose. The propose() call passes through the
 * Authority Charter's COGNOVEX governance filter (Layer 5), which checks
 * capability, scope, and capital limits, and then defers to CUSTOS.
 *
 * This file is a SKELETON. The propose() pipeline that wires authority +
 * CUSTOS + kill-switch is filled out in later commits per the implementation
 * roadmap (PLAN § 7 Phase 1.4).
 */

import type {
  VoxisAuthority,
  Capability,
} from '../types/voxis.js';
import type {
  PrincipalId,
  VoxisId,
} from '../types/common.js';
import { readDoctrine } from '../voxis/authority.js';
import type { SignatureVerifier } from '../voxis/authority.js';

export type AgentStatus =
  | 'sleeping'
  | 'alive'
  | 'halted_doctrine_violation'
  | 'halted_kill_switch'
  | 'halted_demoted';

export interface AgentContext {
  readonly verifier: SignatureVerifier;
  readonly heartbeatMs: number;          // default 873 (Paper IV / SCP)
}

export abstract class BaseAgent {
  protected status:   AgentStatus = 'sleeping';
  protected doctrine: VoxisAuthority | null = null;
  protected lastBeatAt: number | null = null;

  constructor(
    protected readonly initialAuthority: VoxisAuthority,
    protected readonly ctx:              AgentContext,
  ) {}

  /** The agent's id, lifted from its doctrine. */
  get id(): VoxisId { return this.initialAuthority.voxisId; }

  /** The principal that signs receipts for this agent. */
  get principal(): PrincipalId {
    return ('auto:agent:' + this.id) as PrincipalId;
  }

  /** Returns whether the agent currently holds a given capability. */
  protected hasCapability(cap: Capability): boolean {
    if (!this.doctrine) return false;
    return this.doctrine.capabilities.includes(cap);
  }

  /**
   * Run one heartbeat:
   *   1. Re-read and re-verify the doctrine block.
   *   2. If invalid, halt and return.
   *   3. Otherwise call the subclass's onBeat().
   *
   * The agent NEVER calls onBeat() without a successful doctrine read.
   * Doctrine first, every beat. This is the Paper IV invariant.
   */
  async beat(): Promise<void> {
    if (this.status === 'halted_doctrine_violation') return;
    if (this.status === 'halted_kill_switch')        return;
    if (this.status === 'halted_demoted')            return;

    const result = await readDoctrine(this.initialAuthority, this.ctx.verifier);
    if (!result.ok) {
      this.status   = 'halted_doctrine_violation';
      this.doctrine = null;
      // TODO (next commit): emit `voxis_doctrine_violation` CHRONO entry.
      return;
    }

    this.doctrine    = result.authority;
    this.status      = 'alive';
    this.lastBeatAt  = Date.now();

    await this.onBeat();
  }

  /**
   * Subclass implements its specific work here. Has access to:
   *   this.doctrine          — frozen, verified VoxisAuthority
   *   this.hasCapability()   — capability check helper
   *
   * Subclasses do NOT directly cause side effects. They propose actions
   * which the agent's propose() method routes through the gates.
   */
  protected abstract onBeat(): Promise<void>;

  /** Externally readable status (for the operator dashboard). */
  getStatus(): { readonly status: AgentStatus; readonly lastBeatAt: number | null } {
    return Object.freeze({ status: this.status, lastBeatAt: this.lastBeatAt });
  }
}
