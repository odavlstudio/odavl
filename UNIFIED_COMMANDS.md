# 🎯 ODAVL Studio - Unified Product Commands

## ✨ One Command Per Product (Simplified!)

نحن الآن عندنا **3 أوامر رئيسية فقط** - واحد لكل منتج:

```bash
pnpm odavl:insight      # Error detection & analysis
pnpm odavl:autopilot    # Self-healing code infrastructure
pnpm odavl:guardian     # Web testing & monitoring
```

---

## 🔍 ODAVL Insight - Error Detection

**الأمر الرئيسي**: `pnpm odavl:insight`

يشغّل CLI تفاعلي مع **12 detector**:

```bash
pnpm odavl:insight

# Interactive Menu:
# 1. typescript      - TypeScript errors & type issues
# 2. eslint          - ESLint violations
# 3. import          - Import/dependency issues
# 4. package         - Package.json problems
# 5. runtime         - Runtime error patterns
# 6. build           - Build failures
# 7. security        - Security vulnerabilities
# 8. circular        - Circular dependencies
# 9. network         - Network/API issues
# 10. performance    - Performance bottlenecks
# 11. complexity     - Code complexity issues
# 12. isolation      - Test isolation problems
# 13. all            - Run ALL detectors
# 14. problemspanel  - Read from VS Code Problems Panel
```

### Legacy Scripts (Deprecated - للتوافق الخلفي فقط)

```bash
# هذه السكربتات لا تزال موجودة لكن deprecated:
pnpm insight:analyze   # Use: pnpm odavl:insight → option 13 (all)
pnpm insight:root      # Use: pnpm odavl:insight → specific detector
pnpm insight:fix       # Use: pnpm odavl:insight → then apply fixes
pnpm insight:autofix   # Use: pnpm odavl:insight → auto mode
pnpm insight:learn     # Use: pnpm ml:train
pnpm insight:watch     # Use: VS Code extension auto-watch
pnpm insight:full      # Use: pnpm odavl:insight → option 13
```

**توصية**: استخدم `pnpm odavl:insight` دائماً - أسهل وأوضح!

---

## 🤖 ODAVL Autopilot - Self-Healing Infrastructure

**الأمر الرئيسي**: `pnpm odavl:autopilot <command>`

يشغّل Autopilot CLI مع **8 أوامر**:

```bash
# عرض المساعدة
pnpm odavl:autopilot --help

# الأوامر المتاحة:
pnpm odavl:autopilot observe     # جمع مقاييس الجودة (ESLint + TypeScript)
pnpm odavl:autopilot decide      # تحليل + اختيار الوصفة الأفضل (ML-powered)
pnpm odavl:autopilot act         # تنفيذ الوصفة المختارة
pnpm odavl:autopilot verify      # التحقق من التحسينات
pnpm odavl:autopilot run         # تنفيذ كامل (O→D→A→V→L) ⭐ مُستحسن
pnpm odavl:autopilot undo        # التراجع عن آخر تغيير (smart rollback)
pnpm odavl:autopilot dashboard   # لوحة التحكم التحليلية
pnpm odavl:autopilot insight     # عرض آخر تشخيصات Insight
pnpm odavl:autopilot init-ci     # تهيئة CI/CD (GitHub Actions / GitLab CI)
```

### أمثلة عملية:

```bash
# 1. تنفيذ دورة كاملة (الأكثر شيوعاً)
pnpm odavl:autopilot run

# 2. مراقبة الجودة فقط
pnpm odavl:autopilot observe

# 3. التراجع عن آخر تغيير
pnpm odavl:autopilot undo

# 4. تهيئة GitHub Actions
pnpm odavl:autopilot init-ci --platform=github

# 5. إخراج JSON (للتكامل)
pnpm odavl:autopilot observe --json
```

### الملفات الهامة:

```
.odavl/
├── gates.yml           # قواعد الجودة (TypeScript errors، warnings)
├── policy.yml          # سياسة المخاطر (max files، protected paths)
├── history.json        # تاريخ التشغيل + trust scores
├── recipes/            # وصفات التحسين
├── recipes-trust.json  # درجات الثقة لكل وصفة
├── undo/               # لقطات التراجع (smart snapshots)
└── ledger/             # سجل التعديلات (audit trail)
```

---

## 🛡️ ODAVL Guardian - Web Testing & Monitoring

**الأمر الرئيسي**: `pnpm odavl:guardian <command>`

يشغّل Guardian CLI للاختبار الشامل:

```bash
# عرض المساعدة
pnpm odavl:guardian --help

# الأوامر المتاحة:
pnpm odavl:guardian test <url>              # اختبار موقع كامل
pnpm odavl:guardian accessibility <url>     # اختبار إمكانية الوصول (WCAG 2.1 AA)
pnpm odavl:guardian performance <url>       # اختبار الأداء (Core Web Vitals)
pnpm odavl:guardian security <url>          # اختبار الأمان (OWASP Top 10)
pnpm odavl:guardian mobile <url>            # اختبار الموبايل
pnpm odavl:guardian report                  # عرض آخر تقرير
```

### أمثلة عملية:

