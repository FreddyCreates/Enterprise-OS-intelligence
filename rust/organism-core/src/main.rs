use organism_core::{
    blake3_hex, derive_key, generate_signing_key, open_message, phi_ema, phi_score, seal_message, sha256_hex,
};

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let key = derive_key(
        b"organism-master-secret",
        b"organism-salt-v1",
        b"organism-demo-envelope",
    )?;
    let signing_key = generate_signing_key();
    let message = b"TRACE · VERIFY · REMEMBER";

    let envelope = seal_message(&key, &signing_key, "demo", "organism-demo", message)?;
    let opened = open_message(&key, &envelope)?;

    let output = serde_json::json!({
        "phi_score_example": phi_score(3, 0.92, 0.84),
        "phi_ema_example": phi_ema(0.75, 0.91),
        "sha256": sha256_hex(message),
        "blake3": blake3_hex(message),
        "envelope_id": envelope.id,
        "recipient": envelope.recipient,
        "payload_type": envelope.payload_type,
        "opened": String::from_utf8(opened)?,
    });

    println!("{}", serde_json::to_string_pretty(&output)?);
    Ok(())
}
