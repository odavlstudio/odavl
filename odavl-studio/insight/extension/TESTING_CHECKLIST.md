# ✅ Checklist - تثبيت واختبار ODAVL Insight v2.0.4

## 📋 قبل التثبيت

- [ ] **إلغاء تثبيت النسخة القديمة**
  - [ ] Ctrl+Shift+X → ابحث عن "ODAVL Insight"
  - [ ] ⚙️ → Uninstall
  - [ ] Ctrl+Shift+P → "Reload Window"

- [ ] **التحقق من VS Code Version**
  - [ ] يجب أن يكون ≥ 1.80.0
  - [ ] Help → About → Visual Studio Code

---

## 📥 التثبيت

- [ ] **تثبيت من VSIX**
  - [ ] Ctrl+Shift+P
  - [ ] "Extensions: Install from VSIX"
  - [ ] اختر: `odavl-insight-vscode-2.0.4.vsix`
  - [ ] انتظر: "Extension installed successfully"

- [ ] **إعادة تشغيل VS Code**
  - [ ] Ctrl+Shift+P → "Reload Window"
  - [ ] أو أغلق وافتح VS Code

---

## 🔍 التحقق من التثبيت (Visual Check)

### Activity Bar ✅
- [ ] **أيقونة ODAVL موجودة في Activity Bar** (اليسار)
  - [ ] الشكل: دائرة بنفسجية/ذهبية (ليست دائرة بيضاء!)
  - [ ] عند التمرير: "ODAVL Insight"

### Sidebar Panels ✅
- [ ] **انقر على أيقونة ODAVL**
- [ ] يجب أن ترى 3 Panels:
  - [ ] **Issues Explorer**
    - [ ] إذا لا توجد مشاكل: "Welcome to ODAVL Insight! 🎉"
    - [ ] زر: "📊 Click here to analyze workspace"
  - [ ] **Detectors**
    - [ ] 14 Detector مجمعة:
      - [ ] TypeScript (4)
      - [ ] All Languages (4)
      - [ ] Python (3)
      - [ ] Java (3)
  - [ ] **Statistics**
    - [ ] إذا لا توجد مشاكل: "No issues detected ✨"
    - [ ] زر: "Start Analysis"

### Commands ✅
- [ ] **Ctrl+Shift+P → اكتب "ODAVL"**
- [ ] يجب أن ترى 9 Commands:
  - [ ] ODAVL: Analyze Workspace
  - [ ] ODAVL: Analyze Active File
  - [ ] ODAVL: Clear Diagnostics
  - [ ] ODAVL: Run Detector
  - [ ] ODAVL: Show Language Info
  - [ ] ODAVL: Show Workspace Languages
  - [ ] ODAVL: Show Dashboard
  - [ ] ODAVL: Refresh Issues
  - [ ] ODAVL: Toggle Detector

---

## 🧪 الاختبار الوظيفي (Functional Test)

### 1. تحليل مشروع TypeScript
- [ ] **فتح مشروع TypeScript**
  - [ ] File → Open Folder → (مشروع TypeScript)
- [ ] **تشغيل التحليل**
  - [ ] انقر على أيقونة ODAVL
  - [ ] Issues Explorer → "Click here to analyze workspace"
  - [ ] أو: Ctrl+Shift+P → "ODAVL: Analyze Workspace"
- [ ] **انتظر التحليل** (10-30 ثانية)
- [ ] **التحقق من النتائج**:
  - [ ] Issues Explorer: عرض المشاكل حسب Severity
  - [ ] Statistics: عداد المشاكل (Total, Errors, Warnings, Info)
  - [ ] Ctrl+Shift+M: VS Code Problems Panel يعرض مشاكل ODAVL

### 2. فتح Dashboard
- [ ] **Ctrl+Shift+P → "ODAVL: Show Dashboard"**
- [ ] يجب أن يفتح Webview:
  - [ ] عنوان: "ODAVL Insight Dashboard"
  - [ ] Charts: Bar chart للملفات
  - [ ] Grid: Detectors status
  - [ ] Metrics: Confidence scores

### 3. اختبار Detectors Panel
- [ ] **في Detectors Panel**:
  - [ ] انقر على detector (مثل: "TypeScript Detector")
  - [ ] يجب أن يُنفذ التحليل
  - [ ] Toggle ON/OFF: يجب أن يعمل

### 4. اختبار Multi-Language
- [ ] **فتح ملف Python**:
  - [ ] أنشئ `test.py` مع كود فيه مشاكل
  - [ ] احفظ (Ctrl+S)
  - [ ] انتظر 500ms
  - [ ] تحقق من Problems Panel
- [ ] **فتح ملف Java**:
  - [ ] أنشئ `Test.java` مع كود فيه مشاكل
  - [ ] احفظ (Ctrl+S)
  - [ ] انتظر 500ms
  - [ ] تحقق من Problems Panel

---

## ⚡ اختبار الأداء (Performance Test)

### Startup Time
- [ ] **أغلق VS Code بالكامل**
- [ ] **افتح VS Code**
- [ ] **قِس الوقت حتى ظهور أيقونة ODAVL**
  - [ ] يجب أن يكون < 1 ثانية
  - [ ] مثالي: < 200ms

