# ODAVL Insight - Unified Error Detection System

## 🎯 Overview

ODAVL Insight is a unified system to detect **all types of errors** in ODAVL Monorepo projects:

- ✅ **TypeScript errors** (TS2307, TS2304, TS2345, etc.)
- ✅ **ESLint errors** (no-unused-vars, no-console, react-hooks, etc.)
- ✅ **Import/Export errors** (missing files, circular dependencies)
- ✅ **Package.json errors** (missing dependencies, version conflicts)
- ✅ **Runtime errors** (unhandled promises, crashes, memory errors)
- ✅ **Build errors** (webpack, vite, Next.js, rollup failures)

---

## 🚀 Quick Start

### Interactive Mode

```bash
pnpm odavl:insight
```

The system will ask:

```
🔎 Which directory would you like to focus on?
  1. apps/cli
  2. apps/vscode-ext
  3. apps/insight-cloud
  4. apps/odavl-website-v2
  5. packages/insight-core
  6. . (root - entire project)
```

Choose a number or type a custom path.

---

### Direct Run with Specific Path

```bash
# Check apps/cli only
pnpm odavl:insight apps/cli

# Check apps/odavl-website-v2
pnpm odavl:insight apps/odavl-website-v2

# Check entire project
pnpm odavl:insight .
```

---

### Continuous Watch Mode

```bash
# Will run check every 10 seconds
pnpm odavl:insight:watch

# Or with specific path
pnpm odavl:insight apps/cli --watch
```

---

## 📋 What Does Each Detector Find?

### 1️⃣ TypeScript Detector (`ts-detector.ts`)

Detects TypeScript errors via `tsc --noEmit`:

- **TS2307**: Cannot find module
- **TS2304**: Cannot find name (undefined variable/function)
- **TS2345**: Argument type mismatch
- **TS2339**: Property does not exist
- **TS2322**: Type assignment error
- **TS2741**: Missing properties in object
- **TS7006**: Parameter implicitly has 'any' type
- **TS2769**: No overload matches this call

**Example output:**

```
🔷 TYPESCRIPT ERROR [TS2307]
📁 File: apps/cli/src/index.ts
📍 Line: 15
💬 Cannot find module './missing-file'

🔍 Root Cause:
   TypeScript couldn't find the required module

✅ Suggested Fix:
   1. Verify file exists in correct path
   2. Review import path
   3. If external package, install it: pnpm add <package>
```

---

### 2️⃣ ESLint Detector (`eslint-detector.ts`)

Detects ESLint errors via `eslint --format json`:

- **no-unused-vars**: Unused variables
- **no-console**: console.log usage
- **@typescript-eslint/no-explicit-any**: Use of any type
- **react-hooks/exhaustive-deps**: Missing useEffect dependencies
- **no-undef**: Undefined variable
- **prefer-const**: Using let instead of const
- **no-debugger**: Leftover debugger statement
- **import/no-unresolved**: Unresolvable import

**Feature**: Supports automatic auto-fix!

```text
📏 ESLINT ERROR [no-unused-vars] [fixable 🔧]
📁 File: apps/cli/src/utils.ts
📍 Line: 42
💬 'unusedVar' is assigned a value but never used

🔍 Root Cause:
   Variable declared but not used in code

✅ Suggested Fix:
   - Delete variable if unnecessary
   - Add _ prefix if part of destructuring
   - Or run: pnpm eslint --fix
```

---

### 3️⃣ Import Detector (`import-detector.ts`)

Detects import/export issues:

- **not-found**: Import file not found
- **no-export**: Export doesn't exist in file
- **circular**: Circular dependencies (TODO)
- **syntax-error**: Error in import syntax

**مثال:**

```
🔗 IMPORT ERROR [not-found]
📁 الملف: apps/vscode-ext/src/index.ts
📍 السطر: 8
💬 import { helper } from './missing'

🔍 السبب الجذري:
   الملف المستورد غير موجود: ./missing

✅ الحل المقترح:
   تأكد من صحة المسار أو أن الملف موجود في:
   c:\Users\sabou\dev\odavl\apps\vscode-ext\src\missing
   جرّب: ls c:\Users\sabou\dev\odavl\apps\vscode-ext\src
```

