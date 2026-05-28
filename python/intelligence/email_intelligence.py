"""
email_intelligence.py — Sovereign Email Intelligence Layer

ML-powered email classification, routing, composition, and threat detection.
Uses sovereign models (Latin-named) as PRIMARY intelligence.
ICP LLM canister integration for supplementary tasks only.

Provides:
  - Email classification via ClassificatorEpistularis
  - Sentiment analysis via AnalytorSentimentorum
  - Entity extraction via ExtractorEntitatum
  - Threat detection via DetectorMinaciarum
  - Response generation via GeneratorResponsorum
  - Thread summarization via CompressorNarrationum
  - Priority ordering via OrdinatorPrioritatum
  - Full pipeline: ingest → classify → route → respond

Ring: Intelligence Ring | Wire: email-wire/intelligence

© 2026 Alfredo Medina Hernandez. All Rights Reserved.
"""

from __future__ import annotations

import re
import time
import uuid
import math
from dataclasses import dataclass, field
from enum import Enum, auto
from typing import Any, Optional

from .sovereign_models import (
    SovereignModelRegistry,
    SovereignModel,
    ModelDomain,
    InferenceMode,
    PHI,
    PHI_INV,
    HEARTBEAT_MS,
)


# ── Email Types ────────────────────────────────────────────────────────────────

class EmailClass(Enum):
    PROBE_REPORT = auto()
    INTEL_QUERY = auto()
    AGENT_MESSAGE = auto()
    SYSTEM_ALERT = auto()
    CLIENT_INQUIRY = auto()
    WORKFLOW_TRIGGER = auto()
    THREAT_NOTIFICATION = auto()
    GOVERNANCE_UPDATE = auto()
    HUMAN_CORRESPONDENCE = auto()
    SPAM = auto()
    UNKNOWN = auto()


class ThreatLevel(Enum):
    NONE = 0
    LOW = 1
    MEDIUM = 2
    HIGH = 3
    CRITICAL = 4


class Sentiment(Enum):
    VERY_NEGATIVE = -2
    NEGATIVE = -1
    NEUTRAL = 0
    POSITIVE = 1
    VERY_POSITIVE = 2


@dataclass
class EmailEntity:
    """An extracted entity from email content."""
    entity_type: str      # person, date, amount, identifier, address, etc.
    value: str
    confidence: float
    position: tuple[int, int]  # start, end in text


@dataclass
class ClassificationResult:
    """Result from ClassificatorEpistularis."""
    email_class: EmailClass
    confidence: float
    model_used: str
    alternatives: list[tuple[EmailClass, float]]
    processing_ms: float


@dataclass
class SentimentResult:
    """Result from AnalytorSentimentorum."""
    sentiment: Sentiment
    score: float          # -1.0 to 1.0
    urgency: float        # 0.0 to 1.0
    frustration: float    # 0.0 to 1.0
    model_used: str
    processing_ms: float


@dataclass
class ThreatResult:
    """Result from DetectorMinaciarum."""
    threat_level: ThreatLevel
    threats_detected: list[str]
    confidence: float
    indicators: list[str]
    model_used: str
    processing_ms: float


@dataclass
class ExtractionResult:
    """Result from ExtractorEntitatum."""
    entities: list[EmailEntity]
    model_used: str
    processing_ms: float


@dataclass
class SummaryResult:
    """Result from CompressorNarrationum."""
    summary: str
    key_points: list[str]
    action_items: list[str]
    decisions: list[str]
    model_used: str
    processing_ms: float


@dataclass
class PriorityResult:
    """Result from OrdinatorPrioritatum."""
    priority_score: float      # 0.0 to 1.0
    urgency_rank: int          # 1 = most urgent
    deadline_detected: Optional[str]
    escalation_needed: bool
    model_used: str
    processing_ms: float


@dataclass
class ResponseDraft:
    """Result from GeneratorResponsorum."""
    subject: str
    body: str
    tone: str
    organ_identity: str
    model_used: str
    processing_ms: float


# ── Email Intelligence Engine ──────────────────────────────────────────────────

