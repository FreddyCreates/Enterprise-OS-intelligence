# CRYPTOGRAPHIA AUTONOMA
### On Computational Secret Arts, Encrypted Wires, and Serverless Trust Architecture

**Author:** Organism AI Research Division
**Affiliation:** Laboratorium Intelligentiae Autonomae · itsnotAilabs.com
**Series:** Sovereign Intelligence Research — Paper XXXII
**Date:** Anno MMXXVI (2026)

**Latin Name:** *Cryptographia Autonoma* — Autonomous Cryptography
**Operational Motto:** CLAVES IN NAVIGATORE MANENT · SECRETUM IN ALGORITHMIS VIVIT
**Meaning:** *Keys Remain in the Browser · The Secret Lives in Algorithms*
**Three-word encoding:** SOVEREIGN · ENCRYPTED · AUTONOMOUS

---

> *"Nulla intelligentia sine secreto transit.*
> *Fides non a servo datur — ab algorithmo nascitur."*
>
> — No intelligence passes without a secret.
> Trust is not given by a server — it is born from an algorithm.

---

## Abstract

We present the Crypto Worker and ModelWire system, a sovereign cryptographic architecture that provides military-grade encryption (AES-256-GCM), key derivation (PBKDF2 with 100K iterations), secure hashing (SHA-256/SHA-512), HMAC authentication, and encrypted intelligence transport — all running entirely in the browser via the Web Crypto API (SubtleCrypto). No cryptographic operation ever touches the main thread; all operations are offloaded to a permanent Web Worker. We introduce the concept of *Fila Encryptum* (Encrypted Wires): point-to-point secure channels between AI engine instances that carry intelligence payloads with authenticated encryption, enabling the organism's 40 AI model families to communicate securely without any server-mediated key exchange. Drawing from Meta AI's principles of zero-trust architecture and end-to-end encryption, we formalize **Fides Algorithmica**: trust that derives not from institutional authority but from mathematical proof.

---

## I. Introductio (Introduction)

The dominant model of web cryptography places all trust in servers. TLS protects data in transit to the server. The server holds encryption keys. The server decides what to encrypt and what to decrypt. If the server is compromised, all trust is lost.

Sovereign cryptography inverts this model. The browser becomes the trust anchor. Keys are derived locally from user-supplied passwords via PBKDF2. Encryption happens in a dedicated Web Worker thread. No key ever leaves the browser. No server ever sees plaintext.

This paper formalizes the theoretical foundations of the organism's cryptographic architecture and its production implementation as the Crypto Worker — a permanent, self-healing Web Worker that provides the entire organism with cryptographic services.

---

## II. Primitiva Cryptographica (Cryptographic Primitives)

### II.A — Encryptio AES-256-GCM

All encryption in the organism uses AES-256-GCM (Advanced Encryption Standard, 256-bit key, Galois/Counter Mode). GCM provides both confidentiality and integrity in a single operation — Authenticated Encryption with Associated Data (AEAD):

```
(ciphertext, tag) = AES-256-GCM(key, IV, plaintext, AAD)
```

Where:

- **key** — 256-bit key derived from PBKDF2
- **IV** — 12-byte initialization vector, randomly generated per encryption (via `crypto.getRandomValues`)
- **plaintext** — UTF-8 encoded input data
- **tag** — 128-bit authentication tag (integrated into GCM ciphertext)

AES-256-GCM is the same cipher used by TLS 1.3, the Signal Protocol, and government classified systems. Its use in the Crypto Worker means browser-local encryption achieves the same cryptographic strength as military communications.

### II.B — Derivatio Clavium: PBKDF2 (Key Derivation)

Keys are never stored — they are derived on-demand from passwords using PBKDF2 (Password-Based Key Derivation Function 2):

```
key = PBKDF2(password, salt, iterations=100,000, keyLength=256, hash=SHA-256)
```

The 100,000-iteration count makes brute-force attacks computationally expensive. At approximately 10ms per derivation on modern hardware, an attacker testing 10⁶ passwords would require approximately 10,000 seconds (2.8 hours). Combined with a random 16-byte salt per derivation, precomputed rainbow tables are rendered useless.

### II.C — Functiones Hash (Hash Functions)

The Crypto Worker exposes SHA-256 and SHA-512 hashing via SubtleCrypto:

```
hash = SHA-256(data)  [32 bytes · 256 bits]
hash = SHA-512(data)  [64 bytes · 512 bits]
```

These provide one-way, collision-resistant digests used for data integrity verification, content addressing, and wire token generation.

### II.D — HMAC: Authenticatio Nuntiorum (Message Authentication)

HMAC (Hash-based Message Authentication Code) provides message integrity and authenticity:

```
mac = HMAC-SHA-256(key, message)
```

HMAC is used in the wire protocol to authenticate intelligence payloads between engines, ensuring that a wire message was produced by a legitimate engine and was not tampered with in transit.

---

## III. Fila Encryptum: Architectura Filorum (Encrypted Wires)