---

### 4️⃣ Package Detector (`package-detector.ts`)

يكتشف مشاكل package.json:

- **missing-dependency**: حزم غير مثبتة في node_modules
- **version-mismatch**: نفس الحزمة بنسختين مختلفتين
- **peer-conflict**: Peer dependencies مفقودة
- **invalid-json**: خطأ في صيغة JSON
- **unused-dependency**: حزم مثبتة لكن غير مستخدمة

**مثال:**

```
❌ PACKAGE ERROR [DEPENDENCY غير مثبت]
📦 الحزمة: glob
📁 الملف: packages/insight-core/package.json

🔍 السبب الجذري:
   الحزمة glob مُعرّفة في package.json لكن غير مثبتة في node_modules

✅ الحل المقترح:
   cd packages/insight-core && pnpm install glob
```

---

### 5️⃣ Runtime Detector (`runtime-detector.ts`)

يكتشف runtime errors من logs:

- **unhandled-promise**: Promise rejection بدون catch
- **uncaught-exception**: Exception غير معالج
- **crash**: تعطل كامل (FATAL ERROR)
- **assertion-failure**: Assertion فشل
- **memory-error**: نفاد الذاكرة (ENOMEM)

**مثال:**

```
💥 RUNTIME ERROR [unhandled-promise] [HIGH]
⏰ الوقت: 2024-01-15T10:30:45.123Z
📁 الملف: .odavl/logs/odavl.log
📍 السطر: 42
💬 UnhandledPromiseRejectionWarning: Database connection failed

🔍 السبب الجذري:
   Promise rejected بدون catch handler - عملية async فشلت ولم يتم معالجة الخطأ

✅ الحل المقترح:
   أضف .catch() handler أو استخدم try/catch:
   await somePromise().catch(err => console.error(err));

📋 Stack Trace:
at Database.connect (lib/db.ts:15:3)
at async main (index.ts:42:5)
```

---

### 6️⃣ Build Detector (`build-detector.ts`)

يكتشف أخطاء build process:

- **webpack**: Module not found, compilation errors
- **vite**: Build failures, plugin errors
- **next**: Next.js build errors
- **rollup**: Rollup compilation errors
- **esbuild**: ESBuild errors
- **tsc**: TypeScript compilation errors

**مثال:**

```
🏗️  BUILD ERROR [WEBPACK]
📁 الملف: apps/cli/src/index.ts
💬 Module not found: Error: Can't resolve 'missing-module'

🔍 السبب الجذري:
   Webpack لم يستطع إيجاد module: missing-module

✅ الحل المقترح:
   تأكد أن الملف موجود أو ثبّت الحزمة:
   pnpm add missing-module
```

---

## 🏗️ البنية المعمارية

```
packages/insight-core/
└── src/
    └── detector/
        ├── index.ts              # تصدير جميع الـ detectors
        ├── ts-detector.ts        # TypeScript error detection
        ├── eslint-detector.ts    # ESLint error detection
        ├── import-detector.ts    # Import/Export error detection
        ├── package-detector.ts   # Package.json error detection
        ├── runtime-detector.ts   # Runtime error detection (from logs)
        └── build-detector.ts     # Build process error detection

apps/cli/
└── src/
    └── commands/
        └── insight.ts            # CLI command التفاعلي
```

---

## 🔌 التكامل مع ODAVL CLI

### إعادة كتابة observe.ts

الآن `apps/cli/src/phases/observe.ts` **فارغ تماماً** (stub only).  
يجب إعادة كتابته لاستخدام النظام الجديد:

