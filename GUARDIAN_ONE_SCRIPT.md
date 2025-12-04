# 🛡️ Guardian - دليل الاستخدام البسيط

## ✨ سكربت واحد لكل شيء: `pnpm odavl:guardian`

### 🎯 الفلسفة:
**سكربت واحد فقط** - Guardian يكتشف تلقائياً شو بدك تعمل!

---

## 📋 **جميع الاستخدامات:**

### 1️⃣ **Interactive Mode** (القائمة الكاملة)
```bash
pnpm odavl:guardian
```
**النتيجة:** Mission Control مع 12 خيار

---

### 2️⃣ **Website Checker** (فحص موقع)
```bash
pnpm odavl:guardian https://mywebsite.com
```
**كيف يكتشف؟** الـ argument يبدأ بـ `http://` أو `https://`

**النتيجة:**
- ✅ Performance (TTFB, FCP, LCP)
- ✅ Accessibility (WCAG)
- ✅ SEO (Meta, Sitemap)
- ✅ Security (HTTPS, Headers)
- ✅ Health Score: 0-100

---

### 3️⃣ **Extension Tester** (فحص إضافة VS Code)

#### أ. المجلد الحالي:
```bash
cd my-extension
pnpm odavl:guardian test-extension
```

#### ب. مجلد محدد:
```bash
pnpm odavl:guardian test-extension ./my-extension
```

#### ج. كشف تلقائي (إذا package.json فيه `engines.vscode`):
```bash
pnpm odavl:guardian ./my-extension
```

**النتيجة:**
- ✅ Package.json completeness
- ✅ Documentation (README, CHANGELOG)
- ✅ Bundle size (< 10MB)
- ✅ Activation time (< 200ms)
- ✅ Ready to Publish? Yes/No

---

### 4️⃣ **CLI Tester** (فحص أداة سطر أوامر)

#### أ. المجلد الحالي:
```bash
cd my-cli
pnpm odavl:guardian test-cli
```

#### ب. مجلد محدد:
```bash
pnpm odavl:guardian test-cli ./apps/studio-cli
```

#### ج. كشف تلقائي (إذا package.json فيه `bin`):
```bash
pnpm odavl:guardian ./my-cli-tool
```

**النتيجة:**
- ✅ --help works
- ✅ --version works
- ✅ Shebang (#!/usr/bin/env node)
- ✅ Cross-platform (Win, Linux, Mac)
- ✅ Production Ready? Yes/No

---

## 🧠 **الذكاء التلقائي:**

Guardian يكتشف **تلقائياً** شو نوع المشروع:

```bash
# إذا الـ argument:
https://... أو http://...     → Website Checker
test-extension               → Extension Tester
test-cli                     → CLI Tester
مجلد فيه package.json + vscode → Extension Tester
مجلد فيه package.json + bin    → CLI Tester
بدون arguments               → Mission Control
```

---

## 📊 **أمثلة عملية:**

### مثال 1: فحص موقع
```bash
# Development
pnpm odavl:guardian http://localhost:3000

# Staging
pnpm odavl:guardian https://staging.myapp.com

# Production
pnpm odavl:guardian https://myapp.com
```

### مثال 2: فحص كل إضافات ODAVL
```bash
# Insight Extension
pnpm odavl:guardian test-extension ./odavl-studio/insight/extension

# Autopilot Extension
pnpm odavl:guardian test-extension ./odavl-studio/autopilot/extension

# Guardian Extension
pnpm odavl:guardian test-extension ./odavl-studio/guardian/extension
```

### مثال 3: فحص CLI
```bash
# Studio CLI
pnpm odavl:guardian test-cli ./apps/studio-cli

# Guardian CLI
pnpm odavl:guardian test-cli ./odavl-studio/guardian/cli
```

### مثال 4: كشف تلقائي
```bash
# Guardian يكتشف تلقائياً أنها extension
pnpm odavl:guardian ./odavl-studio/insight/extension

# Guardian يكتشف تلقائياً أنها CLI
pnpm odavl:guardian ./apps/studio-cli
```

---

## 🎨 **الفرق بين V3 و V4:**

| الميزة | V3 | V4 |
|--------|----|----|
| **عدد السكربتات** | 5+ سكربتات | **سكربت واحد فقط!** ✅ |
| **الكشف التلقائي** | ❌ | ✅ |
| **Website Checker** | ❌ | ✅ |
| **Extension Tester** | ❌ | ✅ |
| **CLI Tester** | ❌ | ✅ |
| **Zero Config** | ❌ | ✅ |

---

## 💡 **نصائح:**

### ✅ **DO:**
```bash
pnpm odavl:guardian https://mysite.com           # ✅ مباشر
pnpm odavl:guardian test-extension               # ✅ بسيط
pnpm odavl:guardian test-cli ./my-cli            # ✅ واضح
pnpm odavl:guardian                              # ✅ قائمة كاملة
```

### ❌ **DON'T:**
```bash
node odavl-studio/guardian/cli/dist/guardian.mjs # ❌ طويل ومعقد
pnpm guardian:test-extension                     # ❌ سكربت ثاني
pnpm test:extension                              # ❌ سكربت ثالث
```

---

## 🚀 **الخلاصة:**

### **سكربت واحد = كل شيء**
```bash
pnpm odavl:guardian <anything>
```

**Guardian ذكي - بيفهم شو بدك تعمل!** 🧠

---

## 📞 **مساعدة:**

```bash
# إذا نسيت الاستخدام:
pnpm odavl:guardian --help

# أو اكتب أي شيء غلط:
pnpm odavl:guardian xyz
# Guardian بيطلعلك help تلقائياً!
```

**يلا يا بطل! سكربت واحد لكل شيء! 🎉**
