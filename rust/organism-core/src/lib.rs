use aes_gcm::aead::{Aead, KeyInit};
use aes_gcm::{Aes256Gcm, Nonce};
use base64::{engine::general_purpose::STANDARD as B64, Engine as _};
use ed25519_dalek::{Keypair, PublicKey, Signature, Signer, Verifier};
use hkdf::Hkdf;
use rand::rngs::OsRng;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::fmt::{Display, Formatter};

pub const PHI: f64 = 1.618_033_988_749_895;
pub const PHI_INV: f64 = 1.0 / PHI;
pub const HEARTBEAT_MS: u64 = 873;

#[derive(Debug)]
pub enum OrganismError {
    InvalidKeyLength,
    InvalidNonce,
    EncryptionFailed,
    DecryptionFailed,
    SignatureFailed,
    SerializationFailed(String),
}

impl Display for OrganismError {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::InvalidKeyLength => write!(f, "invalid AES-256 key length"),
            Self::InvalidNonce => write!(f, "invalid nonce"),
            Self::EncryptionFailed => write!(f, "encryption failed"),
            Self::DecryptionFailed => write!(f, "decryption failed"),
            Self::SignatureFailed => write!(f, "signature verification failed"),
            Self::SerializationFailed(msg) => write!(f, "serialization failed: {msg}"),
        }
    }
}