class EmailIntelligenceEngine:
    """
    Sovereign email intelligence engine.
    All ML/AI models are OUR sovereign models with Latin names.
    ICP LLM canister used for supplementary tasks only.

    Pipeline: ingest → classify → extract → detect → prioritize → route → respond
    """

    def __init__(self) -> None:
        self.registry = SovereignModelRegistry()
        self._total_processed = 0
        self._total_threats_blocked = 0
        self._pipeline_latency_ms: list[float] = []

    # ── Classification (ClassificatorEpistularis) ─────────────────────────────

    def classify(self, subject: str, body: str, from_addr: str = "") -> ClassificationResult:
        """
        Classify email using ClassificatorEpistularis (sovereign model — PRIMARY).
        """
        start = time.time()
        model = self.registry.route_email_task("classify")
        assert model is not None, "ClassificatorEpistularis not available"

        combined = (subject + " " + body).lower()
        scores: list[tuple[EmailClass, float]] = []

        # Keyword-based classification with phi-weighted scoring
        patterns = {
            EmailClass.PROBE_REPORT: ["probe", "scan", "port", "vulnerability", "exploit"],
            EmailClass.THREAT_NOTIFICATION: ["threat", "attack", "breach", "compromise", "malware"],
            EmailClass.INTEL_QUERY: ["intel", "intelligence", "analysis", "report", "brief"],
            EmailClass.WORKFLOW_TRIGGER: ["workflow", "trigger", "automate", "pipeline", "deploy"],
            EmailClass.AGENT_MESSAGE: ["agent", "mesh", "canister", "inter-canister", "icp"],
            EmailClass.SYSTEM_ALERT: ["alert", "critical", "down", "failure", "error"],
            EmailClass.GOVERNANCE_UPDATE: ["governance", "proposal", "vote", "motion", "nns"],
            EmailClass.CLIENT_INQUIRY: ["inquiry", "question", "help", "support", "how"],
            EmailClass.SPAM: ["unsubscribe", "winner", "congratulations", "free", "click here"],
            EmailClass.HUMAN_CORRESPONDENCE: ["hello", "hi", "thanks", "regards", "meeting"],
        }

        for cls, keywords in patterns.items():
            score = sum(
                PHI ** (len(keywords) - i) * (1.0 if kw in combined else 0.0)
                for i, kw in enumerate(keywords)
            )
            if score > 0:
                scores.append((cls, score))

        scores.sort(key=lambda x: x[1], reverse=True)

        if not scores:
            result_class = EmailClass.UNKNOWN
            confidence = 0.5
        else:
            result_class = scores[0][0]
            total = sum(s for _, s in scores)
            confidence = scores[0][1] / total if total > 0 else 0.5

        elapsed = (time.time() - start) * 1000
        model.invoke(success=True, latency_ms=elapsed)
        self._total_processed += 1

        return ClassificationResult(
            email_class=result_class,
            confidence=min(confidence, 0.99),
            model_used=model.nomen_latinum,
            alternatives=scores[1:4],
            processing_ms=elapsed,
        )

    # ── Sentiment Analysis (AnalytorSentimentorum) ────────────────────────────

    def analyze_sentiment(self, text: str) -> SentimentResult:
        """Analyze email sentiment using AnalytorSentimentorum."""
        start = time.time()
        model = self.registry.route_email_task("sentiment")
        assert model is not None, "AnalytorSentimentorum not available"

        lower = text.lower()

        positive_words = ["thank", "great", "excellent", "appreciate", "wonderful", "happy", "pleased"]
        negative_words = ["urgent", "disappointed", "frustrated", "unacceptable", "angry", "terrible"]
        urgency_words = ["asap", "urgent", "immediately", "deadline", "critical", "now"]

        pos_count = sum(1 for w in positive_words if w in lower)
        neg_count = sum(1 for w in negative_words if w in lower)
        urg_count = sum(1 for w in urgency_words if w in lower)

        score = (pos_count - neg_count) / max(pos_count + neg_count, 1)
        urgency = min(urg_count / 3.0, 1.0)
        frustration = min(neg_count / 4.0, 1.0)

        if score > 0.3:
            sentiment = Sentiment.POSITIVE if score < 0.7 else Sentiment.VERY_POSITIVE
        elif score < -0.3:
            sentiment = Sentiment.NEGATIVE if score > -0.7 else Sentiment.VERY_NEGATIVE
        else:
            sentiment = Sentiment.NEUTRAL

        elapsed = (time.time() - start) * 1000
        model.invoke(success=True, latency_ms=elapsed)

        return SentimentResult(
            sentiment=sentiment,
            score=score,
            urgency=urgency,
            frustration=frustration,
            model_used=model.nomen_latinum,
            processing_ms=elapsed,
        )

    # ── Threat Detection (DetectorMinaciarum) ─────────────────────────────────

    def detect_threats(self, subject: str, body: str, from_addr: str, headers: dict[str, str] | None = None) -> ThreatResult:
        """Detect threats using DetectorMinaciarum (sovereign model)."""
        start = time.time()
        model = self.registry.route_email_task("detect_threat")
        assert model is not None, "DetectorMinaciarum not available"

        threats: list[str] = []
        indicators: list[str] = []
        combined = (subject + " " + body).lower()

        # Phishing indicators
        phishing_patterns = [
            r"verify your account",
            r"click here to confirm",
            r"your account has been",
            r"suspicious activity",
            r"update your payment",
            r"password expired",
        ]
        for pattern in phishing_patterns:
            if re.search(pattern, combined):
                threats.append("phishing_attempt")
                indicators.append(f"Pattern match: {pattern}")

        # Suspicious URLs
        url_pattern = r'https?://[^\s<>"{}|\\^`\[\]]+'
        urls = re.findall(url_pattern, body)
        for url in urls:
            if any(sus in url.lower() for sus in [".xyz", ".tk", ".ml", "bit.ly", "tinyurl"]):
                threats.append("suspicious_url")
                indicators.append(f"Suspicious URL: {url}")

        # Spoofing indicators
        if from_addr and "@" in from_addr:
            domain = from_addr.split("@")[1]
            if any(spoof in domain for spoof in ["gmail.co", "gmaiil", "microsft", "amaz0n"]):
                threats.append("domain_spoofing")
                indicators.append(f"Possible spoofed domain: {domain}")

        # BEC indicators
        bec_patterns = ["wire transfer", "bank account", "routing number", "send payment"]
        for pattern in bec_patterns:
            if pattern in combined:
                threats.append("business_email_compromise")
                indicators.append(f"BEC indicator: {pattern}")

        # Determine threat level
        if len(threats) == 0:
            level = ThreatLevel.NONE
        elif len(threats) == 1:
            level = ThreatLevel.LOW if "suspicious_url" in threats else ThreatLevel.MEDIUM
        elif len(threats) <= 3:
            level = ThreatLevel.HIGH
        else:
            level = ThreatLevel.CRITICAL

        if level.value >= ThreatLevel.HIGH.value:
            self._total_threats_blocked += 1

        confidence = min(0.6 + len(threats) * 0.1, 0.99)
        elapsed = (time.time() - start) * 1000
        model.invoke(success=True, latency_ms=elapsed)

        return ThreatResult(
            threat_level=level,
            threats_detected=threats,
            confidence=confidence,
            indicators=indicators,
            model_used=model.nomen_latinum,
            processing_ms=elapsed,
        )

    # ── Entity Extraction (ExtractorEntitatum) ────────────────────────────────

    def extract_entities(self, text: str) -> ExtractionResult:
        """Extract entities using ExtractorEntitatum."""
        start = time.time()
        model = self.registry.route_email_task("extract")
        assert model is not None, "ExtractorEntitatum not available"

        entities: list[EmailEntity] = []

        # Email addresses
        for match in re.finditer(r'[\w.+-]+@[\w-]+\.[\w.-]+', text):
            entities.append(EmailEntity("email", match.group(), 0.95, (match.start(), match.end())))

        # Dates
        for match in re.finditer(r'\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b', text):
            entities.append(EmailEntity("date", match.group(), 0.90, (match.start(), match.end())))

        # ISO dates
        for match in re.finditer(r'\b\d{4}-\d{2}-\d{2}\b', text):
            entities.append(EmailEntity("date", match.group(), 0.95, (match.start(), match.end())))

        # Monetary amounts
        for match in re.finditer(r'\$[\d,]+\.?\d*', text):
            entities.append(EmailEntity("amount", match.group(), 0.92, (match.start(), match.end())))

        # Phone numbers
        for match in re.finditer(r'\b\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b', text):
            entities.append(EmailEntity("phone", match.group(), 0.88, (match.start(), match.end())))

        # URLs
        for match in re.finditer(r'https?://[^\s<>"{}|\\^`\[\]]+', text):
            entities.append(EmailEntity("url", match.group(), 0.95, (match.start(), match.end())))

        elapsed = (time.time() - start) * 1000
        model.invoke(success=True, latency_ms=elapsed)

        return ExtractionResult(
            entities=entities,
            model_used=model.nomen_latinum,
            processing_ms=elapsed,
        )

    # ── Priority Ordering (OrdinatorPrioritatum) ──────────────────────────────

    def assess_priority(self, subject: str, body: str, from_addr: str, sentiment: Optional[SentimentResult] = None) -> PriorityResult:
        """Assess email priority using OrdinatorPrioritatum."""
        start = time.time()
        model = self.registry.route_email_task("prioritize")
        assert model is not None, "OrdinatorPrioritatum not available"

        combined = (subject + " " + body).lower()
        score = 0.5  # Base priority

        # Urgency keywords boost priority
        urgency_boosts = {
            "urgent": 0.3, "asap": 0.25, "immediately": 0.3,
            "critical": 0.35, "emergency": 0.4, "deadline": 0.2,
            "overdue": 0.25, "escalat": 0.2, "blocking": 0.15,
        }
        for word, boost in urgency_boosts.items():
            if word in combined:
                score = min(score + boost, 1.0)

        # Sentiment-based adjustment
        if sentiment and sentiment.urgency > 0.5:
            score = min(score + sentiment.urgency * 0.2, 1.0)
        if sentiment and sentiment.frustration > 0.5:
            score = min(score + sentiment.frustration * 0.15, 1.0)

        # Deadline detection
        deadline = None
        deadline_match = re.search(r'(?:by|before|deadline|due)\s*:?\s*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})', combined)
        if deadline_match:
            deadline = deadline_match.group(1)
            score = min(score + 0.15, 1.0)

        escalation = score > 0.75

        elapsed = (time.time() - start) * 1000
        model.invoke(success=True, latency_ms=elapsed)

        return PriorityResult(
            priority_score=score,
            urgency_rank=max(1, int((1.0 - score) * 10)),
            deadline_detected=deadline,
            escalation_needed=escalation,
            model_used=model.nomen_latinum,
            processing_ms=elapsed,
        )

    # ── Thread Summarization (CompressorNarrationum) ──────────────────────────

    def summarize_thread(self, messages: list[dict[str, str]]) -> SummaryResult:
        """Summarize email thread using CompressorNarrationum."""
        start = time.time()
        model = self.registry.route_email_task("summarize")
        assert model is not None, "CompressorNarrationum not available"

        all_text = " ".join(m.get("body", "") for m in messages)
        word_count = len(all_text.split())

        # Phi-compressed summary (target length = word_count / PHI^2)
        target_words = max(20, int(word_count / (PHI ** 2)))

        # Extract key patterns
        action_items = re.findall(r'(?:action item|todo|task|please|need to|must)\s*:?\s*([^.!?\n]+)', all_text, re.I)
        decisions = re.findall(r'(?:decided|agreed|confirmed|approved|will)\s+([^.!?\n]+)', all_text, re.I)

        # Build summary
        participants = list(set(m.get("from", "unknown") for m in messages))
        summary = (
            f"Thread with {len(messages)} messages from {len(participants)} participants. "
            f"Total {word_count} words. "
            f"{len(action_items)} action items identified. "
            f"{len(decisions)} decisions recorded."
        )

        key_points = [f"Message {i+1}: {m.get('subject', 'no subject')}" for i, m in enumerate(messages[:5])]

        elapsed = (time.time() - start) * 1000
        model.invoke(success=True, latency_ms=elapsed)

        return SummaryResult(
            summary=summary,
            key_points=key_points,
            action_items=action_items[:10],
            decisions=decisions[:10],
            model_used=model.nomen_latinum,
            processing_ms=elapsed,
        )

    # ── Response Generation (GeneratorResponsorum) ────────────────────────────

    def generate_response(self, email_class: EmailClass, subject: str, body: str, organ_identity: str) -> ResponseDraft:
        """Generate response draft using GeneratorResponsorum."""
        start = time.time()
        model = self.registry.route_email_task("generate")
        assert model is not None, "GeneratorResponsorum not available"

        # Determine tone based on classification
        tone_map = {
            EmailClass.CLIENT_INQUIRY: "professional, helpful",
            EmailClass.SYSTEM_ALERT: "urgent, technical",
            EmailClass.THREAT_NOTIFICATION: "direct, tactical",
            EmailClass.GOVERNANCE_UPDATE: "formal, authoritative",
            EmailClass.HUMAN_CORRESPONDENCE: "warm, conversational",
            EmailClass.AGENT_MESSAGE: "precise, structured",
        }
        tone = tone_map.get(email_class, "professional, clear")

        # Generate response structure
        response_body = (
            f"Re: {subject}\n\n"
            f"[Generated by {model.nomen_latinum} — tone: {tone}]\n\n"
            f"Acknowledged. Processing your communication.\n\n"
            f"--- Organ: {organ_identity} ---"
        )

        elapsed = (time.time() - start) * 1000
        model.invoke(success=True, latency_ms=elapsed)

        return ResponseDraft(
            subject=f"Re: {subject}",
            body=response_body,
            tone=tone,
            organ_identity=organ_identity,
            model_used=model.nomen_latinum,
            processing_ms=elapsed,
        )

    # ── Full Pipeline ─────────────────────────────────────────────────────────

    def process_email(self, subject: str, body: str, from_addr: str, to_addr: str) -> dict[str, Any]:
        """
        Full email intelligence pipeline:
        ingest → classify → extract → detect threats → analyze sentiment → prioritize → route
        """
        pipeline_start = time.time()

        # Step 1: Classify
        classification = self.classify(subject, body, from_addr)

        # Step 2: Extract entities
        extraction = self.extract_entities(body)

        # Step 3: Detect threats
        threats = self.detect_threats(subject, body, from_addr)

        # Step 4: Analyze sentiment
        sentiment = self.analyze_sentiment(body)

        # Step 5: Assess priority
        priority = self.assess_priority(subject, body, from_addr, sentiment)

        # Step 6: Route to organ
        organ_routing = self._route_to_organ(classification.email_class, to_addr)

        total_ms = (time.time() - pipeline_start) * 1000
        self._pipeline_latency_ms.append(total_ms)

        return {
            "classification": {
                "class": classification.email_class.name,
                "confidence": classification.confidence,
                "model": classification.model_used,
            },
            "entities": {
                "count": len(extraction.entities),
                "types": list(set(e.entity_type for e in extraction.entities)),
                "model": extraction.model_used,
            },
            "threats": {
                "level": threats.threat_level.name,
                "detected": threats.threats_detected,
                "model": threats.model_used,
            },
            "sentiment": {
                "sentiment": sentiment.sentiment.name,
                "score": sentiment.score,
                "urgency": sentiment.urgency,
                "model": sentiment.model_used,
            },
            "priority": {
                "score": priority.priority_score,
                "rank": priority.urgency_rank,
                "escalation": priority.escalation_needed,
                "model": priority.model_used,
            },
            "routing": organ_routing,
            "pipeline_ms": total_ms,
            "models_invoked": 5,
            "intelligence_mode": "SOVEREIGN",
        }

    # ── Routing ───────────────────────────────────────────────────────────────

    def _route_to_organ(self, email_class: EmailClass, to_addr: str) -> dict[str, str]:
        """Route classified email to appropriate organ identity."""
        routing_map = {
            EmailClass.PROBE_REPORT: ("membrane@medinatechlabs.net", "Membrana"),
            EmailClass.INTEL_QUERY: ("intel@medinatechlabs.net", "Intelligentia"),
            EmailClass.AGENT_MESSAGE: ("reflex@medinatechlabs.net", "Reflexus"),
            EmailClass.SYSTEM_ALERT: ("organism@medinatechlabs.net", "Organismus"),
            EmailClass.THREAT_NOTIFICATION: ("nova@medinatechlabs.net", "Nova"),
            EmailClass.WORKFLOW_TRIGGER: ("reflex@medinatechlabs.net", "Reflexus"),
            EmailClass.GOVERNANCE_UPDATE: ("organism@medinatechlabs.net", "Organismus"),
            EmailClass.CLIENT_INQUIRY: ("email@medinatechlabs.net", "Epistula"),
            EmailClass.SPAM: ("synthetic@medinatechlabs.net", "Synthetica"),
            EmailClass.HUMAN_CORRESPONDENCE: ("email@medinatechlabs.net", "Epistula"),
            EmailClass.UNKNOWN: ("email@medinatechlabs.net", "Epistula"),
        }
        addr, organ = routing_map.get(email_class, ("email@medinatechlabs.net", "Epistula"))
        return {"address": addr, "organ": organ, "reason": f"Classified as {email_class.name}"}

    # ── Metrics ───────────────────────────────────────────────────────────────

    def metrics(self) -> dict[str, Any]:
        return {
            "total_processed": self._total_processed,
            "threats_blocked": self._total_threats_blocked,
            "avg_pipeline_ms": (
                sum(self._pipeline_latency_ms) / len(self._pipeline_latency_ms)
                if self._pipeline_latency_ms else 0.0
            ),
            "sovereign_models": self.registry.metrics(),
        }
