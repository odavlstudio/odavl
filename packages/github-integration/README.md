# ODAVL GitHub Integration

GitHub App and Actions integration for ODAVL Studio.

## Installation

```bash
pnpm add @odavl-studio/github-integration
```

## GitHub App

```typescript
import { GitHubAppService } from '@odavl-studio/github-integration/app';

const githubApp = new GitHubAppService({
  appId: process.env.GITHUB_APP_ID,
  privateKeyPath: './secrets/odavl-studio.private-key.pem',
});

// List repositories
const repos = await githubApp.listRepositories(installationId);

// Create check run
const checkRun = await githubApp.createCheckRun(
  installationId,
  owner,
  repo,
  sha,
  'ODAVL Analysis'
);

// Update with results
await githubApp.updateCheckRun(
  installationId,
  owner,
  repo,
  checkRun.id,
  'success',
  'Analysis complete: 0 issues found'
);
```

## Webhooks

```typescript
import { GitHubWebhooksService } from '@odavl-studio/github-integration/webhooks';
import express from 'express';

const app = express();
app.use(express.json());

const webhooks = new GitHubWebhooksService({
  secret: process.env.GITHUB_WEBHOOK_SECRET!,
  githubApp,
  onAnalysisComplete: (result) => {
    console.log('Analysis complete:', result);
  },
});

app.use('/webhooks/github', webhooks.getMiddleware());

app.listen(3000);
```

## GitHub Actions

See `github-actions/` directory for Action implementation.

## License

MIT