### Analysis Time
- [ ] **شغّل تحليل على مشروع صغير** (< 50 ملف)
  - [ ] يجب أن يكتمل خلال < 15 ثانية
- [ ] **شغّل تحليل على مشروع متوسط** (100-500 ملف)
  - [ ] يجب أن يكتمل خلال < 60 ثانية

### Memory Usage
- [ ] **Ctrl+Shift+P → "Developer: Show Running Extensions"**
- [ ] **ابحث عن "ODAVL Insight"**
  - [ ] Host: LocalProcess
  - [ ] Activation: مُفعّل

---

## ❌ استكشاف الأخطاء (Troubleshooting)

### المشكلة: لا توجد أيقونة في Activity Bar
**التشخيص**:
- [ ] تحقق من Extensions: Ctrl+Shift+X
- [ ] ابحث عن "ODAVL Insight"
- [ ] يجب أن يكون: Enabled ✅

**الحل**:
- [ ] Ctrl+Shift+P → "Developer: Reload Window"
- [ ] إذا لم يعمل: إلغاء التثبيت وإعادة التثبيت

---

### المشكلة: Panels فارغة ("no data provider")
**التشخيص**:
- [ ] Ctrl+Shift+P → "Developer: Show Running Extensions"
- [ ] ابحث عن "ODAVL Insight"
- [ ] يجب أن يكون Host: LocalProcess

**الحل**:
- [ ] أغلق VS Code بالكامل
- [ ] احذف: `~/.vscode/extensions/odavl.odavl-insight-vscode-*`
- [ ] أعد التثبيت من VSIX

---

### المشكلة: Commands لا تظهر
**التشخيص**:
- [ ] Ctrl+Shift+P → اكتب "ODAVL"
- [ ] إذا لم تظهر أي Commands → Extension لم ينشط

**الحل**:
- [ ] تحقق من package.json:
  ```json
  "activationEvents": ["*"]  // يجب أن يكون "*" وليس []
  ```
- [ ] أعد بناء VSIX إذا كان فارغاً

---

### المشكلة: Dashboard لا يفتح
**التشخيص**:
- [ ] Ctrl+Shift+P → "ODAVL: Show Dashboard"
- [ ] إذا ظهرت رسالة "command not found" → Extension لم ينشط

**الحل**:
- [ ] Ctrl+Shift+P → "Developer: Reload Window"
- [ ] إذا لم يعمل: تحقق من Output Panel → "ODAVL Insight"

---

## 📊 معايير النجاح (Success Criteria)

### ✅ PASS Criteria
- [x] Activity Bar يعرض أيقونة ODAVL (بنفسجية/ذهبية)
- [x] 3 Panels تعمل (Issues, Detectors, Statistics)
- [x] 9 Commands تظهر في Command Palette
- [x] Dashboard يفتح بدون أخطاء
- [x] التحليل يعمل على TypeScript/Python/Java
- [x] Problems Panel يعرض مشاكل ODAVL
- [x] Startup time < 1 ثانية
- [x] لا توجد Console Errors في Developer Tools

### ❌ FAIL Criteria (يجب الإبلاغ عنها)
- [ ] أيقونة Activity Bar دائرة بيضاء
- [ ] Panels تعرض "no data provider"
- [ ] Commands تعرض "not found"
- [ ] Dashboard لا يفتح
- [ ] Extension لا ينشط (Host: LocalProcess غير موجود)
- [ ] Console Errors في Developer Tools (F12)

---

## 🎯 خطوات ما بعد الاختبار

### إذا نجح الاختبار ✅
- [ ] **تهانينا!** Extension جاهز للاستخدام
- [ ] **الخطوة التالية**: رفع إلى Marketplace
- [ ] **اختياري**: إضافة Screenshots (5 صور)
- [ ] **الإعلان**: نشر الإصدار

### إذا فشل الاختبار ❌
- [ ] **راجع**: `FINAL_INSPECTION_REPORT.md`
- [ ] **تحقق من**: package.json → `activationEvents`
- [ ] **افتح**: Developer Tools (F12) → Console
- [ ] **أبلغ عن**: الخطأ مع Screenshot

---

## 📝 ملاحظات الاختبار

**التاريخ**: _________________  
**الوقت**: _________________  
**VS Code Version**: _________________  
**OS**: _________________

**النتائج**:
```
Activity Bar Icon:    [ ] ✅ PASS  [ ] ❌ FAIL
Panels (3):           [ ] ✅ PASS  [ ] ❌ FAIL
Commands (9):         [ ] ✅ PASS  [ ] ❌ FAIL
Dashboard:            [ ] ✅ PASS  [ ] ❌ FAIL
TypeScript Analysis:  [ ] ✅ PASS  [ ] ❌ FAIL
Python Analysis:      [ ] ✅ PASS  [ ] ❌ FAIL
Java Analysis:        [ ] ✅ PASS  [ ] ❌ FAIL
Performance:          [ ] ✅ PASS  [ ] ❌ FAIL
```

**الخلاصة**: [ ] ✅ جاهز للإطلاق  [ ] ❌ يحتاج إصلاحات

**ملاحظات إضافية**:
```
___________________________________________________________
___________________________________________________________
___________________________________________________________
```

---

*آخر تحديث: 28 نوفمبر 2025*  
*النسخة: 2.0.4*
