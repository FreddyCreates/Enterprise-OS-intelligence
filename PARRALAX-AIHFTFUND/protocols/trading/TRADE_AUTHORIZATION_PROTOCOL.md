# TRADE AUTHORIZATION PROTOCOL

## Rule

Signals do not authorize trades by themselves.

## Required checks

1. strategy exists in registry
2. agent authority level is sufficient
3. risk gates pass
4. governance override does not block action
5. receipt is written

## Output

- approve
- reject
- escalate
