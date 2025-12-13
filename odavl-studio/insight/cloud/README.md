# @odavl-studio/insight-cloud (API-only)

Backend-only ingest service for ZCC-compliant snapshots.

## Local verification checklist

Environment (fake examples):

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/odavl_local"
INGEST_API_KEY="local-dev-key"
INGEST_USER_EMAIL="ingest@odavl.local" # optional
```

Commands (run from repo root):

```bash
pnpm install
pnpm --filter @odavl-studio/insight-cloud prisma generate
pnpm --filter @odavl-studio/insight-cloud build
```

## Ingest test (curl)

```bash
curl -X POST http://localhost:3000/api/insight/snapshot \
	-H "Content-Type: application/json" \
	-H "x-api-key: local-dev-key" \
	-d '{
		"projectName": "demo",
		"repoUrl": "https://example.com/demo.git",
		"totalFiles": 10,
		"filesAnalyzed": 10,
		"totalIssues": 3,
		"criticalCount": 0,
		"highCount": 1,
		"mediumCount": 1,
		"lowCount": 1,
		"infoCount": 0,
		"riskScore": 42,
		"detectorsUsed": ["typescript", "security"],
		"analysisTimeMs": 1234,
		"environment": {"os": "windows", "nodeVersion": "20.x", "cliVersion": "1.0.0"}
	}'
```
