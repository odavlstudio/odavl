# Changelog

All notable changes to the ODAVL Insight extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.4] - 2025-11-28

### 🐛 CRITICAL FIX: Extension Activation
**This version fixes a critical bug where the extension would not activate, causing all features to be broken.**

#### Root Cause
- `"activationEvents": []` in package.json prevented the extension from activating on VS Code startup
- Result: Commands not registered, TreeView providers not registered, UI completely broken

#### Fixes Applied
- ✅ Added `"activationEvents": ["*"]` to ensure extension activates on startup
- ✅ All commands now register correctly (no more "command not found")
- ✅ All TreeView providers now register correctly (no more "no data provider registered")
- ✅ UI now works as expected (panels populate, icon displays, dashboard opens)

### 🎨 Visual Improvements
- **NEW**: Custom Activity Bar icon (`media/activitybar-icon.svg`)
  - Design: Purple gradient circle (#667eea → #764ba2)
  - Gold accent ring (#fbbf24)
  - Eye symbol with detection waves
  - Size: 24x24 SVG
- **FIXED**: Icon now displays correctly (no more white circle)

### 💎 Enhanced Empty States
- **Issues Explorer**: Welcome message + interactive "analyze workspace" button
- **Statistics Panel**: Friendly "No issues detected ✨" message + "Start Analysis" button
- Improved user onboarding experience

### 📦 Package Improvements
- Verified VSIX contents (all media files included)
- Bundle size: 65.17 KB (15 files)
- Includes: activitybar-icon.svg, icon.svg, icon.png

### 📝 Documentation
- Added `INSTALL_v2.0.4.md` (Arabic installation guide)
- Added `INSTALL_v2.0.4_EN.md` (English installation guide)
- Detailed troubleshooting for common issues

### ⚠️ Breaking Changes
None - this is a critical bug fix release that makes the extension work as intended.

### 🔄 Migration from v2.0.3 or earlier
1. Uninstall old version
2. Reload VS Code
3. Install v2.0.4 from VSIX
4. Reload VS Code again
5. Verify icon appears in Activity Bar and all panels work

## [2.0.1] - 2025-11-28

### 📝 Documentation
- **MAJOR**: Complete README overhaul (15.6 KB professional documentation)
  - Added comprehensive feature documentation (28+ detectors)
  - Added real-world performance metrics
  - Added ML model documentation (3 TensorFlow.js models)
  - Added multi-language support details (TypeScript, JavaScript, Python, Java)
  - Added example outputs for each language
  - Added architecture and design patterns
  - Added use cases and best practices

### 🎨 Visual Improvements
- Added professional icon (128x128)
- Added .vscodeignore for optimized package size

### 📦 Package Improvements
- Reduced package size from 171 MB to 49 KB
- Optimized build with external dependencies

## [2.0.0] - 2025-11-27

### Added
- **28+ Specialized Detectors** across multiple languages
  - 12 Core detectors (TypeScript, ESLint, Security, etc.)
  - 5 Python detectors (Type, Security, Complexity, etc.)
  - 5 Java detectors (Complexity, Stream, Exception, etc.)
  - 6+ Advanced detectors (ML-powered, Framework detection)

### 🚀 Core Features
- Real-time analysis on file save (500ms debounce)
- VS Code Problems Panel integration
- Multi-language support (TypeScript, JavaScript, Python, Java)
- ML-powered confidence scoring
- Framework-specific rules (React, Express, Next.js, Spring)

### 🎮 Commands
- Analyze Workspace
- Analyze Active File
- Clear Diagnostics
- Run Detector
- Show Language Info
- Show Workspace Languages

### ⚙️ Configuration
- `odavl-insight.autoAnalyzeOnSave` - Auto-analyze on save (default: true)
- `odavl-insight.enabledDetectors` - Enabled detectors (default: typescript, eslint, security)
- `odavl-insight.supportedLanguages` - Supported languages (default: all)

### 🧠 Machine Learning
- 3 trained TensorFlow.js models
- Pattern learning and memory system
- Trust scoring and confidence prediction

### ⚡ Performance
- <200ms startup time (lazy loading)
- ~800ms full initialization
- Efficient incremental analysis
- Result caching with memory management

## [0.1.0] - 2025-11-22

### Added
- 12 specialized detectors for comprehensive code analysis:
  - TypeScript detector for type errors and strict mode violations
  - ESLint detector for linting errors from user config
  - Import detector for broken imports and missing dependencies
  - Package detector for outdated dependencies and vulnerabilities
  - Runtime detector for potential runtime errors
  - Build detector for compilation and configuration issues
  - Security detector for hardcoded secrets and vulnerabilities
  - Circular dependency detector
  - Network detector for unsafe API calls
  - Performance detector for complexity and memory issues
  - Complexity detector for code smells
  - Isolation detector for module boundary violations

- ML Model V2 integration:
  - 75.39% specificity for accurate risk detection
  - 0.57ms inference time (15,937 predictions/sec)
  - Real-time predictions on code changes
  - Trust score-based prioritization

- VS Code Problems Panel integration:
  - Real-time diagnostics with severity levels
  - Click-to-navigate to error locations
  - Color-coded severity (Error, Warning, Info, Hint)
  - Export diagnostics to `.odavl/problems-panel-export.json`

- Commands:
  - "ODAVL Insight: Analyze Workspace" - Full workspace analysis
  - "ODAVL Insight: Run Detector" - Run specific detector
  - "ODAVL Insight: Clear Diagnostics" - Clear all ODAVL issues

- Configuration:
  - `autoAnalyzeOnSave` - Enable/disable auto-analysis (default: true)
  - `enabledDetectors` - Select which detectors to run

- Performance optimizations:
  - Auto-analysis on file save with 500ms debounce
  - Background processing to avoid blocking editor
  - Incremental analysis for changed files only
  - Analysis completes in 1-3 seconds for typical projects

### Performance
- Analysis time: 1-3 seconds (typical project <500 files)
- ML inference: 0.57ms per prediction
- Startup impact: <500ms extension activation

[0.1.0]: https://github.com/odavl-studio/odavl/releases/tag/insight-v0.1.0
