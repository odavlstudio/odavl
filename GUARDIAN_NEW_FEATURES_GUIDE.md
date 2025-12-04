# 🚀 Guardian CLI - دليل الميزات الجديدة

## الميزات المضافة

### 1️⃣ JSON Mode للـ CI/CD ✅

```bash
# استخدام
pnpm odavl:guardian --json

# مثال على المخرجات
{
  "timestamp": "2025-11-30T...",
  "version": "4.0.0",
  "readiness": 89,
  "confidence": 96,
  "issues": { "total": 3, "critical": 0, "warnings": 2, "info": 1 },
  "executionTime": 23.7
}
```

**الفوائد**:
- تكامل سهل مع CI/CD pipelines
- يمكن parse النتائج بسهولة
- لا يوجد ANSI colors في الـ output

---

### 2️⃣ HTML Report التفاعلي ✅

```bash
# استخدام
pnpm odavl:guardian --html

# النتيجة
# ✅ Analysis complete
# 📊 HTML report generated: .odavl/guardian/reports/report-1234567890.html
```

**الميزات**:
- تصميم dark mode احترافي
- جداول ورسوم بيانية
- قابل للمشاركة مع الفريق
- يفتح في المتصفح مباشرة

---

### 3️⃣ Comparison Mode (مقارنة مع آخر تشغيل) ✅

```bash
# استخدام
pnpm odavl:guardian --compare

# المخرجات
🔄 Comparison with last run:
   Readiness: 85% → 89% (+4%) ↗
   Issues: 5 → 3 (-2) ↓
```

**الفوائد**:
- يعرض التحسن أو التراجع
- أسهم ملونة (↗ للتحسن، ↘ للتراجع)
- يحفظ تاريخ كامل في `.odavl/guardian/reports/`

---

### 4️⃣ Watch Mode (تشغيل تلقائي) ✅

```bash
# استخدام
pnpm odavl:guardian watch

# النتيجة
👁️ Watch Mode Activated
──────────────────────────────────────────────────
Watching for file changes...
Press Ctrl+C to stop

🔄 Change detected: src/index.ts
# يُعيد التشغيل تلقائياً
```

**الفوائد**:
- يراقب `src/`, `apps/`, `packages/`, `odavl-studio/`
- debounce 1 ثانية (لا يُشغل على كل حفظ)
- مثالي أثناء التطوير

---

### 5️⃣ Git Hooks Integration ✅

```bash
# تثبيت Pre-commit Hook
# أضف في .git/hooks/pre-commit:
#!/bin/sh
pnpm odavl:guardian git-hook

# أو استخدم مباشرة
pnpm odavl:guardian --exit-on-error
```

**الفوائد**:
- يمنع commit كود به أخطاء
- يعرض رسالة واضحة إذا فشل
- يمكن تجاوزه بـ `--no-verify`

---

### 6️⃣ Severity Colors ديناميكية ✅

**قبل**: دائماً أخضر/أصفر ثابت
**بعد**: يتغير حسب العدد الفعلي للمشاكل

```typescript
0 issues   → Green "Ready ✅"
1-3 issues → Yellow "Review ⚠"
4+ issues  → Red "Fix Required ❌"
```

**يظهر في**:
- جدول الملخص
- الـ HTML report
- JSON output

---

## 📋 أمثلة الاستخدام

### مثال 1: CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/guardian.yml
name: Guardian Check

on: [push, pull_request]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
        with:
          version: 9.12.2
      - run: pnpm install
      - run: pnpm odavl:guardian --json --exit-on-error > guardian-report.json
      - uses: actions/upload-artifact@v3
        with:
          name: guardian-report
          path: guardian-report.json
```

### مثال 2: التطوير اليومي

```bash
# شاشة 1: وضع Watch
pnpm odavl:guardian watch

# شاشة 2: التطوير
code src/index.ts
# كل ما تحفظ (Ctrl+S) يُعيد تشغيل Guardian تلقائياً
```

### مثال 3: تقرير أسبوعي للفريق

```bash
# نهاية الأسبوع، وَلِّد تقرير HTML
pnpm odavl:guardian --html --compare

# شارك الـ HTML مع الفريق
# File: .odavl/guardian/reports/report-TIMESTAMP.html
```

### مثال 4: Pre-commit Hook

```bash
# ثبّت الـ hook
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/sh
echo "🔍 Running Guardian pre-commit checks..."
pnpm odavl:guardian git-hook
EOF

chmod +x .git/hooks/pre-commit

# الآن كل commit يفحص تلقائياً
git add .
git commit -m "feat: new feature"
# → Guardian يفحص قبل الـ commit
```

---

## 🎯 الأوامر الجديدة

```bash
# القائمة التفاعلية المحدثة (الآن 6 خيارات)
pnpm odavl:guardian
# 1. 🤖 Full AI Analysis
# 2. ⚡ Quick Analysis
# 3. 👁️ Watch Mode         ← جديد
# 4. 📊 Open Dashboard
# 5. 📋 System Status
# 6. ❌ Exit

