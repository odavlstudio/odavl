# ODAVL Insight VS Code Extension v2.0

> **Phase 6: VS Code Extension Upgrade** - Production-ready extension with local + cloud capabilities

## 🎯 What's New in v2.0

### ✨ Major Features

1. **Dual Analysis Modes**
   - **Local Mode**: Instant feedback using local detectors (no sign-in required)
   - **Cloud Mode**: Send to ODAVL Insight Cloud for history, trends, and collaboration
   - **Smart Mode**: Automatically uses both when authenticated

2. **ODAVL ID Authentication**
   - Unified authentication across CLI, Cloud, and VS Code
   - Device code flow (browser-based sign-in)
   - Secure token storage in VS Code SecretStorage
   - Status bar shows account and plan

3. **Plan-Aware Features**
   - FREE: Local analysis + limited cloud analysis
   - PRO: Unlimited cloud analysis + advanced detectors
   - TEAM: Team collaboration + ML predictions
   - ENTERPRISE: Custom rules + audit logs

4. **Improved UX**
   - Clean command palette organization
   - Inline diagnostics for immediate feedback
   - One-click access to Cloud Dashboard
   - Plan upgrade prompts for FREE users

5. **Clean Architecture**
   - Modular separation (auth, api, services, commands)
   - Fast activation (<200ms)
   - TypeScript with strict typing
   - Integration with Phase 3 auth and Phase 4 backend

## 🚀 Quick Start

### Installation

1. **From VS Code Marketplace** (recommended):
   ```
   ext install odavl.odavl-insight-vscode
   ```