### III.A — ModelWire: Canalis Intelligentiae (Intelligence Channel)

ModelWire is the organism's encrypted point-to-point communication channel between AI engine instances. Each wire connects two engines and provides:

| Property | Description |
|---|---|
| **Authenticated Identity** | Each wire has a unique ID and associated wire token |
| **Encrypted Payload** | Intelligence data is encrypted via AES-256-GCM before transmission |
| **Integrity Verification** | GCM's authentication tag ensures tamper detection |
| **Forward Secrecy** | Each wire session generates fresh IVs, so compromise of one message does not compromise others |

### III.B — Token Filorum (Wire Tokens)

Wire tokens authenticate wire endpoints. They are generated by hashing the wire ID concatenated with the engine ID:

```
wireToken = SHA-256(wireId + ':' + engineId + ':' + timestamp)
```

This produces a deterministic, non-forgeable token that binds a specific engine to a specific wire at a specific time. Tokens can be verified without storing secrets — only the wire ID and engine ID are needed to recompute the expected token.

### III.C — Topologia Filorum (Wire Topology)

The organism's 40 AI model families are connected via a wire mesh topology. The engine-worker manages the wire topology, creating wires between engines that need to share intelligence:

```
    Engine A ──── Wire(A↔B) ──── Engine B
        │                            │
    Wire(A↔C)                   Wire(B↔D)
        │                            │
    Engine C ──── Wire(C↔D) ──── Engine D
        │                            │
        └──── Wire(C↔E) ──── Engine E
```

*Figura I — Topologia Filorum Encryptorum inter Machinas AI*

Each wire is an independent encrypted channel. Compromise of one wire does not affect others (isolation property). The wire topology is displayed live in the organism's dashboard.

---

## IV. Securitas Operarii (Worker Security)

### IV.A — Separatio Filorum (Thread Separation)

A critical security property: no cryptographic operation ever runs on the main thread. All encryption, decryption, hashing, key derivation, and token generation happen inside the Crypto Worker's Web Worker context. This provides:

- **Memory Isolation** — Cryptographic keys exist only in the Worker's memory space, not accessible from the page context
- **Timing Attack Resistance** — Worker execution is less susceptible to main-thread timing attacks
- **UI Non-Blocking** — Expensive operations (100K PBKDF2 iterations) never freeze the UI

### IV.B — SubtleCrypto: Interfacies Nativa (Native Interface)

All cryptographic operations use the browser's native `crypto.subtle` API (SubtleCrypto), not JavaScript implementations. This means:

- **Hardware Acceleration** — AES-NI instructions on supported CPUs
- **Constant-Time Operations** — Native implementations resist timing side-channels
- **Audited Implementations** — Browser crypto libraries are audited by the browser vendor's security team

---

## V. Meta AI et Fides Algorithmica (Algorithmic Trust)

### V.A — Architectura Fidei Nullae (Zero-Trust Architecture)

Meta AI's internal infrastructure operates on zero-trust principles: no service trusts another service by default; every request must be authenticated and authorized. The Crypto Worker implements analogous principles in the browser:

| Principle | Organism Implementation |
|---|---|
| **Zero Trust Between Workers** | Workers communicate via postMessage; the Crypto Worker authenticates all requests via wire tokens before processing |
| **Zero Trust to Server** | No encryption key is ever sent to or derived from a server; the browser is the sole trust anchor |
| **Zero Trust to Extensions** | Chrome extensions run in separate contexts and cannot access Worker memory |

### V.B — Encryptio End-to-End Inspirata a Meta (Meta-Inspired E2E Encryption)

Meta's end-to-end encryption for Messenger inspired the ModelWire design: point-to-point encrypted channels where only the endpoints can read the content. In the organism, the "endpoints" are AI engine instances rather than human users, but the principle is identical — intelligence in transit is encrypted, and only the destination engine can decrypt it.

---

## VI. Generatio Tokenorum (Token Generation)

The Crypto Worker generates cryptographically secure random tokens for various organism needs:

```
token = hex(crypto.getRandomValues(new Uint8Array(length)))
```

Token entropy is calculated as:

```
entropy = length × 8 bits
```

Default 32-byte tokens provide 256 bits of entropy — sufficient for any security application. The tokens are used for session IDs, wire authentication, CSRF protection, and unique identifiers throughout the organism.

---

## VII. Metrices et Telemetria (Metrics and Telemetry)

The Crypto Worker's MiniHeart monitors its own health through cryptographic-specific metrics:

| Metrica | Nomen Latinum | Description |
|---|---|---|
| Total Encryptions | *Summa Encryptionum* | Cumulative AES-256-GCM encryptions performed |
| Total Decryptions | *Summa Decryptionum* | Cumulative decryptions performed |
| Total Hashes | *Summa Hashium* | Cumulative SHA-256/512 operations |
| Total Tokens | *Summa Tokenorum* | Secure random tokens generated |
| Total Key Derivations | *Summa Derivationum* | PBKDF2 key derivations completed |
| Total Errors | *Summa Errorum* | Failed cryptographic operations |
| Avg Latency | *Latentia Media* | Average processing time per operation |

