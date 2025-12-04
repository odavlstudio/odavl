# Playbook: Harden FS/Net Access

- Replace direct `fs`, `net`, `child_process` usage with safe wrappers.
- Audit for unsafe patterns (see detector).
- Add input validation and error handling.
- Document all external calls.

## Verify

- No direct `fs`, `net`, `child_process` imports remain.
- All file/network/process access is via wrappers.