impl std::error::Error for OrganismError {}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EncryptedPayload {
    pub nonce: String,
    pub ciphertext: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OrganismEnvelope {
    pub id: String,
    pub payload_type: String,
    pub recipient: String,
    pub sender_pubkey: String,
    pub timestamp_ms: u128,
    pub payload: EncryptedPayload,
    pub signature: String,
}

pub fn phi_score(priority: u8, capability: f64, reputation: f64) -> f64 {
    PHI.powf(4.0 - priority as f64) * capability * reputation
}

pub fn phi_ema(previous: f64, observation: f64) -> f64 {
    PHI_INV * observation + (1.0 - PHI_INV) * previous
}

pub fn phi_decay(value: f64, steps: usize) -> f64 {
    value / PHI.powf(steps as f64)
}

pub fn sha256_hex(data: &[u8]) -> String {
    hex::encode(Sha256::digest(data))
}

pub fn blake3_hex(data: &[u8]) -> String {
    blake3::hash(data).to_hex().to_string()
}

pub fn derive_key(master: &[u8], salt: &[u8], info: &[u8]) -> Result<[u8; 32], OrganismError> {
    let hk = Hkdf::<Sha256>::new(Some(salt), master);
    let mut key = [0u8; 32];
    hk.expand(info, &mut key)
        .map_err(|_| OrganismError::InvalidKeyLength)?;
    Ok(key)
}

pub fn generate_signing_key() -> Keypair {
    Keypair::generate(&mut OsRng)
}

pub fn encrypt(key: &[u8], plaintext: &[u8]) -> Result<EncryptedPayload, OrganismError> {
    if key.len() != 32 {
        return Err(OrganismError::InvalidKeyLength);
    }

    let cipher = Aes256Gcm::new_from_slice(key).map_err(|_| OrganismError::InvalidKeyLength)?;
    let nonce_bytes: [u8; 12] = rand::random();
    let nonce = Nonce::from_slice(&nonce_bytes);
    let ciphertext = cipher
        .encrypt(nonce, plaintext)
        .map_err(|_| OrganismError::EncryptionFailed)?;

    Ok(EncryptedPayload {
        nonce: B64.encode(nonce_bytes),
        ciphertext: B64.encode(ciphertext),
    })
}

pub fn decrypt(key: &[u8], payload: &EncryptedPayload) -> Result<Vec<u8>, OrganismError> {
    if key.len() != 32 {
        return Err(OrganismError::InvalidKeyLength);
    }

    let cipher = Aes256Gcm::new_from_slice(key).map_err(|_| OrganismError::InvalidKeyLength)?;
    let nonce_bytes = B64
        .decode(&payload.nonce)
        .map_err(|_| OrganismError::InvalidNonce)?;
    if nonce_bytes.len() != 12 {
        return Err(OrganismError::InvalidNonce);
    }
    let nonce = Nonce::from_slice(&nonce_bytes);
    let ciphertext = B64
        .decode(&payload.ciphertext)
        .map_err(|_| OrganismError::DecryptionFailed)?;

    cipher
        .decrypt(nonce, ciphertext.as_ref())
        .map_err(|_| OrganismError::DecryptionFailed)
}

pub fn sign_bytes(signing_key: &Keypair, message: &[u8]) -> String {
    hex::encode(signing_key.sign(message).to_bytes())
}

pub fn verify_bytes(public_key: &PublicKey, message: &[u8], signature_hex: &str) -> Result<(), OrganismError> {
    let signature_bytes = hex::decode(signature_hex).map_err(|_| OrganismError::SignatureFailed)?;
    let signature = Signature::try_from(signature_bytes.as_slice()).map_err(|_| OrganismError::SignatureFailed)?;
    public_key
        .verify(message, &signature)
        .map_err(|_| OrganismError::SignatureFailed)
}

pub fn seal_message(
    encryption_key: &[u8],
    signing_key: &Keypair,
    payload_type: &str,
    recipient: &str,
    plaintext: &[u8],
) -> Result<OrganismEnvelope, OrganismError> {
    let payload = encrypt(encryption_key, plaintext)?;
    let sender_pubkey = hex::encode(signing_key.public.to_bytes());
    let timestamp_ms = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map_err(|_| OrganismError::SerializationFailed("system time before epoch".into()))?
        .as_millis();
    let mut envelope = OrganismEnvelope {
        id: format!("env-{timestamp_ms:x}-{:016x}", rand::random::<u64>()),
        payload_type: payload_type.to_string(),
        recipient: recipient.to_string(),
        sender_pubkey,
        timestamp_ms,
        payload,
        signature: String::new(),
    };

    let signable = serde_json::to_vec(&(
        &envelope.id,
        &envelope.payload_type,
        &envelope.recipient,
        &envelope.sender_pubkey,
        envelope.timestamp_ms,
        &envelope.payload,
    ))
    .map_err(|err| OrganismError::SerializationFailed(err.to_string()))?;
    envelope.signature = sign_bytes(signing_key, &signable);
    Ok(envelope)
}

pub fn open_message(encryption_key: &[u8], envelope: &OrganismEnvelope) -> Result<Vec<u8>, OrganismError> {
    let pubkey_bytes = hex::decode(&envelope.sender_pubkey).map_err(|_| OrganismError::SignatureFailed)?;
    let public_key = PublicKey::from_bytes(&pubkey_bytes).map_err(|_| OrganismError::SignatureFailed)?;

    let signable = serde_json::to_vec(&(
        &envelope.id,
        &envelope.payload_type,
        &envelope.recipient,
        &envelope.sender_pubkey,
        envelope.timestamp_ms,
        &envelope.payload,
    ))
    .map_err(|err| OrganismError::SerializationFailed(err.to_string()))?;
    verify_bytes(&public_key, &signable, &envelope.signature)?;
    decrypt(encryption_key, &envelope.payload)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn encrypt_roundtrip() {
        let key = derive_key(b"master", b"salt", b"organism").unwrap();
        let payload = encrypt(&key, b"trace verify remember").unwrap();
        let plaintext = decrypt(&key, &payload).unwrap();
        assert_eq!(plaintext, b"trace verify remember");
    }

    #[test]
    fn seal_and_open_message() {
        let key = derive_key(b"master", b"salt", b"wire").unwrap();
        let signing_key = generate_signing_key();
        let envelope = seal_message(&key, &signing_key, "governance", "effect-trace", b"payload").unwrap();
        let plaintext = open_message(&key, &envelope).unwrap();
        assert_eq!(plaintext, b"payload");
    }
}
