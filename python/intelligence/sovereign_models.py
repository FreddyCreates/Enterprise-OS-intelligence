"""
sovereign_models.py — Sovereign Intelligence Model Registry

ALL models with FULL LATIN NOMENCLATURE. These are OUR models — MAIN intelligence.
The ICP LLM canister is supplementary only. Our sovereign models are primary.

Provides:
  - Full Latin-named model registry (16 sovereign models)
  - Model capability scoring with phi-weighted evaluation
  - Task routing to appropriate sovereign model
  - Model lifecycle: birth → training → active → retired
  - Integration hooks for ICP canister bridge

Ring: Intelligence Ring | Wire: sovereign-wire/models

© 2026 Alfredo Medina Hernandez. All Rights Reserved.
"""

from __future__ import annotations

import math
import time
import uuid
from dataclasses import dataclass, field
from enum import Enum, auto
from typing import Any, Optional


# ── Constants ──────────────────────────────────────────────────────────────────

PHI = 1.618033988749895
PHI_INV = 1.0 / PHI
HEARTBEAT_MS = 873


# ── Enums ──────────────────────────────────────────────────────────────────────

class ModelDomain(Enum):
    CLASSIFICATIO = auto()     # Classification
    SENTIMENTUM = auto()       # Sentiment analysis
    EXTRACTIO = auto()         # Entity extraction
    GENERATIO = auto()         # Text generation
    DETECTIO = auto()          # Threat/anomaly detection
    ORDINATIO = auto()         # Priority ordering
    COMPRESSIO = auto()        # Summarization
    VALIDATIO = auto()         # Validation
    COGNITIO = auto()          # Pattern recognition
    ARCHITECTURA = auto()      # Response structuring
    INTERPRETATIO = auto()     # Translation
    CURATIO = auto()           # Memory curation
    ARBITRATIO = auto()        # Fact checking
    NAVIGATIO = auto()         # Relationship mapping
    PRAEDICTIO = auto()        # Prediction
    COMPOSITIO = auto()        # Document composition


class ModelStatus(Enum):
    NASCENS = auto()      # Being born / initialized
    DISCENS = auto()      # Training / learning
    ACTIVUS = auto()      # Active / serving
    QUIESCENS = auto()    # Dormant / idle
    EMERITUS = auto()     # Retired with honor


class InferenceMode(Enum):
    SOVEREIGN = auto()    # Our model — primary
    ICP_LLM = auto()      # ICP LLM canister — supplementary only
    CROSS_VALID = auto()  # Both — for validation


# ── Sovereign Model Definitions ────────────────────────────────────────────────

@dataclass
class SovereignModel:
    """A sovereign intelligence model with full Latin nomenclature."""

    model_id: str
    nomen_latinum: str           # Full Latin name
    nomen_breve: str             # Short operational name
    dominium: ModelDomain        # Domain of expertise
    descriptio: str              # Latin description
    capacitas: str               # Capability description (English)
    status: ModelStatus = ModelStatus.ACTIVUS
    versio: str = "1.0.0"
    confidentia: float = 0.90   # Base confidence
    latentia_ms: float = 150.0  # Base latency
    invocationes: int = 0       # Total invocations
    successus: int = 0          # Successful completions
    reputatio: float = 0.85     # Phi-EMA reputation
    natus_tempus: float = field(default_factory=time.time)

    @property
    def success_rate(self) -> float:
        return self.successus / self.invocationes if self.invocationes > 0 else 0.0

    @property
    def phi_score(self) -> float:
        return self.reputatio * PHI * self.confidentia

    def invoke(self, success: bool = True, latency_ms: float = 150.0) -> None:
        """Record an invocation outcome with phi-EMA reputation update."""
        self.invocationes += 1
        if success:
            self.successus += 1
        self.reputatio = (
            PHI_INV * (1.0 if success else 0.0)
            + (1.0 - PHI_INV) * self.reputatio
        )
        self.latentia_ms = PHI_INV * latency_ms + (1.0 - PHI_INV) * self.latentia_ms


# ── THE SOVEREIGN MODEL REGISTRY ──────────────────────────────────────────────
# ALL MODELS — FULL LATIN NAMES — OUR INTELLIGENCE IS MAIN