# الأوامر المباشرة
pnpm odavl:guardian launch:ai --json          # JSON output
pnpm odavl:guardian launch:ai --html          # HTML report
pnpm odavl:guardian launch:ai --compare       # Compare with last run
pnpm odavl:guardian watch                     # Watch mode
pnpm odavl:guardian git-hook                  # For pre-commit
pnpm odavl:guardian --exit-on-error           # Exit code 1 on errors
```

---

## 📊 مثال على التقرير الكامل

```
🛡️  Guardian v4.0

──────────────────────────────────────────────────

[1/5] 📝 Static Analysis
   ✓ 4/4 files found
   ✓ ESLint passed
   ✗ TypeScript: 1 error

[2/5] 🚀 Runtime Testing
   ✓ 4 scenarios passed

[3/5] 👁️  Visual Analysis
   ✓ AI confidence: 96%
   ✓ Accessibility: 94/100

[4/5] 🧠 Error Analysis
   ✓ Coverage: 87%
   ✓ Security: A+ (95/100)

[5/5] 📋 Generating Report
   ✓ Report saved

──────────────────────────────────────────────────

✅ Analysis Complete!

🔄 Comparison with last run:
   Readiness: 85% → 89% (+4%) ↗
   Issues: 5 → 3 (-2) ↓

┌─────────────────────┬──────────────────────┐
│ Readiness          │ 89% (Ready ✅)       │
│ Confidence         │ High (96%)           │
│ Issues             │ 3 total              │
│ Time               │ 23.7s                │
└─────────────────────┴──────────────────────┘

🎯 Next: odavl autopilot run (auto-fix 2 issues)
💡 Tip:  --verbose for details
📊 HTML report: .odavl/guardian/reports/report-1234567890.html
```

---

## 🔧 التطبيق على الملف الحالي

### خطوة 1: أضف الـ interfaces الجديدة

ابحث عن `interface LaunchOptions` وأضف:

```typescript
interface LaunchOptions {
  // ... الموجود
  json?: boolean;
  html?: boolean;
  compare?: boolean;
  watch?: boolean;
  exitOnError?: boolean;
}

interface GuardianReport {
  timestamp: string;
  version: string;
  path: string;
  readiness: number;
  confidence: number;
  issues: {
    total: number;
    critical: number;
    warnings: number;
    info: number;
  };
  executionTime: number;
  phases: {
    staticAnalysis: { passed: boolean; errors: number; warnings: number };
    runtimeTests: { passed: boolean; scenarios: number };
    visualAnalysis: { confidence: number; score: number };
    errorAnalysis: { coverage: number; securityScore: string };
  };
}
```

### خطوة 2: أضف Helper Functions

```typescript
function getSeverityStatus(issues: number) {
  if (issues === 0) return { color: chalk.green, text: 'Ready ✅' };
  if (issues <= 3) return { color: chalk.yellow, text: 'Review ⚠' };
  return { color: chalk.red, text: 'Fix Required ❌' };
}

async function saveReport(report: GuardianReport, path: string) {
  const reportsDir = join(path, '.odavl', 'guardian', 'reports');
  await mkdir(reportsDir, { recursive: true });
  await writeFile(join(reportsDir, 'latest.json'), JSON.stringify(report, null, 2));
}

async function loadPreviousReport(path: string): Promise<GuardianReport | null> {
  try {
    const content = await readFile(join(path, '.odavl', 'guardian', 'reports', 'latest.json'), 'utf-8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}
```

### خطوة 3: حدّث القائمة التفاعلية

غيّر من 5 خيارات إلى 6:

```typescript
console.log(chalk.white('\n  1. 🤖 Full AI Analysis    (recommended)'));
console.log(chalk.white('  2. ⚡ Quick Analysis      (fast)'));
console.log(chalk.white('  3. 👁️  Watch Mode          (auto re-run)'));  // جديد
console.log(chalk.white('  4. 📊 Open Dashboard'));
console.log(chalk.white('  5. 📋 System Status'));
console.log(chalk.white('  6. ❌ Exit'));
```

### خطوة 4: أضف Watch Mode Function

```typescript
async function runWatchMode(path: string, options: LaunchOptions) {
  console.log(chalk.bold.cyan('\n👁️  Watch Mode Activated\n'));
  console.log(chalk.yellow('Watching for file changes... (Ctrl+C to stop)\n'));
  
  const { watch } = await import('fs');
  let debounceTimer: NodeJS.Timeout | null = null;
  
  watch(join(path, 'src'), { recursive: true }, () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => runLaunchQuick(path, options), 1000);
  });
  
  await new Promise(() => {}); // Keep alive
}
```

---

## ✅ الحالة

- ✅ الميزات مُصممة
- ✅ الأمثلة جاهزة
- ✅ الدليل مكتوب
- ⏳ **التطبيق على guardian.ts** (يحتاج تعديلات يدوية بسبب حجم الملف)

**هل تريد:**
1. ملف guardian.ts كامل جديد مع كل الميزات؟
2. خطوات تطبيق كل ميزة واحدة بواحدة؟
3. اختبار الميزات الحالية أولاً قبل إضافة الجديد؟
