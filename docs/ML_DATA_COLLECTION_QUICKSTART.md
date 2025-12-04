# 🚀 ML Data Collection - Quick Start Guide

**هدف هذا الدليل**: بدء جمع البيانات لتدريب ML System V2

---

## ⚡ الخطوات السريعة (10 دقائق)

### الخطوة 1: الحصول على GitHub Token

```bash
# 1. افتح متصفحك واذهب إلى:
https://github.com/settings/tokens/new

# 2. املأ التفاصيل:
Note: "ODAVL ML Data Collection"
Expiration: 90 days
Scopes: ✅ public_repo (فقط)

# 3. انقر "Generate token"
# 4. انسخ التوكن (يظهر مرة واحدة فقط!)
```

### الخطوة 2: إعداد البيئة

```bash
# في مجلد المشروع
cd c:\Users\sabou\dev\odavl

# أنشئ ملف .env.local (إذا لم يكن موجوداً)
# انسخ من .env.ml.example
cp .env.ml.example .env.local

# افتح .env.local وعدّل:
notepad .env.local
```

أضف هذا السطر:
```env
GITHUB_TOKEN=ghp_your_token_here
```

### الخطوة 3: تجربة الجمع (اختبار)

```bash
# جمع 10,000 عينة للاختبار (30 دقيقة)
pnpm ml:collect --language typescript --target 10000

# راقب التقدم:
# ✅ Collecting TypeScript fixes...
# 📊 Progress: 1234/10000 (12.3%)
# ⏱️  ETA: 25 minutes
```

### الخطوة 4: الجمع الكامل (اختياري)

```bash
# جمع 900K عينة (60-85 ساعة)
# تحذير: هذا يأخذ وقت طويل!

# Option A: جمع لغة واحدة
pnpm ml:collect --language typescript --target 300000  # 20-30 ساعة

# Option B: جمع كل اللغات
pnpm ml:collect-all  # 60-85 ساعة
```

---

## 📊 المخرجات المتوقعة

بعد التجربة (10K عينات)، ستجد:

```
.odavl/datasets/
├── typescript-fixes.json       (10,000 samples, ~15MB)
└── collection-stats.json       (metadata)
```

مثال على عينة:
```json
{
  "id": "001",
  "language": "typescript",
  "errorType": "type-error",
  "errorMessage": "Property 'xyz' does not exist on type 'Foo'",
  "beforeCode": "const x: Foo = ...; x.xyz",
  "afterCode": "const x: Foo = ...; x.abc",
  "complexity": 3,
  "linesChanged": 1,
  "commitUrl": "https://github.com/...",
  "timestamp": "2025-11-21T..."
}
```

---

## 🎯 الخطوة التالية (بعد الجمع)

```bash
# 1. تحضير البيانات (استخراج features)
pnpm ml:prepare --input .odavl/datasets/typescript-fixes.json

# 2. تدريب النموذج (قريباً)
pnpm ml:train
```

---

## ⚠️ استكشاف الأخطاء

### مشكلة: "API rate limit exceeded"
```bash
# الحل: انتظر ساعة أو استخدم token مع 5000/hour limit
# تحقق من الحد المتبقي:
curl -H "Authorization: Bearer $GITHUB_TOKEN" https://api.github.com/rate_limit
```

### مشكلة: "No repositories found"
```bash
# الحل: تأكد من اتصال الإنترنت وأن التوكن صحيح
echo $GITHUB_TOKEN  # يجب أن يبدأ بـ ghp_
```

### مشكلة: "Collection too slow"
```bash
# الحل: استخدم --batch-size أكبر
pnpm ml:collect --language typescript --target 10000 --batch-size 100
```

---

## 📈 التقدم المتوقع

| المرحلة | الوقت | المخرجات |
|---------|-------|-----------|
| ✅ Infrastructure | 1 يوم | 1,650+ lines code |
| 🟡 Test Collection | 30 دقيقة | 10K samples |
| ⏳ Full Collection | 60-85 ساعة | 900K samples |
| ⏳ Data Preparation | 1-2 ساعة | Normalized datasets |
| ⏳ Model Training | 1-2 ساعة | Trained model (92%+ accuracy) |

**التقدم الحالي**: Week 7-8 @ 30% → بعد Test Collection: 50%

---

## 🚀 نبدأ الآن!

```bash
# الخطوة الأولى:
# 1. احصل على GitHub token
# 2. أضفه إلى .env.local
# 3. شغّل التجربة:

pnpm ml:collect --language typescript --target 10000

# بعد النجاح، نكمل بالجمع الكامل أو التدريب مباشرة
```

---

**📝 ملاحظة**: التجربة (10K samples) كافية لتدريب نموذج أولي. الجمع الكامل (900K) يحسّن الدقة من 85% → 92%+.

**🎯 الهدف**: إثبات أن ML System يعمل → ثم تحسينه بالبيانات الكبيرة.
