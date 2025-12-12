# ODAVL Insight Runtime Tests

This directory contains minimal sample projects for validating ODAVL Insight detectors in real runtime environments.

## Projects

| Project | Language | Purpose | Issues Included |
|---------|----------|---------|-----------------|
| `react-sample/` | JavaScript/React | React app validation | Bad imports, unused variables |
| `nextjs-sample/` | TypeScript/Next.js | Next.js App Router testing | Hook misuse, anti-patterns |
| `node-api-sample/` | JavaScript/Node | Express API testing | Hardcoded secrets, blocking code |
| `python-sample/` | Python | Python detector validation | Type errors, security risks |
| `go-sample/` | Go | Go concurrency testing | Race conditions, deadlocks |
| `java-sample/` | Java | Java detector validation | Null safety, inefficient loops |
| `rust-sample/` | Rust | Rust ownership testing | Panic usage, unused variables |

## Usage

Run Insight detectors against each sample:

```bash
# From odavl-studio/insight/core/
pnpm odavl:insight

# Or using the CLI:
odavl insight analyze --path ../runtime-tests/react-sample
odavl insight analyze --path ../runtime-tests/nextjs-sample
# ... etc.
```

## Expected Detections

Each project intentionally includes 2+ issues that specific detectors should catch:

- **TypeScript Detector**: Import errors, type mismatches
- **Security Detector**: Hardcoded secrets, SQL injection risks
- **Performance Detector**: Blocking operations, inefficient patterns
- **Python Detectors**: Type hints, security, complexity
- **Go Detector**: Concurrency issues, resource leaks
- **Java Detector**: Null pointer risks, stream misuse
- **Rust Detector**: Panic usage, ownership violations

## Project Structure

Each sample is a minimal but runnable/parseable project:
- Has correct project structure (package.json, go.mod, pom.xml, Cargo.toml)
- Can be parsed by respective language tools
- Contains intentional anti-patterns for detector validation
- Should NOT be used as reference code (intentionally bad!)

## Maintenance

These projects are for testing only. Do NOT:
- Use as production code examples
- Remove intentional issues (they're the test cases!)
- Modify without updating this README