SOVEREIGN_REGISTRY: list[SovereignModel] = [

    # ─── 1. ClassificatorEpistularis ──────────────────────────────────────────
    SovereignModel(
        model_id="classificator-epistularis-v1",
        nomen_latinum="ClassificatorEpistularis",
        nomen_breve="ClassEpist",
        dominium=ModelDomain.CLASSIFICATIO,
        descriptio="Classificator epistularum — intentionem, categoriam, urgentiam determinat",
        capacitas="Email classification: intent detection, category assignment, urgency scoring. "
                  "Primary classifier for all inbound email. Routes to correct organ identity.",
        confidentia=0.94,
        latentia_ms=120.0,
    ),

    # ─── 2. AnalytorSentimentorum ─────────────────────────────────────────────
    SovereignModel(
        model_id="analytor-sentimentorum-v1",
        nomen_latinum="AnalytorSentimentorum",
        nomen_breve="AnalSent",
        dominium=ModelDomain.SENTIMENTUM,
        descriptio="Analytor sensuum — tonum emotivum, urgentiam, satisfactionem metitur",
        capacitas="Deep sentiment analysis: emotional tone mapping, urgency detection, "
                  "satisfaction scoring, frustration indicators, escalation triggers.",
        confidentia=0.91,
        latentia_ms=180.0,
    ),

    # ─── 3. ExtractorEntitatum ────────────────────────────────────────────────
    SovereignModel(
        model_id="extractor-entitatum-v1",
        nomen_latinum="ExtractorEntitatum",
        nomen_breve="ExtrEnt",
        dominium=ModelDomain.EXTRACTIO,
        descriptio="Extractor entitatum — nomina, datas, quantitates, identifiers extrahit",
        capacitas="Full entity extraction: names, dates, monetary amounts, identifiers, "
                  "addresses, phone numbers, contract references, case numbers.",
        confidentia=0.93,
        latentia_ms=140.0,
    ),

    # ─── 4. GeneratorResponsorum ──────────────────────────────────────────────
    SovereignModel(
        model_id="generator-responsorum-v1",
        nomen_latinum="GeneratorResponsorum",
        nomen_breve="GenResp",
        dominium=ModelDomain.GENERATIO,
        descriptio="Generator responsorum — responsa contextualia componit",
        capacitas="Contextual response generation: draft replies matching organ voice, "
                  "personality, and signature. Adapts tone to recipient and thread context.",
        confidentia=0.89,
        latentia_ms=250.0,
    ),

    # ─── 5. DetectorMinaciarum ────────────────────────────────────────────────
    SovereignModel(
        model_id="detector-minaciarum-v1",
        nomen_latinum="DetectorMinaciarum",
        nomen_breve="DetMin",
        dominium=ModelDomain.DETECTIO,
        descriptio="Detector minaciarum — phishing, malware, ingenieria socialis detegit",
        capacitas="Threat detection: phishing identification, malware link detection, "
                  "social engineering patterns, BEC fraud, spoofing, impersonation.",
        confidentia=0.96,
        latentia_ms=100.0,
    ),

    # ─── 6. OrdinatorPrioritatum ──────────────────────────────────────────────
    SovereignModel(
        model_id="ordinator-prioritatum-v1",
        nomen_latinum="OrdinatorPrioritatum",
        nomen_breve="OrdPrior",
        dominium=ModelDomain.ORDINATIO,
        descriptio="Ordinator prioritatum — triagium, urgentiam, positionem in coda ordinat",
        capacitas="Priority ordering: triage scoring, urgency ranking, queue positioning, "
                  "deadline detection, SLA compliance checking, escalation routing.",
        confidentia=0.92,
        latentia_ms=90.0,
    ),

    # ─── 7. CompressorNarrationum ─────────────────────────────────────────────
    SovereignModel(
        model_id="compressor-narrationum-v1",
        nomen_latinum="CompressorNarrationum",
        nomen_breve="CompNarr",
        dominium=ModelDomain.COMPRESSIO,
        descriptio="Compressor narrationum — puncta clavica ex longis catenis extrahit",
        capacitas="Thread summarization: extract key decisions, action items, blockers, "
                  "and resolution status from long email threads. Phi-compressed output.",
        confidentia=0.90,
        latentia_ms=200.0,
    ),

    # ─── 8. ValidatorIntentionis ──────────────────────────────────────────────
    SovereignModel(
        model_id="validator-intentionis-v1",
        nomen_latinum="ValidatorIntentionis",
        nomen_breve="ValIntent",
        dominium=ModelDomain.VALIDATIO,
        descriptio="Validator intentionis — classificationis accuratiam confirmat",
        capacitas="Intent validation: cross-check classification accuracy, confidence "
                  "calibration, misrouting detection, human-in-the-loop triggers.",
        confidentia=0.88,
        latentia_ms=110.0,
    ),

    # ─── 9. CognitorAnomaliarum ───────────────────────────────────────────────
    SovereignModel(
        model_id="cognitor-anomaliarum-v1",
        nomen_latinum="CognitorAnomaliarum",
        nomen_breve="CogAnom",
        dominium=ModelDomain.COGNITIO,
        descriptio="Cognitor anomaliarum — exemplaria insolita, mutationes in moribus detegit",
        capacitas="Anomaly detection: unusual communication patterns, behavioral shifts, "
                  "volume spikes, timing anomalies, new sender analysis.",
        confidentia=0.87,
        latentia_ms=160.0,
    ),

    # ─── 10. ArchitectusResponsorum ───────────────────────────────────────────
    SovereignModel(
        model_id="architectus-responsorum-v1",
        nomen_latinum="ArchitectusResponsorum",
        nomen_breve="ArchResp",
        dominium=ModelDomain.ARCHITECTURA,
        descriptio="Architectus responsorum — responsa multiplicia structurat",
        capacitas="Response architecture: multi-part reply structuring, attachment "
                  "planning, call-to-action placement, formatting decisions.",
        confidentia=0.86,
        latentia_ms=170.0,
    ),

    # ─── 11. InterpresLinguarum ───────────────────────────────────────────────
    SovereignModel(
        model_id="interpres-linguarum-v1",
        nomen_latinum="InterpresLinguarum",
        nomen_breve="IntLing",
        dominium=ModelDomain.INTERPRETATIO,
        descriptio="Interpres linguarum — translationem et localizationem praestat",
        capacitas="Language interpretation: multi-language translation, localization, "
                  "cultural adaptation, code-switching detection, language identification.",
        confidentia=0.89,
        latentia_ms=190.0,
    ),

    # ─── 12. CuratorMemoriae ──────────────────────────────────────────────────
    SovereignModel(
        model_id="curator-memoriae-v1",
        nomen_latinum="CuratorMemoriae",
        nomen_breve="CurMem",
        dominium=ModelDomain.CURATIO,
        descriptio="Curator memoriae — contextum conservat, historiam indicat",
        capacitas="Memory curation: conversation context preservation, history indexing, "
                  "contact relationship tracking, preference learning, recall optimization.",
        confidentia=0.91,
        latentia_ms=130.0,
    ),

    # ─── 13. ArbiterVeritatis ─────────────────────────────────────────────────
    SovereignModel(
        model_id="arbiter-veritatis-v1",
        nomen_latinum="ArbiterVeritatis",
        nomen_breve="ArbVer",
        dominium=ModelDomain.ARBITRATIO,
        descriptio="Arbiter veritatis — facta verificat, assertiones probat",
        capacitas="Truth arbitration: fact checking against knowledge base, claim "
                  "verification, source validation, contradiction detection.",
        confidentia=0.85,
        latentia_ms=220.0,
    ),

    # ─── 14. NavigatorRelationum ──────────────────────────────────────────────
    SovereignModel(
        model_id="navigator-relationum-v1",
        nomen_latinum="NavigatorRelationum",
        nomen_breve="NavRel",
        dominium=ModelDomain.NAVIGATIO,
        descriptio="Navigator relationum — graphum contactuum, exemplaria interactionum navigat",
        capacitas="Relationship navigation: contact graph traversal, interaction pattern "
                  "analysis, influence mapping, communication frequency tracking.",
        confidentia=0.88,
        latentia_ms=150.0,
    ),

    # ─── 15. PraedictorEventuum ───────────────────────────────────────────────
    SovereignModel(
        model_id="praedictor-eventuum-v1",
        nomen_latinum="PraedictorEventuum",
        nomen_breve="PraedEv",
        dominium=ModelDomain.PRAEDICTIO,
        descriptio="Praedictor eventuum — sequentia, terminos, escalationes anticipat",
        capacitas="Event prediction: anticipate follow-up emails, deadline reminders, "
                  "escalation likelihood, response time estimation, churn signals.",
        confidentia=0.84,
        latentia_ms=200.0,
    ),

    # ─── 16. CompositorDocumentorum ───────────────────────────────────────────
    SovereignModel(
        model_id="compositor-documentorum-v1",
        nomen_latinum="CompositorDocumentorum",
        nomen_breve="CompDoc",
        dominium=ModelDomain.COMPOSITIO,
        descriptio="Compositor documentorum — formam, structuram, adnexa componit",
        capacitas="Document composition: email formatting, structure optimization, "
                  "attachment handling, template selection, signature management.",
        confidentia=0.90,
        latentia_ms=160.0,
    ),
]


