# Playbook: Micro Performance Tweaks

- Refactor to avoid `await` in loops; batch async ops.
- Minimize `JSON.parse` in hot paths.
- Profile and optimize slowest code sections.

## Verify

- No `await` in loops or excessive `JSON.parse` in hot paths.
- Measurable perf improvement in benchmarks.
