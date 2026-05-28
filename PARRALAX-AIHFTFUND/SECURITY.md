# SECURITY

## Principles

- no secrets in repository
- no live API keys in code
- no unrestricted agent credentials
- no treasury movement without receipts
- no silent privilege escalation

## Sensitive surfaces

- broker credentials
- exchange credentials
- wallet keys
- treasury permissions
- governance authority
- deployment secrets

## Requirements

- environment-based secret loading only
- per-agent scoped credentials
- auditable permission changes
- signed receipts for privileged actions
- explicit kill-switch path
