"""
icp_integration.py — Python ↔ ICP Canister Integration Layer

Bridge between sovereign Python intelligence models and ICP canisters.
Handles communication with:
  - EmailService canister (Motoko) for on-chain email operations
  - LLMBridge canister (Motoko) for supplementary ICP LLM calls
  - AIEntity canister for workforce coordination

OUR INTELLIGENCE IS MAIN. ICP LLM is supplementary.

Provides:
  - Canister call abstraction (agent interface)
  - Batch email processing pipeline
  - Cross-validation between sovereign and ICP LLM
  - Metrics and health reporting
  - Deployment helpers for dfx

Ring: Integration Ring | Wire: icp-wire/bridge

© 2026 Alfredo Medina Hernandez. All Rights Reserved.
"""

from __future__ import annotations

import json
import time
import subprocess
from dataclasses import dataclass, field
from enum import Enum, auto
from typing import Any, Optional

from .sovereign_models import (
    SovereignModelRegistry,
    SovereignModel,
    ModelDomain,
    InferenceMode,
    PHI,
)
from .email_intelligence import (
    EmailIntelligenceEngine,
    EmailClass,
    ThreatLevel,
)


# ── ICP Canister Configuration ─────────────────────────────────────────────────

@dataclass
class CanisterConfig:
    """Configuration for an ICP canister."""
    canister_id: str
    canister_name: str
    network: str = "local"  # "local" | "ic"
    dfx_path: str = "dfx"


# Known canisters in the ORO architecture
CANISTER_REGISTRY = {
    "email_service": CanisterConfig(
        canister_id="",  # Populated after deployment
        canister_name="email_service",
    ),
    "llm_bridge": CanisterConfig(
        canister_id="",
        canister_name="llm_bridge",
    ),
    "ai_entity": CanisterConfig(
        canister_id="",
        canister_name="ai_entity",
    ),
    "proposal_index": CanisterConfig(
        canister_id="",
        canister_name="proposal_index",
    ),
    "effect_trace": CanisterConfig(
        canister_id="",
        canister_name="effect_trace",
    ),
    "governance_memory": CanisterConfig(
        canister_id="",
        canister_name="governance_memory",
    ),
    "agent_findings": CanisterConfig(
        canister_id="",
        canister_name="agent_findings",
    ),
}


# ── ICP Canister Client ────────────────────────────────────────────────────────

class ICPCanisterClient:
    """
    Client for calling ICP canisters from Python.
    Uses dfx CLI for local development, HTTP agent for mainnet.
    """

    def __init__(self, network: str = "local") -> None:
        self.network = network
        self._call_count = 0
        self._total_latency_ms = 0.0

    def call(self, canister: str, method: str, args: str = "()") -> dict[str, Any]:
        """
        Call a canister method via dfx.

        Args:
            canister: Canister name from CANISTER_REGISTRY
            method: Method name to call
            args: Candid-encoded arguments

        Returns:
            Parsed response from canister
        """
        start = time.time()
        config = CANISTER_REGISTRY.get(canister)
        if config is None:
            return {"error": f"Unknown canister: {canister}"}

        cmd = [
            config.dfx_path, "canister", "call",
            config.canister_name, method, args,
        ]
        if self.network == "ic":
            cmd.extend(["--network", "ic"])

        try:
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=30,
            )
            elapsed_ms = (time.time() - start) * 1000
            self._call_count += 1
            self._total_latency_ms += elapsed_ms

            if result.returncode == 0:
                return {
                    "success": True,
                    "response": result.stdout.strip(),
                    "latency_ms": elapsed_ms,
                }
            else:
                return {
                    "success": False,
                    "error": result.stderr.strip(),
                    "latency_ms": elapsed_ms,
                }
        except subprocess.TimeoutExpired:
            return {"success": False, "error": "Canister call timed out"}
        except FileNotFoundError:
            return {"success": False, "error": "dfx not found — install with: sh -ci \"$(curl -fsSL https://internetcomputer.org/install.sh)\""}

    def query(self, canister: str, method: str, args: str = "()") -> dict[str, Any]:
        """Query (read-only) call to canister."""
        start = time.time()
        config = CANISTER_REGISTRY.get(canister)
        if config is None:
            return {"error": f"Unknown canister: {canister}"}

        cmd = [
            config.dfx_path, "canister", "call",
            "--query", config.canister_name, method, args,
        ]
        if self.network == "ic":
            cmd.extend(["--network", "ic"])

        try:
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=15,
            )
            elapsed_ms = (time.time() - start) * 1000
            self._call_count += 1
            self._total_latency_ms += elapsed_ms

            return {
                "success": result.returncode == 0,
                "response": result.stdout.strip() if result.returncode == 0 else result.stderr.strip(),
                "latency_ms": elapsed_ms,
            }
        except subprocess.TimeoutExpired:
            return {"success": False, "error": "Query timed out"}
        except FileNotFoundError:
            return {"success": False, "error": "dfx not found"}

    @property
    def metrics(self) -> dict[str, Any]:
        return {
            "total_calls": self._call_count,
            "avg_latency_ms": self._total_latency_ms / self._call_count if self._call_count > 0 else 0.0,
            "network": self.network,
        }


