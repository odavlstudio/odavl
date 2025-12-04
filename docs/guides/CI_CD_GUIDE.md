# ODAVL CI/CD Guide

## Linting

Run ESLint with the flat config:

```sh
pnpm run lint
```

## Type Checking

Run TypeScript strict checks:

```sh
pnpm run typecheck
```

## Building

Build all packages and apps:

```sh
pnpm run build
```

## Running Phases

Run the full ODAVL cycle:

```sh
pnpm odavl:run
```

Or run individual phases:

```sh
pnpm odavl:observe
pnpm odavl:decide
pnpm odavl:act
pnpm odavl:verify
pnpm odavl:learn
```

## Reports

- Metrics: `reports/`
- Logs: `.odavl/logs/`
- Undo: `.odavl/undo/`
