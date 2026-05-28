"""
intelligence — Sovereign AI Intelligence Package

Python-native ML/AI models for the Medina Intelligence Organism.
All models use full Latin nomenclature. Our intelligence is MAIN.

Modules:
  - sovereign_models: Full model registry (16 Latin-named sovereign models)
  - email_intelligence: Email ML pipeline (classify, detect, extract, generate)
  - icp_integration: Python ↔ ICP canister bridge
  - organism_ai: Multi-model orchestration engine

© 2026 Alfredo Medina Hernandez. All Rights Reserved.
"""

from .sovereign_models import SovereignModelRegistry, SovereignModel, ModelDomain
from .email_intelligence import EmailIntelligenceEngine, EmailClass, ThreatLevel
from .icp_integration import ICPEmailService, ICPLLMBridge

__all__ = [
    "SovereignModelRegistry",
    "SovereignModel",
    "ModelDomain",
    "EmailIntelligenceEngine",
    "EmailClass",
    "ThreatLevel",
    "ICPEmailService",
    "ICPLLMBridge",
]