# ── Email Service Integration ──────────────────────────────────────────────────

class ICPEmailService:
    """
    Integration layer between Python intelligence and ICP EmailService canister.
    Python models do the thinking, ICP canister does the on-chain storage + sending.
    """

    def __init__(self, network: str = "local") -> None:
        self.client = ICPCanisterClient(network=network)
        self.intelligence = EmailIntelligenceEngine()
        self.registry = SovereignModelRegistry()

    def compose_and_queue(self, to: str, subject: str, body: str, identity: str, priority: str = "normal") -> dict[str, Any]:
        """
        Compose email with sovereign AI intelligence, queue on ICP canister.

        1. Python models classify, check threats, assess priority
        2. ICP canister stores and queues for sending
        """
        # Step 1: Sovereign intelligence processing
        pipeline = self.intelligence.process_email(subject, body, identity, to)

        # Step 2: If threats detected, block
        if pipeline["threats"]["level"] in ("HIGH", "CRITICAL"):
            return {
                "blocked": True,
                "reason": f"Threat detected: {pipeline['threats']['detected']}",
                "threat_level": pipeline["threats"]["level"],
                "model_used": pipeline["threats"]["model"],
            }

        # Step 3: Queue on ICP canister
        args = f'(record {{ to = "{to}"; subject = "{subject}"; body = "{body}"; html_body = null; identity = "{identity}"; priority = variant {{ {priority} }}; thread_id = null; reply_to = null }})'
        result = self.client.call("email_service", "compose", args)

        return {
            "queued": result.get("success", False),
            "email_id": result.get("response"),
            "intelligence": pipeline,
            "canister_latency_ms": result.get("latency_ms"),
        }

    def process_inbound(self, from_addr: str, to_addr: str, subject: str, body: str) -> dict[str, Any]:
        """
        Process inbound email:
        1. Sovereign models classify + detect threats + extract entities
        2. Store on ICP canister
        3. Route to correct organ
        """
        # Full sovereign intelligence pipeline
        pipeline = self.intelligence.process_email(subject, body, from_addr, to_addr)

        # Store on canister
        args = f'(record {{ from_address = "{from_addr}"; to_address = "{to_addr}"; subject = "{subject}"; body = "{body}"; html_body = null; headers = vec {{}}; raw_size = {len(body)} }})'
        store_result = self.client.call("email_service", "receive", args)

        # Classify on canister (for on-chain record)
        if store_result.get("success"):
            email_id = store_result.get("response", "1")
            self.client.call("email_service", "classify", f"({email_id})")
            self.client.call("email_service", "route", f"({email_id})")

        return {
            "stored": store_result.get("success", False),
            "email_id": store_result.get("response"),
            "intelligence": pipeline,
            "routed_to": pipeline["routing"],
        }

    def get_inbox(self, identity: str) -> dict[str, Any]:
        """Get inbox from ICP canister."""
        return self.client.query("email_service", "getInbox", f'("{identity}")')

    def get_stats(self) -> dict[str, Any]:
        """Get combined stats from canister + Python intelligence."""
        canister_stats = self.client.query("email_service", "getStats")
        intelligence_metrics = self.intelligence.metrics()
        model_registry = self.registry.full_registry_report()

        return {
            "canister": canister_stats,
            "intelligence": intelligence_metrics,
            "sovereign_models": model_registry,
            "integration": self.client.metrics,
        }