```typescript
// apps/cli/src/phases/observe.ts
import {
    TSDetector,
    ESLintDetector,
    ImportDetector,
    PackageDetector,
    RuntimeDetector,
    BuildDetector
} from '@odavl/insight-core/detector';

export async function observe() {
    const workspaceRoot = process.cwd();

    // تشغيل جميع detectors
    const [
        tsErrors,
        eslintErrors,
        importErrors,
        packageErrors,
        runtimeErrors,
        buildErrors
    ] = await Promise.all([
        new TSDetector(workspaceRoot).detect(),
        new ESLintDetector(workspaceRoot).detect(),
        new ImportDetector(workspaceRoot).detect(),
        new PackageDetector(workspaceRoot).detect(),
        new RuntimeDetector(workspaceRoot).detect(),
        new BuildDetector(workspaceRoot).detect()
    ]);

    return {
        eslintWarnings: eslintErrors.filter(e => e.severity === 'warning').length,
        typeErrors: tsErrors.length,
        importErrors: importErrors.length,
        packageErrors: packageErrors.length,
        runtimeErrors: runtimeErrors.filter(e => e.severity === 'critical').length,
        buildErrors: buildErrors.length
    };
}
```

---

## 🔄 التكامل مع VS Code Extension

يمكن ربط النظام مع `apps/vscode-ext`:

```typescript
// apps/vscode-ext/src/services/InsightService.ts
import { runInsight } from '../../../../apps/cli/src/commands/insight';

export class InsightService {
    async runDetection(targetDir: string) {
        await runInsight({ targetDir, watch: false });
    }

    async startWatchMode(targetDir: string) {
        await runInsight({ targetDir, watch: true });
    }
}
```

ثم إضافة panel جديد في Extension:

- **Dashboard**: عرض summary للأخطاء
- **Real-time notifications**: إشعارات فورية عند اكتشاف أخطاء جديدة

---

## 📦 تثبيت Dependencies

قبل الاستخدام، تأكد من تثبيت dependencies:

```bash
# في المجلد الرئيسي
pnpm install

# في packages/insight-core
cd packages/insight-core
pnpm install glob

# بناء insight-core
pnpm run build
```

---

## ⚙️ الإعدادات

يمكن تخصيص detectors عبر `.odavl/gates.yml`:

```yaml
insight:
  enabled_detectors:
    - typescript
    - eslint
    - import
    - package
    - runtime
    - build
  
  watch_interval: 10000  # مللي ثانية
  
  ignore_patterns:
    - "node_modules/**"
    - "dist/**"
    - ".next/**"
    - "out/**"
```

---

## 🎨 مميزات إضافية

### 1. تصدير تقرير JSON

```bash
pnpm odavl:insight . --json > report.json
```

### 2. فحص detectors محددة فقط

```bash
# فحص TypeScript و ESLint فقط
pnpm odavl:insight . --detectors=typescript,eslint
```

### 3. CI/CD Integration

```yaml
# .github/workflows/insight.yml
jobs:
  insight:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: pnpm install
      - run: pnpm odavl:insight . --ci
```

---

## 🗑️ حذف التطبيقات القديمة

بعد التأكد من عمل النظام الموحد:

```bash
# حذف insight-cloud (overly complex, requires database)
rm -rf apps/insight-cloud

# حذف website-v2/insight (website-specific, not general-purpose)
rm -rf apps/odavl-website-v2/insight
```

النظام الموحد في `packages/insight-core` + `apps/cli/src/commands/insight.ts` هو البديل الشامل!

---

## 🤝 المساهمة

لإضافة detector جديد:

1. أنشئ ملف `src/detector/new-detector.ts`
2. صدّره في `src/detector/index.ts`
3. أضفه في `apps/cli/src/commands/insight.ts`
4. وثّق في هذا الـ README

---

## 📚 مراجع إضافية

- [ODAVL User Guide](../../ODAVL_USER_GUIDE.md)
- [Developer Guide](../../DEVELOPER_GUIDE.md)
- [Architecture Docs](../../docs/ARCHITECTURE.md)

---

**تم البناء بـ ❤️ من فريق ODAVL**