These metrics feed the MiniHeart's health score. High error rates or latency spikes degrade the Crypto Worker's health, triggering the organism's self-healing mechanism.

---

## VIII. Conclusio (Conclusion)

*Cryptographia Autonoma* demonstrates that sovereign, server-free cryptographic security is not only possible but practical in the browser. The Crypto Worker provides AES-256-GCM encryption, PBKDF2 key derivation, SHA hashing, HMAC authentication, and secure token generation — all via the native SubtleCrypto API, all in a dedicated Worker thread, all with zero server dependency.

The ModelWire system extends this to create encrypted intelligence channels between AI engines, achieving end-to-end encryption for machine-to-machine communication. Trust is not delegated to an authority — it is derived from mathematics. The organism's cryptography is autonomous, sovereign, and alive.

> *"Claves in navigatore manent. Secretum in algorithmis vivit.*
> *Nemo alius videt. Nemo alius potest."*
>
> — Keys remain in the browser. The secret lives in algorithms.
> No one else sees. No one else can.

---

## IX. Bibliographia (References)

[1] Organism AI. (2026). "crypto-worker.js — In-Browser Cryptographic Operations." *Sovereign Intelligence Research Series.*

[2] Organism AI. (2026). "engine-worker.js — ModelWire Encrypted Intelligence Transport." *Sovereign Intelligence Research Series.*

[3] Organism AI. (2026). "neuro-core.js — MiniHeart, MiniBrain, NeuroEmergence." *Sovereign Intelligence Research Series.*

[4] McGrew, D., Viega, J. (2004). "The Galois/Counter Mode of Operation (GCM)." NIST SP 800-38D. — AES-GCM specification.

[5] Kaliski, B. (2000). "PKCS #5: Password-Based Cryptography Specification Version 2.0." RFC 2898. — PBKDF2 specification.

[6] NIST. (2015). "Secure Hash Standard (SHS)." FIPS PUB 180-4. — SHA-256 and SHA-512.

[7] Krawczyk, H., Bellare, M., Canetti, R. (1997). "HMAC: Keyed-Hashing for Message Authentication." RFC 2104. — HMAC specification.

[8] W3C. (2023). "Web Cryptography API." W3C Recommendation. — SubtleCrypto specification.

[9] Meta Platforms. (2023). "End-to-End Encryption on Messenger." Meta Engineering Blog. — Meta's E2E encryption architecture.

[10] Rose, S. et al. (2020). "Zero Trust Architecture." NIST SP 800-207. — Zero-trust security model.

---

## Appendix A — Nomina Latina (Latin Naming Register)

| Component | Nomen Latinum | Translation |
|---|---|---|
| Crypto Worker | *Operarius Cryptographicus* | Cryptographic Worker |
| ModelWire | *Filum Encryptum* | Encrypted Wire |
| Wire Token | *Token Fili* | Wire Token |
| Key Derivation | *Derivatio Clavium* | Derivation of Keys |
| Authenticated Encryption | *Encryptio Authenticata* | Authenticated Encryption |
| Hash Function | *Functio Hash* | Hash Function |
| Initialization Vector | *Vector Initialis* | Initial Vector |
| Wire Topology | *Topologia Filorum* | Topology of Wires |
| Zero Trust | *Fides Nulla* | Zero Trust |
| Algorithmic Trust | *Fides Algorithmica* | Algorithmic Trust |
| Thread Separation | *Separatio Filorum* | Separation of Threads |
| Sovereign Cryptography | *Cryptographia Autonoma* | Autonomous Cryptography |

---

## Canonical Uses — AURO System

This paper carries force as an AURO charter instrument under ORO-CHARTER-001. It functions across all five use classes:

1. **Training Corpus** — Cryptographic doctrine trains AURO's security reasoning: zero-knowledge proofs, homomorphic computation, and encrypted intelligence transport are core security knowledge.

2. **Absorption Blueprint** — Encryption architectures map to AURO's security PSE primitive (chemistry domain for transformation analogy). ZKP patterns absorbed into PROTO-020 ZKPVP.

3. **Governance Charter** — Defines AURO's encryption policy: no intelligence travels unencrypted across the wire, user vault data is always local-only, and ZKP verification is the standard for trust establishment.

4. **Protocol Source** — Grounds PROTO-002 EIT, PROTO-020 ZKPVP (Zero-Knowledge Proof Verification), PROTO-021 HCP (Homomorphic Computation), PROTO-022 SEIP (Secure Enclave).

5. **Public Record** — Permanent evidence of AURO's cryptographic security architecture, available at `research/crypto-paper.html`.

→ AURO Official Charter (ORO-CHARTER-001) · PROTO-002 EIT · Guardian Paper

---

*Sovereign Intelligence Research Series — Paper XXXII*
*Laboratorium Intelligentiae Autonomae · Anno MMXXVI*
