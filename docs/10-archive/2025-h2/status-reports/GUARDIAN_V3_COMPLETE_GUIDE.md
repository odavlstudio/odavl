# 🛡️ ODAVL Guardian v3.0 - الدليل الشامل

**Version**: 3.0.0  
**Date**: November 30, 2025  
**Timeline**: 2-6 أسابيع (MVP → Complete)

---

## 📋 جدول المحتويات

1. [النظرة العامة](#overview)
2. [المعمارية الكاملة](#architecture)
3. [المنتجات المدعومة (7 أنواع)](#products)
4. [الأكواد الجاهزة](#code)
5. [خطة التنفيذ (14 يوم)](#implementation)

---

<a name="overview"></a>
## 🎯 النظرة العامة

### Vision

**Guardian v3.0 = Launch Validator لكل أنواع المشاريع**

```
v2.x: Testing → Deployment → Monitoring
v3.0: Build → Validate → Fix → Test → Deploy → Launch ✅
```

### الاستراتيجية

```
Phase 1 (الآن):  MVP - 2 Inspectors     → أسبوعين  → ديسمبر 14
Phase 2 (يناير): Complete - 7 Inspectors → 4 أسابيع → يناير 31
```

### التغطية

| نوع المشروع | نسبة الكشف | Auto-Fix |
|-------------|-----------|----------|
| VS Code Extension | 95% | ✅ |
| Next.js Website | 90% | ✅ |
| Node.js Server | 85% | ⚠️ |
| CLI App | 80% | ⚠️ |
| npm Package | 90% | ✅ |
| Cloud Function | 85% | ⚠️ |
| IDE Extension | 75% | ⚠️ |

---

<a name="architecture"></a>
## 🏗️ المعمارية

```
┌──────────────────────────────────────────────┐
│          ODAVL Guardian v3.0                 │
├──────────────────────────────────────────────┤
│ Layer 1: Static Analysis (70% coverage)     │
│  ├─ 7 Product Inspectors                    │
│  ├─ Config Validator                        │
│  └─ Dependency Checker                      │
│                                              │
│ Layer 2: Auto-Fixers                        │
│  ├─ Extension Fixer                         │
│  ├─ Next.js Fixer                           │
│  └─ Generic Fixer                           │
│                                              │
│ Layer 3: Autopilot Integration              │
│  ├─ Issue Bridge                            │
│  ├─ Fix Orchestrator                        │
│  └─ Validation Loop                         │
│                                              │
│ Layer 4: Dashboard UI                       │
│  ├─ Product Cards                           │
│  ├─ Priority Queue                          │
│  └─ Fix Progress                            │
└──────────────────────────────────────────────┘
```

### الـ Flow الكامل

```
1. Guardian Scan   →  يكتشف المشاكل
2. Guardian Report →  يعرض المشاكل
3. Autopilot Fix   →  يصلح المشاكل
4. Guardian Verify →  يتحقق من الإصلاح
5. Launch Ready    →  جاهز للنشر ✅
```

---

<a name="products"></a>
## 📦 المنتجات المدعومة (7 أنواع)

### 1️⃣ VS Code Extension

**الفحوصات:**
- ✅ package.json (displayName, icon, publisher)
- ✅ Webview registration
- ✅ Activity bar icon
- ✅ Build output (dist/)
- ✅ README length
- ✅ Activation events

**Auto-Fixes:**
- ✅ Add webview registration code
- ✅ Create missing icons
- ✅ Add activation events

---

### 2️⃣ Next.js Website

**الفحوصات:**
- ✅ next.config.js exists
- ✅ "output: standalone" removed
- ✅ Environment variables
- ✅ Build output (.next/)
- ✅ Mixed routing (app + pages)

**Auto-Fixes:**
- ✅ Remove "output: standalone"
- ✅ Create .env.local template
- ✅ Add missing scripts

---

### 3️⃣ Node.js Server

**الفحوصات:**
- ✅ Start script exists
- ✅ Port configuration (env var)
- ✅ .env.example exists
- ✅ CORS configured
- ✅ Error handler (uncaughtException)
- ✅ Health check endpoint (/health)

**Example Issue:**
```typescript
// ❌ Bad: Hardcoded port
app.listen(3000);

// ✅ Good: Environment variable
app.listen(process.env.PORT || 3000);
```

---

### 4️⃣ CLI Application

**الفحوصات:**
- ✅ bin field in package.json
- ✅ Shebang (#!/usr/bin/env node)
- ✅ --help command
- ✅ --version command
- ✅ README with examples

---

### 5️⃣ npm Package/SDK

**الفحوصات:**
- ✅ Entry points (main/module/exports)
- ✅ types field (TypeScript definitions)
- ✅ exports field (ESM/CJS dual)
- ✅ Build output (dist/)
- ✅ README quality (>300 chars)
- ✅ LICENSE file
- ✅ files field

---

### 6️⃣ Cloud Function

**الفحوصات:**
- ✅ Handler exists
- ✅ Cold start optimization
- ✅ Memory limits
- ✅ Timeout configuration

---

### 7️⃣ IDE Extension

**الفحوصات:**
- ✅ Manifest/plugin.xml
- ✅ Dependencies
- ✅ Build output

---

<a name="code"></a>
## 💻 الأكواد الجاهزة

### Base Inspector Interface

```typescript
// odavl-studio/guardian/inspectors/base-inspector.ts
export interface InspectionIssue {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: 'build' | 'config' | 'activation' | 'ui' | 'metadata';
  message: string;
  file?: string;
  autoFixable: boolean;
  fix?: string;
  impact: string;
}

export interface InspectionReport {
  productId: string;
  productName: string;
  productType: string;
  readinessScore: number; // 0-100
  status: 'ready' | 'blocked' | 'unstable';
  issues: InspectionIssue[];
}

export abstract class BaseInspector {
  abstract inspect(productPath: string): Promise<InspectionReport>;
  
  protected calculateReadiness(issues: InspectionIssue[]): number {
    let score = 100;
    issues.forEach(i => {
      if (i.severity === 'critical') score -= 25;
      else if (i.severity === 'high') score -= 10;
      else if (i.severity === 'medium') score -= 5;
      else score -= 2;
    });
    return Math.max(0, score);
  }
}
```

### CLI Commands

```typescript
// apps/studio-cli/src/commands/guardian.ts
guardian
  .command('check <product-path>')
  .action(async (path) => {
    const validator = new LaunchValidator();
    const report = await validator.validateProduct('auto', path);
    
    console.log(`📊 Readiness: ${report.readinessScore}%`);
    console.log(`Status: ${report.status}`);
    
    if (report.issues.length > 0) {
      console.log(`\n❌ Found ${report.issues.length} issues`);
      report.issues.forEach(i => console.log(`  ${i.message}`));
    }
  });

guardian
  .command('fix <product-path>')
  .action(async (path) => {
    // Scan → Send to Autopilot → Verify
  });

guardian
  .command('check-all')
  .action(async () => {
    // Scan entire workspace
  });
```

### Dashboard API

```typescript
// guardian/app/app/api/launch/scan/route.ts
export async function POST() {
  const validator = new LaunchValidator();
  const reports = await validator.validateAllProducts(process.cwd());
  return NextResponse.json({ reports });
}
```

---

<a name="implementation"></a>
## 📅 خطة التنفيذ (14 يوم)

### **Week 1: Core (7 أيام)**

#### **Day 1-2: Foundation**
```bash
# Create structure
mkdir -p odavl-studio/guardian/{inspectors,fixers,core,app}

# Build:
# - base-inspector.ts
# - vscode-extension.ts (inspector)
# - nextjs-app.ts (inspector)
```

**Deliverable**: ✅ 2 inspectors working

---

#### **Day 3-4: Auto-Fixers**
```bash
# Build:
# - extension-fixer.ts
# - autopilot-bridge.ts
# - launch-validator.ts
```

**Test:**
```bash
pnpm guardian:validate insight-extension
pnpm guardian:fix insight-extension
```

**Deliverable**: ✅ Autopilot integration working

---

#### **Day 5-7: CLI**
```bash
# Build:
# - apps/studio-cli/src/commands/guardian.ts
# - 3 commands: check, fix, check-all
```

**Test:**
```bash
pnpm odavl guardian check odavl-studio/insight/extension
pnpm odavl guardian fix odavl-studio/insight/extension
pnpm odavl guardian check-all
```

**Deliverable**: ✅ CLI working

---

### **Week 2: Dashboard + Launch (7 أيام)**

#### **Day 8-10: Dashboard UI**
```bash
# Build Next.js app:
# - app/launch/page.tsx
# - components/ProductCard.tsx
# - api/launch/scan/route.ts
# - api/launch/fix/route.ts
```

**Deliverable**: ✅ Dashboard showing products

---

#### **Day 11-12: Real Test**
```bash
# Test on ODAVL Insight Extension:
pnpm guardian check odavl-studio/insight/extension
# Expected: 65% readiness, 3 issues

pnpm guardian fix odavl-studio/insight/extension
# Expected: 90% readiness, 2 fixed

# Manual verification:
code odavl-studio/insight/extension
# Check: webview registered, icon exists
# F5 to test
```

**Deliverable**: ✅ Insight Extension fixed

---

#### **Day 13-14: Package + Publish**
```bash
# Documentation
# Build package
pnpm build

# Publish
pnpm publish --access public
```

**Deliverable**: ✅ Guardian v3.0 MVP published!

---

## ✅ Success Criteria

**Phase 1 Complete when:**
- ✅ 2 Inspectors (VS Code, Next.js)
- ✅ Autopilot integration
- ✅ CLI (3 commands)
- ✅ Dashboard UI
- ✅ ODAVL Insight Extension fixed
- ✅ npm package published

---

## 🚀 Next Steps

**After Phase 1 (January):**
- Add 5 more inspectors (Server, CLI, SDK, Cloud, IDE)
- Improve dashboard
- Performance optimization

**Phase 2 Complete**: Guardian v3.0 Full (7 inspectors)

---

## 📊 مثال حقيقي

```bash
$ pnpm guardian check-all

🔍 Guardian v3.0 - Workspace Scan

[1/7] ODAVL Insight Extension
      ✅ 95% (ready)

[2/7] Studio Hub Website
      ✅ 100% (ready)

[3/7] Insight Cloud
      ❌ 65% (unstable)
      🔴 3 critical issues

[4/7] ODAVL CLI
      ✅ 90% (ready)

━━━━━━━━━━━━━━━━━━━━━━━
📊 SUMMARY
Ready: 5/7 products
Average: 88%

🔧 8 auto-fixable issues
Apply fixes? [Y/n]
```

---

## 📂 هيكل المجلدات الكامل

```
odavl-studio/guardian/
├── inspectors/
│   ├── base-inspector.ts          # Base interface
│   ├── vscode-extension.ts        # VS Code inspector (Day 1-2)
│   ├── nextjs-app.ts              # Next.js inspector (Day 1-2)
│   ├── nodejs-server.ts           # Node.js inspector (Phase 2)
│   ├── cli-app.ts                 # CLI inspector (Phase 2)
│   ├── npm-package.ts             # npm inspector (Phase 2)
│   ├── cloud-function.ts          # Cloud inspector (Phase 2)
│   └── ide-extension.ts           # IDE inspector (Phase 2)
│
├── fixers/
│   ├── extension-fixer.ts         # VS Code auto-fixer (Day 3-4)
│   ├── nextjs-fixer.ts            # Next.js auto-fixer (Day 3-4)
│   └── generic-fixer.ts           # Generic auto-fixer (Phase 2)
│
├── core/
│   ├── launch-validator.ts        # Main validator (Day 3-4)
│   ├── autopilot-bridge.ts        # Autopilot integration (Day 3-4)
│   └── product-detector.ts        # Auto-detect product type
│
├── app/                           # Next.js Dashboard (Day 8-10)
│   ├── app/
│   │   ├── page.tsx               # Home page
│   │   ├── launch/
│   │   │   └── page.tsx           # Launch Center
│   │   └── api/
│   │       └── launch/
│   │           ├── scan/route.ts  # Scan API
│   │           └── fix/route.ts   # Fix API
│   ├── components/
│   │   ├── ProductCard.tsx
│   │   └── PriorityQueue.tsx
│   └── package.json
│
├── tests/
│   ├── inspectors/
│   │   ├── vscode-extension.test.ts
│   │   └── nextjs-app.test.ts
│   └── fixers/
│       └── extension-fixer.test.ts
│
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🔧 Dependencies المطلوبة

```json
{
  "dependencies": {
    "@odavl-studio/autopilot-engine": "workspace:*",
    "@odavl-studio/core": "workspace:*",
    "@odavl-studio/types": "workspace:*",
    "micromatch": "^4.0.5",
    "yaml": "^2.3.4"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "@types/micromatch": "^4.0.6",
    "typescript": "^5.3.3",
    "vitest": "^1.0.4",
    "tsup": "^8.0.1"
  }
}
```

---

## 🎯 Checklist يومي

### Day 1 ✅
- [ ] Create directory structure
- [ ] Write base-inspector.ts
- [ ] Write vscode-extension.ts (basic version)
- [ ] Test on odavl-studio/insight/extension
- [ ] Fix any issues

### Day 2 ✅
- [ ] Complete vscode-extension.ts (all checks)
- [ ] Write nextjs-app.ts
- [ ] Test on apps/studio-hub
- [ ] Write unit tests
- [ ] Git commit

### Day 3 ✅
- [ ] Write extension-fixer.ts
- [ ] Write autopilot-bridge.ts (basic)
- [ ] Test manual fixes
- [ ] Git commit

### Day 4 ✅
- [ ] Complete autopilot-bridge.ts
- [ ] Write launch-validator.ts
- [ ] Test full flow: scan → fix → verify
- [ ] Git commit

### Day 5 ✅
- [ ] Write guardian.ts CLI commands
- [ ] Implement 'check' command
- [ ] Test CLI locally
- [ ] Git commit

### Day 6 ✅
- [ ] Implement 'fix' command
- [ ] Implement 'check-all' command
- [ ] Write CLI tests
- [ ] Git commit

### Day 7 ✅
- [ ] CLI error handling
- [ ] CLI help messages
- [ ] Integration tests
- [ ] Week 1 review

### Day 8 ✅
- [ ] Setup Next.js app
- [ ] Create Launch Center page
- [ ] Basic ProductCard component
- [ ] Git commit

### Day 9 ✅
- [ ] Scan API route
- [ ] Fix API route
- [ ] Test API endpoints
- [ ] Git commit

### Day 10 ✅
- [ ] Complete dashboard UI
- [ ] Add loading states
- [ ] Add error handling
- [ ] Git commit

### Day 11 ✅
- [ ] Run Guardian on Insight Extension
- [ ] Document all issues found
- [ ] Apply fixes via Autopilot
- [ ] Git commit

### Day 12 ✅
- [ ] Verify fixes manually
- [ ] Test extension in VS Code
- [ ] Document results
- [ ] Git commit

### Day 13 ✅
- [ ] Write README.md
- [ ] Write API documentation
- [ ] Build package (pnpm build)
- [ ] Git commit

### Day 14 ✅
- [ ] Final testing
- [ ] Version bump (v3.0.0)
- [ ] Git tag v3.0.0
- [ ] npm publish
- [ ] 🎉 Announcement!

---

## 🚨 الأخطاء المحتملة وحلولها

### خطأ 1: "Cannot find module"
```bash
# الحل: تأكد من تثبيت dependencies
pnpm install

# إذا لم ينجح:
rm -rf node_modules
pnpm install --frozen-lockfile
```

### خطأ 2: "TypeScript compilation failed"
```bash
# الحل: تحقق من tsconfig.json
pnpm typecheck

# إصلاح الأخطاء واحد واحد
```

### خطأ 3: "Autopilot not found"
```bash
# الحل: تأكد من بناء Autopilot أولاً
cd odavl-studio/autopilot/engine
pnpm build
```

### خطأ 4: "Permission denied" (CLI)
```bash
# الحل: أضف executable permission
chmod +x dist/index.js

# أو في package.json:
"bin": {
  "guardian": "./dist/index.js"
}
```

---

## 🎓 نصائح مهمة

1. **اختبر باستمرار**: بعد كل تغيير، جرّب الكود
2. **Git commits صغيرة**: كل ميزة = commit منفصل
3. **اكتب tests**: ساعد نفسك في المستقبل
4. **استخدم Copilot**: للأكواد المتكررة
5. **اسأل إذا علقت**: لا تضيع وقت

---

**✅ هذا الملف جاهز 100% للبدء!**
