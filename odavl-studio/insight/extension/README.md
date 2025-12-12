# 🔍 ODAVL Insight - VS Code Extension

> **ML-powered real-time error detection with 25+ specialized detectors**  
> Wave 5 - Production SDK integration with unified schema

[![Version](https://img.shields.io/badge/version-1.0.0-blue?style=flat-square)](https://marketplace.visualstudio.com/items?itemName=odavl.odavl-insight-vscode)
[![VS Code](https://img.shields.io/badge/VS%20Code-1.80.0+-007ACC?style=flat-square&logo=visual-studio-code)](https://code.visualstudio.com/)
[![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)](LICENSE)
[![SDK](https://img.shields.io/badge/SDK-1.0.0-orange?style=flat-square)](https://www.npmjs.com/package/@odavl/insight-sdk)

---

## What Is ODAVL Insight?

**ODAVL Insight** is a production-grade VS Code extension that provides real-time code analysis powered by the ODAVL Insight SDK. It integrates seamlessly with VS Code's Problems panel to deliver instant feedback on security vulnerabilities, performance issues, complexity problems, and more across TypeScript, JavaScript, Python, and Java.

### Key Features (Wave 5)

✨ **Real-Time Analysis** - Auto-analyze on save with 5-minute caching  
🎯 **25+ Detectors** - TypeScript, security, performance, complexity, and more  
🎨 **Rich UX** - Status bar integration, hover tooltips, codicons  
⚙️ **Full Configuration** - Control detectors, severity, and behavior  
⚡ **Performance** - Child process execution, timeout protection, cancellation support  

---

## ✨ Features

### Real-Time Analysis
- **Auto-analyze on save** - Instant feedback as you code
- **VS Code Problems Panel** - Issues appear alongside TypeScript/ESLint
- **Smart caching** - 5-minute cache for rapid iteration

### Enhanced UX
- **Status bar integration** - Live issue count: "$(flame) Insight: 7 issues"
- **Rich hover tooltips** - Detector info, rule IDs, suggested fixes
- **Codicons** - Visual severity (🔥 critical, ⚠️ warning, 💡 hint)
- **Progress notifications** - "Running Insight analysis..."

### Full Configuration
```json
{
  "odavl-insight.autoAnalyzeOnSave": true,
  "odavl-insight.enabledDetectors": ["typescript", "security", "performance"],
  "odavl-insight.severityMinimum": "info"
}
```

### 25+ Specialized Detectors

#### **Stable Detectors (11)**

- ✅ **TypeScript Detector** - Type checking, strict mode validation, `never` type detection
- ✅ **ESLint Detector** - Code quality rules with JSON parsing
- ✅ **Import Detector** - Import validation (skips mock/example files automatically)
- ✅ **Package Detector** - Dependency integrity and vulnerability scanning
- ✅ **Runtime Detector** - Async/await patterns, promise handling
- ✅ **Build Detector** - Build process validation
- 🔒 **Security Detector** - XSS, SQL injection, hardcoded secrets, CVE scanning
- 🔄 **Circular Dependency Detector** - Import cycle detection and resolution
- 🌐 **Network Detector** - Timeout handling, error management, rate limiting
- ⚡ **Performance Detector** - Memory leaks, slow functions, inefficient patterns
- 🧩 **Complexity Detector** - Cyclomatic complexity, deep nesting, cognitive load
- 🔗 **Isolation Detector** - Coupling analysis, cohesion metrics, boundary validation

#### **Python Support (5 Detectors)**
- 🐍 **Type Detector** - Type hints validation, mypy integration
- 🔒 **Security Detector** - SQL injection, XSS, insecure patterns
- 🧩 **Complexity Detector** - Cyclomatic complexity, radon integration
- 📦 **Imports Detector** - Import cycle detection, unused imports
- ✅ **Best Practices Detector** - PEP 8, PEP 257, code style validation

#### **Java Support (5 Detectors)**
- ☕ **Complexity Detector** - Cyclomatic complexity, cognitive complexity, PMD integration
- 🌊 **Stream Detector** - Java Stream API misuse and optimization
- 🚨 **Exception Detector** - Exception handling patterns and anti-patterns
- 💾 **Memory Detector** - Memory management, resource leaks, GC patterns
- 🍃 **Spring Detector** - Spring Framework best practices and anti-patterns

#### **Advanced Intelligence (6+ Detectors)**
- 🧠 **Phase1 Detector Suite** - Orchestrates multiple detectors intelligently
- 🗄️ **Enhanced DB Detector** - Database query optimization and N+1 detection
- 🛡️ **Smart Security Scanner** - Context-aware security analysis with ML
- 📊 **Context-Aware Performance Detector** - Adaptive performance profiling
- 🎯 **Confidence Scoring System** - ML-based accuracy prediction (PatternStrength, ContextScore, StructureScore, HistoricalAccuracy)
- 🚀 **Framework Rule Detection** - React, Express, Next.js, Node.js specific patterns
- 📦 **Bundle Analyzer** - Webpack/Vite bundle optimization

---

## 🚀 How It Works

### 1️⃣ **Real-Time Analysis**
- Auto-analyze on file save (500ms debounce for optimal performance)
- Lazy-loaded detectors for **<200ms startup time**
- Full workspace scan in seconds, not minutes

### 2️⃣ **Intelligent Detection**
- **Confidence scoring** for every issue (ML-powered accuracy prediction)
- **Context-aware analysis** understands your project structure
- **Framework detection** applies rules specific to React, Spring, Express, etc.

### 3️⃣ **Native Integration**
- Issues appear in **VS Code Problems Panel** alongside TypeScript/ESLint
- **Click-to-navigate** directly to error locations
- **Severity mapping**: Critical→Error, High→Warning, Medium→Info, Low→Hint

### 4️⃣ **ML-Powered Intelligence**
- **3 trained TensorFlow.js models** (recipe-predictor, trust-predictor v1/v2)
- **Pattern learning** from historical fixes
- **Trust scoring** evolves with your codebase

---

## 📦 Installation

### From VS Code Marketplace (Recommended)

1. Open VS Code
2. Go to Extensions (`Ctrl+Shift+X` / `Cmd+Shift+X`)
3. Search for **"ODAVL Insight"**
4. Click **Install**

### From Command Line

```bash
code --install-extension odavl.odavl-insight-vscode
```

### Requirements

- **VS Code**: 1.80.0 or higher
- **Node.js**: 18.18 or higher
- **Supported Languages**: TypeScript, JavaScript, Python, Java

---

## 🎮 Commands

Access commands via `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (Mac):

| Command | Description | Shortcut |
|---------|-------------|----------|
| `ODAVL Insight: Analyze Workspace` | Run full workspace analysis across all files | - |
| `ODAVL Insight: Analyze Active File` | Analyze currently open file | - |
| `ODAVL Insight: Clear Diagnostics` | Clear all ODAVL diagnostics from Problems Panel | - |
| `ODAVL Insight: Run Detector` | Run specific detector interactively | - |
| `ODAVL Insight: Show Language Info` | Display detected languages in active file | - |
| `ODAVL Insight: Show Workspace Languages` | Show language breakdown for entire workspace | - |

---

## ⚙️ Configuration

### Settings

Configure ODAVL Insight in your VS Code settings (`settings.json`):

```json
{
  // Auto-analyze files on save (default: true)
  "odavl-insight.autoAnalyzeOnSave": true,

  // Enabled detectors (default: ["typescript", "eslint", "security"])
  "odavl-insight.enabledDetectors": [
    "typescript",
    "eslint",
    "security",
    "complexity",
    "performance"
  ],

  // Supported languages (default: ["typescript", "javascript", "python", "java"])
  "odavl-insight.supportedLanguages": [
    "typescript",
    "javascript",
    "python",
    "java"
  ]
}
```

### Detector Categories

Enable specific detector categories:

- **Core**: `typescript`, `eslint`, `import`, `package`, `runtime`, `build`
- **Advanced**: `security`, `circular`, `network`, `performance`, `complexity`, `isolation`
- **Python**: `python-type`, `python-security`, `python-complexity`, `python-imports`, `python-best-practices`
- **Java**: `java-complexity`, `java-stream`, `java-exception`, `java-memory`, `java-spring`

---

## 📊 Example Output

### TypeScript Security Issue

```
PROBLEMS (4)
├─ 🔒 ODAVL/security: Hardcoded API key detected (src/config.ts:42)
│  Severity: Error
│  Confidence: 95%
│  Fix: Use environment variables (process.env.API_KEY)
│
├─ 🌐 ODAVL/network: Missing timeout on fetch call (src/api.ts:18)
│  Severity: Warning
│  Confidence: 87%
│  Fix: Add timeout: fetch(url, { signal: AbortSignal.timeout(5000) })
│
├─ 🧩 ODAVL/complexity: Cyclomatic complexity 42 (threshold: 20) (src/utils.ts:96)
│  Severity: Info
│  Confidence: 100%
│  Fix: Extract functions, reduce nesting
│
└─ ⚡ ODAVL/performance: Potential memory leak in event listener (src/service.ts:15)
   Severity: Warning
   Confidence: 78%
   Fix: Remove listener in cleanup function
```

### Python Security Analysis

```
PROBLEMS (2)
├─ 🔒 ODAVL/python-security: SQL injection vulnerability (app.py:67)
│  Severity: Error
│  Confidence: 92%
│  Fix: Use parameterized queries: cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
│
└─ ✅ ODAVL/python-best-practices: Missing type hints (utils.py:23)
   Severity: Info
   Confidence: 100%
   Fix: Add type hints: def process_data(data: List[str]) -> Dict[str, Any]:
```

### Java Complexity Detection

```
PROBLEMS (29)
├─ ☕ ODAVL/java-complexity: High cyclomatic complexity: 15 (UserService.java:45)
│  Severity: Warning
│  Confidence: 100%
│  Fix: Refactor method into smaller functions
│
├─ 🌊 ODAVL/java-stream: Stream API misuse - collect() after forEach() (DataProcessor.java:89)
│  Severity: Info
│  Confidence: 95%
│  Fix: Use collect(Collectors.toList()) instead
│
└─ 🚨 ODAVL/java-exception: Empty catch block (ApiClient.java:123)
   Severity: Warning
   Confidence: 100%
   Fix: Log exception or rethrow: catch (Exception e) { logger.error("Error", e); }
```

---

## 🎯 Real-World Performance

**Tested on Production Codebases:**

| Metric | Value | Notes |
|--------|-------|-------|
| **Extension Bundle Size** | 25.91 KB | Extremely lightweight |
| **Startup Time** | <200ms | Lazy-loaded detectors |
| **Full Initialization** | ~800ms | On first use |
| **TypeScript Analysis** | 3.3s | 0 issues detected on clean code |
| **ESLint Integration** | 30s | Includes JSON parsing & validation |
| **Python Security Scan** | 50.6s | Deep security analysis |
| **Java Complexity Scan** | 793ms | 29 issues found (PMD fallback mode) |
| **Total Test Suite** | 86.9s | 7/7 detector categories passed |

**Multi-Language Support Verified:**
- ✅ TypeScript projects (0 issues in 3.3s)
- ✅ Python codebases (0 issues in 52.6s)
- ✅ Java applications (29 issues in 793ms)
- ✅ Mixed-language monorepos

---

## 🧠 Machine Learning Intelligence

### Trained Models

ODAVL Insight includes **3 production-ready TensorFlow.js models**:

1. **Recipe Predictor v1.0.0** - Predicts best fix for detected issues
2. **Trust Predictor v1** - Calculates confidence scores for detections
3. **Trust Predictor v2** - Enhanced confidence scoring with historical data

### Confidence Scoring System

Every issue includes ML-powered confidence metrics:

- **PatternStrength**: How strongly the code matches known anti-patterns
- **ContextScore**: Project-specific context awareness
- **StructureScore**: Code structure and architecture analysis
- **HistoricalAccuracy**: Learning from past fixes in your codebase

**Example:**
```typescript
Issue: Hardcoded API key
Confidence: 95%
├─ PatternStrength: 98% (classic secret pattern)
├─ ContextScore: 92% (config file context)
├─ StructureScore: 95% (clear violation)
└─ HistoricalAccuracy: 94% (based on 47 previous fixes)
```

---

## 🏗️ Architecture & Design

### Optimization Strategy

**Fast Startup (<200ms):**
- Commands registered immediately (lightweight)
- Detectors lazy-loaded on first use
- No heavy initialization at activation

**Efficient Analysis:**
- 500ms debounce on file save
- Incremental analysis (only changed files)
- Result caching with memory management
- Parallel execution for independent detectors

### Multi-Language Support

**Language Detection:**
- Automatic file extension recognition
- Smart framework detection (React, Spring, Express, Next.js)
- Language-specific rule application

**Framework-Specific Rules:**
- **React**: Hooks rules, component patterns, JSX best practices
- **Express**: Route handler patterns, middleware validation
- **Next.js**: App Router patterns, Server Components
- **Spring**: Dependency injection, Bean lifecycle, JPA patterns
- **Node.js**: Event loop patterns, async/await best practices

---

## 📚 Use Cases

### 1. **Enterprise Development**
- Enforce security policies across large teams
- Catch vulnerabilities before code review
- Maintain consistent code quality standards

### 2. **Open Source Projects**
- Welcome contributors with instant feedback
- Reduce maintainer burden (fewer bugs in PRs)
- Improve project quality metrics

### 3. **Education & Learning**
- Real-time feedback for students learning TypeScript/Python/Java
- Explain security concepts with concrete examples
- Build good habits early in coding journey

### 4. **DevOps & CI/CD Integration**
- Pre-commit hooks with ODAVL CLI
- CI pipeline quality gates
- Automated security scanning

---

## 🤝 Part of ODAVL Studio

ODAVL Insight is one of three products in the **ODAVL Studio** platform:

### 🔍 **ODAVL Insight** (This Extension)
ML-powered error detection and code analysis

### ⚡ **ODAVL Autopilot**
Self-healing code infrastructure with O-D-A-V-L cycle

### 🛡️ **ODAVL Guardian**
Pre-deploy testing and monitoring

**All three products share:**
- Unified CLI: `odavl <product> <command>`
- Public SDK: `@odavl-studio/sdk`
- VS Code extensions with focused features
- ML-powered intelligence and trust scoring

---

## 🔗 Links & Resources

- **GitHub Repository**: [github.com/Soliancy/odavl](https://github.com/Soliancy/odavl)
- **Documentation**: [docs.odavl.studio](https://docs.odavl.studio)
- **CLI Tool**: `npm install -g @odavl-studio/cli`
- **SDK**: `npm install @odavl-studio/sdk`
- **Issue Tracker**: [github.com/Soliancy/odavl/issues](https://github.com/Soliancy/odavl/issues)
- **Changelog**: [CHANGELOG.md](https://github.com/Soliancy/odavl/blob/main/CHANGELOG.md)

---

## 🛡️ Philosophy

**ODAVL** stands for **O**bserve-**D**ecide-**A**ct-**V**erify-**L**earn - a continuous improvement cycle that powers all three products.

**Our Core Beliefs:**
- **Quality First**: Catch issues early, fix them intelligently
- **ML-Powered**: Learn from every codebase, improve continuously
- **Developer-Friendly**: Zero configuration, instant value
- **Multi-Language**: One tool for TypeScript, Python, Java, and beyond
- **Open Source**: Transparent, community-driven, MIT licensed

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for details

---

## 🙏 Credits

Built with:
- **TensorFlow.js** - Machine learning models
- **TypeScript** - Type-safe codebase
- **VS Code Extension API** - Native integration
- **PMD** (Java), **mypy** (Python), **radon** (Python) - Language-specific analysis

---

## 🚀 Get Started Now

1. **Install** from VS Code Marketplace
2. **Open** any TypeScript/Python/Java project
3. **Save** a file (`Ctrl+S`) to trigger analysis
4. **View** issues in Problems Panel (`Ctrl+Shift+M`)

**Zero configuration. Instant results. Continuous improvement.**

---

<div align="center">

**Made with ❤️ by the ODAVL Team**

[⭐ Star on GitHub](https://github.com/Soliancy/odavl) • [📖 Documentation](https://docs.odavl.studio) • [🐛 Report Issue](https://github.com/Soliancy/odavl/issues)

</div>
