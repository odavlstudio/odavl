# ODAVL Copilot VS Code Extension Charter

## Focus Areas

- **Activation Events**: Prefer `onView`/`onCommand` over broad triggers
- **Webview Security**: No CDN, use `asWebviewUri` + strict CSP policies
- **Watcher Lifecycle**: Proper dispose/close patterns for file watchers
- **Type Alignment**: Maintain compatibility with `@types/vscode`
- **UX Polish**: Consistent icons, proper `when` clauses for commands

## Verification Checklist

- `pnpm build` passes without errors
- `vsce package` completes successfully
- Zero external network calls in runtime
- Zero TypeScript warnings in extension code
- All webviews use local resources with proper CSP

## Quality Gates

- Extension activation time <500ms
- Memory usage stable under normal workloads
- All commands properly registered with descriptive titles
- No deprecated VS Code API usage