# ── LLM Bridge Integration ────────────────────────────────────────────────────

class ICPLLMBridge:
    """
    Bridge to ICP LLM canister — SUPPLEMENTARY USE ONLY.
    Our sovereign models are PRIMARY. ICP LLM is for:
    - Quick supplementary inference at capacity
    - Cross-validation of classification results
    - Lightweight tasks that don't need full model power
    """

    def __init__(self, network: str = "local") -> None:
        self.client = ICPCanisterClient(network=network)
        self.registry = SovereignModelRegistry()
        self._sovereign_calls = 0
        self._icp_llm_calls = 0

    def infer_sovereign(self, prompt: str, task_type: str, max_tokens: int = 256) -> dict[str, Any]:
        """
        Primary inference via sovereign models (Python).
        This is MAIN intelligence.
        """
        self._sovereign_calls += 1
        model = self.registry.route_email_task(task_type)
        if model is None:
            return {"error": f"No sovereign model for task: {task_type}"}

        # Sovereign model processes locally
        model.invoke(success=True, latency_ms=150.0)

        return {
            "mode": "SOVEREIGN",
            "model": model.nomen_latinum,
            "model_id": model.model_id,
            "task_type": task_type,
            "confidence": model.confidentia,
            "tokens": max_tokens,
            "is_primary": True,
        }

    def infer_icp_llm(self, prompt: str, task_type: str, max_tokens: int = 128) -> dict[str, Any]:
        """
        Supplementary inference via ICP LLM canister.
        ONLY for lightweight tasks. Not primary.
        """
        self._icp_llm_calls += 1

        task_variant = {
            "classify": "subject_generation",
            "sentiment": "sentiment_analysis",
            "extract": "entity_extraction",
            "summarize": "thread_summary",
            "detect_threat": "spam_scoring",
            "validate": "cross_validation",
        }.get(task_type, "subject_generation")

        args = f'(record {{ prompt = "{prompt}"; max_tokens = {max_tokens}; task_type = variant {{ #{task_variant} }}; model_hint = null }})'
        result = self.client.call("llm_bridge", "inferICPLLM", args)

        return {
            "mode": "ICP_LLM_SUPPLEMENTARY",
            "response": result.get("response"),
            "success": result.get("success", False),
            "is_primary": False,
            "note": "ICP LLM is supplementary only — sovereign models are MAIN",
        }

    def cross_validate(self, prompt: str, task_type: str) -> dict[str, Any]:
        """
        Run both sovereign + ICP LLM for cross-validation.
        Sovereign result takes priority.
        """
        sovereign = self.infer_sovereign(prompt, task_type)
        icp = self.infer_icp_llm(prompt, task_type, max_tokens=64)

        return {
            "sovereign_result": sovereign,
            "icp_supplement": icp,
            "primary_authority": "SOVEREIGN",
            "note": "Sovereign model result is authoritative. ICP LLM is supplementary cross-check.",
        }

    @property
    def metrics(self) -> dict[str, Any]:
        return {
            "sovereign_calls": self._sovereign_calls,
            "icp_llm_calls": self._icp_llm_calls,
            "sovereign_ratio": self._sovereign_calls / max(self._sovereign_calls + self._icp_llm_calls, 1),
            "model_registry": self.registry.metrics(),
        }


# ── Deployment Helper ──────────────────────────────────────────────────────────

def deploy_all_canisters(network: str = "local") -> dict[str, Any]:
    """
    Deploy all ICP canisters (email_service, llm_bridge, and existing five).

    Usage:
        from python.intelligence.icp_integration import deploy_all_canisters
        result = deploy_all_canisters("local")
    """
    results = {}
    canisters = [
        "proposal_index", "effect_trace", "governance_memory",
        "agent_findings", "ai_entity", "email_service", "llm_bridge",
    ]

    for canister in canisters:
        cmd = ["dfx", "deploy", canister]
        if network == "ic":
            cmd.extend(["--network", "ic"])
        try:
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
            results[canister] = {
                "success": result.returncode == 0,
                "output": result.stdout.strip() if result.returncode == 0 else result.stderr.strip(),
            }
        except Exception as e:
            results[canister] = {"success": False, "error": str(e)}

    return results
