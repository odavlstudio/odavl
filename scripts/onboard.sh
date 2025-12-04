#!/bin/bash
echo "🚀 ODAVL Developer Onboarding..."
pnpm install
pnpm lint
pnpm typecheck
pnpm test
echo "✅ Environment ready!"
