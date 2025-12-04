# Playbook: Unify Config & Types

- Refactor configs to use env vars, not hardcoded paths.
- Remove environment-specific keys from config files.
- Align config types across environments.

## Verify

- No hardcoded paths or env-specific keys in configs.
- All configs load via env vars or safe defaults.