2. **From VSIX file**:
   - Download from [releases](https://github.com/odavl-studio/odavl/releases)
   - Install via VS Code: Extensions → `...` → Install from VSIX

### First Use

1. **Open Command Palette** (`Ctrl+Shift+P` / `Cmd+Shift+P`)

2. **Try Local Analysis** (no sign-in required):
   ```
   ODAVL Insight: Analyze Workspace (Local Only)
   ```

3. **Sign In for Cloud Features**:
   ```
   ODAVL Insight: Sign In
   ```
   - Opens browser for authentication
   - Enter verification code
   - Extension automatically syncs

4. **Send to Cloud**:
   ```
   ODAVL Insight: Send to Cloud
   ```
   - Creates analysis job in ODAVL Insight Cloud
   - View results in VS Code + Cloud Dashboard
   - Track history and trends

## 📋 Commands

| Command | Description | Requires Auth |
|---------|-------------|---------------|
| `ODAVL Insight: Sign In` | Sign in with ODAVL account | No |
| `ODAVL Insight: Sign Out` | Sign out and clear tokens | Yes |
| `ODAVL Insight: Analyze Workspace` | Smart analysis (local + cloud when authenticated) | No |
| `ODAVL Insight: Analyze Workspace (Local Only)` | Local analysis only | No |
| `ODAVL Insight: Send to Cloud` | Cloud analysis with history | Yes |
| `ODAVL Insight: Open Cloud Dashboard` | View projects in browser | Yes |
| `ODAVL Insight: Clear Diagnostics` | Clear all inline errors | No |
| `ODAVL Insight: View Plans` | See pricing and upgrade options | No |
| `ODAVL Insight: Account Menu` | Manage account and plan | No |

## ⚙️ Configuration

Settings available in VS Code preferences:

```json
{
  // Auto-analyze files on save (local mode)
  "odavl-insight.autoAnalyzeOnSave": true,
  
  // Default analysis mode (local, cloud, or both)
  "odavl-insight.defaultAnalysisMode": "local",
  
  // Enabled detectors for local analysis
  "odavl-insight.enabledDetectors": [
    "typescript",
    "eslint",
    "security",
    "performance",
    "complexity",
    "import",
    "circular"
  ],
  
  // Minimum severity to show
  "odavl-insight.severityMinimum": "info",
  
  // Cloud backend URL (change for self-hosted)
  "odavl-insight.cloudBackendUrl": "https://cloud.odavl.studio",
  
  // Enable anonymous usage telemetry
  "odavl-insight.telemetryEnabled": true
}
```

## 🏗️ Architecture

### Directory Structure

```
src/
├── extension-v2.ts          # Main entry point
├── auth/
│   └── auth-manager.ts      # ODAVL ID + SecretStorage
├── api/
│   └── cloud-client.ts      # Phase 4 backend integration
├── services/
│   └── analysis-service.ts  # Local + cloud coordination
└── ... (legacy files preserved for compatibility)
```

### Integration Points

- **Phase 3 Auth**: Uses `@odavl-studio/auth` for ODAVL ID
- **Phase 4 Backend**: Calls `/api/insight/analysis` endpoints
- **Insight Core**: Uses `@odavl-studio/insight-core` for local detection
- **VS Code SecretStorage**: Secure token persistence

### Authentication Flow

```
1. User clicks "Sign In"
2. Device code requested from backend
3. Browser opens with verification code
4. Extension polls for authorization
5. Tokens stored in SecretStorage
6. Status bar updates with plan info
```

### Analysis Flow

**Local Mode**:
```
1. Scan workspace with insight-core
2. Generate diagnostics
3. Show inline in editor
4. Display summary notification
```

**Cloud Mode**:
```
1. Create analysis job via API
2. Poll for completion (every 2s)
3. Download results
4. Generate diagnostics
5. Show link to Cloud Dashboard
```

## 🎨 User Experience

### Status Bar

**Signed Out**:
```
🔓 Sign In
```

**Signed In (FREE)**:
```
🆓 John Doe
```

**Signed In (PRO)**:
```
⭐ Jane Smith
```

Click to open account menu with options:
- View profile
- Open Cloud Dashboard
- Upgrade plan (FREE users)
- Sign out

### Inline Diagnostics

Issues appear in:
- Editor squiggles (red/yellow/blue)
- Problems Panel (grouped by severity)
- Hover tooltips with fix suggestions

### Cloud Analysis Progress

```
Notification: "Analyzing workspace (42%)..."
Output Channel: Detailed logs
```

### Plan Awareness

FREE users see upgrade prompts when:
- Using cloud analysis
- Viewing Cloud Dashboard
- Approaching monthly limits

## 🔒 Security & Privacy

- **Tokens**: Stored in VS Code SecretStorage (encrypted)
- **Network**: HTTPS only, no credentials in logs
- **Telemetry**: Anonymous usage stats (can be disabled)
- **Source Code**: Never sent to cloud without explicit action
- **Open Source**: Full source available for audit

## 🐛 Troubleshooting

### Extension Not Activating

1. Check VS Code version: Requires 1.80.0+
2. View Output Channel: `View → Output → ODAVL Insight`
3. Reload window: `Ctrl+Shift+P → Reload Window`

### Sign-In Failing

1. Check internet connection
2. Verify backend URL in settings
3. Try clearing tokens: Sign out and sign in again
4. Check Output Channel for error details

### Local Analysis Not Working

1. Verify workspace folder is open
2. Check supported languages: TypeScript, Python, Java
3. Review enabled detectors in settings
4. Run `ODAVL Insight: Clear Diagnostics` and retry

### Cloud Analysis Timing Out

1. Check authentication status
2. Verify backend is reachable: `https://cloud.odavl.studio`
3. Check for firewall/proxy blocking requests
4. Try local analysis first to verify workspace is valid

### Diagnostics Not Showing

1. Check severity filter: `odavl-insight.severityMinimum`
2. Verify enabled detectors in settings
3. Clear and re-run analysis
4. Check VS Code Problems Panel filter

## 📊 Plan Comparison

| Feature | FREE | PRO | TEAM | ENTERPRISE |
|---------|------|-----|------|------------|
| Local Analysis | ✅ | ✅ | ✅ | ✅ |
| Cloud Analysis | 50/month | Unlimited | Unlimited | Unlimited |
| Projects | 3 | 10 | 50 | Unlimited |
| History | 7 days | 90 days | 1 year | Forever |
| Detectors | 11 | 13 | 15 | 16+ |
| ML Predictions | ❌ | ❌ | ✅ | ✅ |
| Team Collaboration | ❌ | ❌ | ✅ | ✅ |
| Custom Rules | ❌ | ❌ | ❌ | ✅ |
| Audit Logs | ❌ | ❌ | ❌ | ✅ |
| Priority Support | ❌ | ✅ | ✅ | ✅ |

## 🔗 Links

- **Website**: https://odavl.studio
- **Documentation**: https://odavl.studio/docs/vscode-extension
- **Cloud Dashboard**: https://cloud.odavl.studio
- **Pricing**: https://odavl.studio/pricing
- **GitHub**: https://github.com/odavl-studio/odavl
- **Support**: support@odavl.studio

## 📝 License

MIT License - See LICENSE file for details

## 🙏 Acknowledgments

Built with:
- VS Code Extension API
- TypeScript
- @odavl-studio/insight-core
- @odavl-studio/auth
- Phase 4 backend APIs

---

**Made with ❤️ by the ODAVL team**

*v2.0.0 - December 2025*
