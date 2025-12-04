# ODAVL Developer Guide

## Overview

ODAVL is an autonomous code quality system with five core phases:

### 1. Observe

Collects code quality metrics (ESLint warnings, TypeScript errors) and performance data. Stores results in timestamped JSON reports for trend analysis.

### 2. Decide

Analyzes observed metrics and trust scores to select the next action. Uses recipe trust to prioritize safe, effective improvements.

### 3. Act

Executes code fixes or improvements based on the decision phase. Applies ESLint, Prettier, or custom recipes. All actions are logged and auditable.

### 4. Verify

Runs shadow verification and quality gates. Ensures no new type errors or excessive lint warnings. Writes detailed verify reports and logs.

### 5. Learn

Analyzes verify reports to update trust scores for recipes. Appends learning insights and adjusts future decision confidence.

## Local Development

1. Clone the repo and install dependencies with `pnpm install`.
2. Run lint, build, and test using `pnpm lint && pnpm build && pnpm test`.
3. Use `pnpm doctor` (future) to run automated health diagnostics.

## Folder Structure

- apps/: main applications (CLI, website)
- packages/: core libraries and types
- scripts/: CI/CD and governance tools
- reports/: build, audit, and verification logs

## Coding Standards

- Max 40 LOC per commit, ≤10 files changed
- Protected paths: security/, *.spec.*, public-api/

## Best Practices

- Run each phase with `pnpm odavl:run <phase>`
- Review logs in `.odavl/logs/odavl.log`
- Use undo system for safe rollbacks
- All phases are modular and auditable
