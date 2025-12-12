# ODAVL Marketplace

**Extension ecosystem and developer publishing platform for ODAVL Studio.**

## Architecture

```
marketplace/
├── index.ts              # Express service (port 8085)
├── registry.ts           # Package registry
├── publisher.ts          # Publishing workflow
├── resolver.ts           # Dependency resolver
├── models/               # Data models
│   ├── package.ts
│   ├── version.ts
│   └── manifest.ts
└── storage/              # Storage adapters
    ├── local-adapter.ts
    └── cloud-adapter.ts
```

## Publishing Workflow

1. Developer creates extension (detector/recipe/rule/model)
2. Run `odavl publish <type> <path>`
3. CLI validates manifest
4. CLI generates version (semver)
5. CLI uploads to marketplace
6. Registry updates
7. Package discoverable via `/marketplace/search`

## API Endpoints

### GET /marketplace/packages
List all published packages.

### GET /marketplace/package/:id
Get package details.

### GET /marketplace/search?q=query
Search packages by name or description.

### POST /marketplace/install
Install a package (body: `{ packageId: string }`).

## Package Types

- **Detector** (Insight): Custom error detection
- **Recipe** (Autopilot): Auto-fix patterns
- **Rule** (Guardian): Website testing rules
- **Model** (Intelligence): Predictive ML models

## Storage

- Local: `.odavl/marketplace/packages/`
- Cloud: S3/Azure/GCS (stub)
