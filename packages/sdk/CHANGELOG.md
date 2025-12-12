# Changelog

All notable changes to the ODAVL Studio SDK will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-12-12

### Added

#### Core Features
- **Insight Client**: Complete programmatic access to ODAVL Insight analysis
  - `InsightClient` class with local and cloud analysis modes
  - Support for all 16 detectors (TypeScript, Security, Performance, etc.)
  - Project management and analysis history retrieval
  - Plan and quota checking
- **Autopilot Client**: Self-healing code automation interface
  - O-D-A-V-L cycle execution (Observe, Decide, Act, Verify, Learn)
  - Recipe management and trust scoring
  - Undo/rollback capabilities
  - Safe automation with governance constraints
- **Guardian Client**: Pre-deploy testing and quality gates
  - Accessibility, performance, security testing
  - Multi-environment support (staging, production)
  - Quality gate enforcement
  - Real-time monitoring
- **Plugin System**: Extensibility framework
  - Analyzer plugin interface
  - Reporter plugin interface
  - Integration plugin interface
  - Plugin lifecycle management

#### Authentication
- JWT-based authentication
- OAuth 2.0 support (GitHub, Google)
- API key authentication for CI/CD
- Token refresh and rotation

#### Type Safety
- Full TypeScript support with exported types
- Comprehensive type definitions for all APIs
- Strict null checking
- Generic type parameters for extensibility

#### Documentation
- Complete API reference with examples
- Quick start guides for each product
- Integration examples (CI/CD, VS Code, etc.)
- TypeScript IntelliSense support

### Dependencies
- `@odavl-studio/types@1.0.0` - Shared TypeScript types
- `@odavl-studio/insight-core@1.0.0` - Insight analysis engine
- `axios@^1.6.0` - HTTP client for API calls
- `zod@^3.22.0` - Runtime type validation

### Exports
- **Main**: `@odavl-studio/sdk` - All clients and types
- **Insight**: `@odavl-studio/sdk/insight` - Insight-specific exports
- **Autopilot**: `@odavl-studio/sdk/autopilot` - Autopilot-specific exports
- **Guardian**: `@odavl-studio/sdk/guardian` - Guardian-specific exports
- **Plugin**: `@odavl-studio/sdk/plugin` - Plugin system exports

### Examples

#### Basic Usage
```typescript
import { InsightClient } from '@odavl-studio/sdk/insight';

const client = new InsightClient({
  mode: 'local', // or 'cloud'
  auth: { token: 'your-api-token' }
});

const results = await client.analyze('/path/to/project', {
  detectors: ['typescript', 'security', 'performance']
});

console.log(`Found ${results.issueCount} issues`);
```

#### CI/CD Integration
```typescript
import { InsightClient } from '@odavl-studio/sdk/insight';

const client = new InsightClient({
  mode: 'cloud',
  auth: { apiKey: process.env.ODAVL_API_KEY }
});

const results = await client.analyze(process.cwd());

if (results.criticalIssues > 0) {
  console.error(`❌ Found ${results.criticalIssues} critical issues`);
  process.exit(1);
}
```

### Performance
- Analysis speed: <5s for 100 files (local mode)
- Cloud analysis: <30s for 1000 files
- Memory footprint: <200MB for typical projects
- Zero-copy file processing for large codebases

### Security
- No source code transmitted to cloud (only metadata)
- API keys encrypted at rest
- Rate limiting protection
- GDPR compliant data handling

### Breaking Changes
- N/A (first release)

### Known Issues
- Python detector experimental (may have false positives)
- Next.js detector not yet implemented (coming in v1.1)
- Large monorepos (>10K files) may require chunking

### Migration Guide
- N/A (first release)

---

## [Unreleased]

### Planned for v1.1
- [ ] WebAssembly detectors for 10x faster analysis
- [ ] GraphQL API support
- [ ] Real-time streaming analysis results
- [ ] Custom detector authoring API
- [ ] Multi-language AST parsing (Java, Python, Ruby)

---

## Version History

- **1.0.0** (2025-12-12) - Initial production release

---

For more details, see the [full documentation](https://docs.odavl.studio/sdk).