```bash
# 1. اختبار شامل (الأكثر شيوعاً)
pnpm odavl:guardian test https://example.com

# 2. اختبار إمكانية الوصول فقط
pnpm odavl:guardian accessibility https://example.com

# 3. اختبار بلغة معينة
pnpm odavl:guardian test https://example.com --lang ar  # العربية (RTL)
pnpm odavl:guardian test https://example.com --lang de  # الألمانية

# 4. اختبار مع ميزانية أداء محددة
pnpm odavl:guardian performance https://example.com --budget mobile-slow-3g

# 5. تصدير تقرير HTML
pnpm odavl:guardian test https://example.com --format html --output report.html
```

### ميزانيات الأداء المتاحة:

```typescript
desktop           // سطح مكتب عادي
mobile            // موبايل 4G
mobile-slow-3g    // موبايل 3G بطيء
ecommerce         // متاجر إلكترونية (صارم)
content           // مواقع محتوى
dashboard         // لوحات تحكم (أقل صرامة)
```

---

## 📊 المقارنة: قبل vs بعد

### ❌ قبل التوحيد (14 سكربت!):

```bash
# Insight (8 سكربتات متفرقة):
pnpm insight:analyze
pnpm insight:root
pnpm insight:fix
pnpm insight:autofix
pnpm insight:learn
pnpm insight:verify
pnpm insight:watch
pnpm insight:full

# Autopilot (5 سكربتات في engine):
# كانت داخل engine فقط، مش في root

# Guardian (1 سكربت):
pnpm odavl:guardian
```

### ✅ بعد التوحيد (3 سكربتات فقط!):

```bash
pnpm odavl:insight      # ✨ CLI تفاعلي - كل الميزات
pnpm odavl:autopilot    # ✨ CLI كامل - 8 أوامر
pnpm odavl:guardian     # ✨ CLI شامل - اختبار كامل
```

**التحسين**: **من 14 سكربت → 3 سكربتات موحدة** (تبسيط 78%)

---

## 🎯 أيهما تستخدم؟

### 🔍 استخدم Insight عندما:
- تريد **كشف الأخطاء** في الكود
- تحتاج **تحليل شامل** للمشاكل
- تبحث عن **ثغرات أمنية**
- تريد فهم **تعقيد الكود**

### 🤖 استخدم Autopilot عندما:
- تريد **إصلاح تلقائي** للأخطاء
- تحتاج **تحسين مستمر** للجودة
- تريد **CI/CD automation**
- تحتاج **smart rollback** للتراجع الآمن

### 🛡️ استخدم Guardian عندما:
- تختبر **موقع ويب** (production/staging)
- تتحقق من **إمكانية الوصول** (WCAG)
- تقيس **أداء الويب** (Core Web Vitals)
- تفحص **أمان الويب** (OWASP)

---

## 🚀 الـ Workflow المُستحسن

### للتطوير اليومي (Daily Development):

```bash
# 1. تشخيص شامل
pnpm odavl:insight

# 2. إصلاح تلقائي
pnpm odavl:autopilot run

# 3. التحقق من الجودة
pnpm forensic:all
```

### قبل الـ Deployment:

```bash
# 1. اختبار الكود
pnpm forensic:all

# 2. اختبار الموقع (staging)
pnpm odavl:guardian test https://staging.example.com

# 3. التحقق من Core Web Vitals
pnpm odavl:guardian performance https://staging.example.com

# 4. التحقق من Accessibility
pnpm odavl:guardian accessibility https://staging.example.com --lang ar
```

### في الـ CI/CD:

```bash
# GitHub Actions / GitLab CI
pnpm forensic:all                              # Lint + Typecheck + Coverage
pnpm odavl:autopilot run                       # Auto-fix if needed
pnpm odavl:guardian test $STAGING_URL --json  # Web testing
```

---

## 📝 ملاحظات هامة

### 1. السكربتات القديمة (Legacy):
- جميع السكربتات القديمة (`insight:analyze`, `insight:fix`, إلخ) **لا تزال تعمل**
- لكنها **deprecated** ونوصي باستخدام الأوامر الموحدة الجديدة
- سيتم إزالتها في **v3.0.0** (بعد 6 أشهر)

### 2. Backward Compatibility:
- التعديلات **100% backward compatible**
- لن تتأثر أي سكربتات CI/CD موجودة
- نوصي بالترقية التدريجية

### 3. Documentation:
- كل أمر يدعم `--help` لعرض المساعدة
- راجع `README.md` في كل منتج للتفاصيل
- الوثائق الكاملة: `docs/` directory

---

## 🎉 الخلاصة

**التوحيد الجديد يجعل ODAVL Studio:**
- ✅ **أسهل في الاستخدام** (3 أوامر بدلاً من 14)
- ✅ **أوضح** (أمر واحد لكل منتج)
- ✅ **أقوى** (CLI تفاعلي لكل منتج)
- ✅ **متسق** (نفس النمط للجميع)

**جرّب الآن**:
```bash
pnpm odavl:insight       # الأسهل للتشخيص
pnpm odavl:autopilot run # الأقوى للإصلاح
pnpm odavl:guardian test https://example.com # الأشمل للاختبار
```

---

**Created**: December 3, 2024  
**Version**: 2.0.0  
**Status**: ✅ Production Ready