# ── Model Registry Manager ────────────────────────────────────────────────────

class SovereignModelRegistry:
    """
    Registry of all sovereign intelligence models.
    OUR MODELS ARE MAIN. ICP LLM canister is supplementary only.
    """

    def __init__(self) -> None:
        self._models: dict[str, SovereignModel] = {
            m.model_id: m for m in SOVEREIGN_REGISTRY
        }
        self._by_latin: dict[str, SovereignModel] = {
            m.nomen_latinum: m for m in SOVEREIGN_REGISTRY
        }
        self._by_domain: dict[ModelDomain, list[SovereignModel]] = {}
        for m in SOVEREIGN_REGISTRY:
            self._by_domain.setdefault(m.dominium, []).append(m)

    # ── Lookup ────────────────────────────────────────────────────────────────

    def get_by_id(self, model_id: str) -> Optional[SovereignModel]:
        return self._models.get(model_id)

    def get_by_latin_name(self, name: str) -> Optional[SovereignModel]:
        return self._by_latin.get(name)

    def get_by_domain(self, domain: ModelDomain) -> list[SovereignModel]:
        return self._by_domain.get(domain, [])

    def list_all(self) -> list[SovereignModel]:
        return list(self._models.values())

    def list_active(self) -> list[SovereignModel]:
        return [m for m in self._models.values() if m.status == ModelStatus.ACTIVUS]

    # ── Routing ───────────────────────────────────────────────────────────────

    def route_to_model(self, domain: ModelDomain) -> Optional[SovereignModel]:
        """Route to the best active model for a given domain."""
        candidates = [
            m for m in self._by_domain.get(domain, [])
            if m.status == ModelStatus.ACTIVUS
        ]
        if not candidates:
            return None
        return max(candidates, key=lambda m: m.phi_score)

    def route_email_task(self, task_type: str) -> Optional[SovereignModel]:
        """Route an email intelligence task to the appropriate sovereign model."""
        domain_map = {
            "classify": ModelDomain.CLASSIFICATIO,
            "sentiment": ModelDomain.SENTIMENTUM,
            "extract": ModelDomain.EXTRACTIO,
            "generate": ModelDomain.GENERATIO,
            "detect_threat": ModelDomain.DETECTIO,
            "prioritize": ModelDomain.ORDINATIO,
            "summarize": ModelDomain.COMPRESSIO,
            "validate": ModelDomain.VALIDATIO,
            "anomaly": ModelDomain.COGNITIO,
            "structure": ModelDomain.ARCHITECTURA,
            "translate": ModelDomain.INTERPRETATIO,
            "remember": ModelDomain.CURATIO,
            "verify": ModelDomain.ARBITRATIO,
            "navigate": ModelDomain.NAVIGATIO,
            "predict": ModelDomain.PRAEDICTIO,
            "compose": ModelDomain.COMPOSITIO,
        }
        domain = domain_map.get(task_type)
        if domain is None:
            return None
        return self.route_to_model(domain)

    # ── Metrics ───────────────────────────────────────────────────────────────

    def metrics(self) -> dict[str, Any]:
        active = self.list_active()
        total_invocations = sum(m.invocationes for m in active)
        total_success = sum(m.successus for m in active)
        return {
            "total_models": len(self._models),
            "active_models": len(active),
            "total_invocations": total_invocations,
            "global_success_rate": total_success / total_invocations if total_invocations > 0 else 0.0,
            "avg_reputation": sum(m.reputatio for m in active) / len(active) if active else 0.0,
            "avg_confidence": sum(m.confidentia for m in active) / len(active) if active else 0.0,
            "avg_latency_ms": sum(m.latentia_ms for m in active) / len(active) if active else 0.0,
            "top_model": max(active, key=lambda m: m.phi_score).nomen_latinum if active else None,
        }

    def full_registry_report(self) -> list[dict[str, Any]]:
        """Full registry report with all Latin names and capabilities."""
        return [
            {
                "model_id": m.model_id,
                "nomen_latinum": m.nomen_latinum,
                "nomen_breve": m.nomen_breve,
                "dominium": m.dominium.name,
                "descriptio": m.descriptio,
                "capacitas": m.capacitas,
                "status": m.status.name,
                "versio": m.versio,
                "confidentia": round(m.confidentia, 4),
                "reputatio": round(m.reputatio, 4),
                "phi_score": round(m.phi_score, 4),
                "invocationes": m.invocationes,
                "success_rate": round(m.success_rate, 4),
                "latentia_ms": round(m.latentia_ms, 1),
            }
            for m in self._models.values()
        ]
