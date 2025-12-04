# دليل الاستفادة القصوى من GitHub Copilot في ODAVL

## 🎯 نظرة عامة

تم تصميم مشروع ODAVL ليعمل بشكل مثالي مع GitHub Copilot. هذا الدليل يوضح كيفية الاستفادة القصوى من قدرات Copilot.

## 📋 الإعداد الأولي

### 1. تفعيل Copilot في VS Code

```bash
# تأكد من تثبيت الامتداد
code --install-extension GitHub.copilot
code --install-extension GitHub.copilot-chat
```

### 2. فهم بنية المشروع

Copilot يستخدم `.github/copilot-instructions.md` تلقائياً لفهم المشروع. اطلع عليه لمعرفة ما يعرفه Copilot عن ODAVL.

## 🚀 سيناريوهات الاستخدام العملي

### السيناريو 1: إضافة Recipe جديدة

**بدلاً من البحث في الكود، اسأل Copilot مباشرة:**

```
@workspace كيف أضيف recipe جديدة لإزالة console.log من الكود؟
```

**ما سيفعله Copilot:**

1. يقرأ هيكل `.odavl/recipes/`
2. يفهم نظام Trust Scoring
3. يعطيك كود جاهز بصيغة JSON الصحيحة

**مثال على الإجابة المتوقعة:**

```json
{
  "id": "remove-console-log",
  "trust": 0.8,
  "description": "Remove console.log statements",
  "pattern": "console\\.log\\(",
  "replacement": "",
  "maxFiles": 5
}
```

### السيناريو 2: تصحيح أخطاء TypeScript

**استخدم Copilot لفهم الأخطاء:**

```
@workspace عندي 18 type error، كيف أصلحهم بطريقة تتوافق مع governance constraints؟
```

**Copilot سيذكرك:**

- Max 10 files per cycle
- Max 40 LOC per file
- Protected paths: `security/`, `**/*.spec.*`

### السيناريو 3: فهم Data Flow

**اسأل عن التدفقات المعقدة:**

```
@workspace اشرح لي كيف تعمل دورة ODAVL الكاملة من observe إلى learn
```

**أو أكثر تحديداً:**

```
@workspace كيف يتم حفظ undo snapshot في act phase؟ أرني الكود
```

### السيناريو 4: إضافة ميزة جديدة للـ VS Code Extension

**مثال واقعي:**

```
@workspace أريد إضافة panel جديدة في VS Code extension لعرض Trust Scores. 
ما الخطوات المطلوبة؟
```

**Copilot سيعطيك خطة:**

1. إنشاء Provider جديد في `apps/vscode-ext/src/components/`
2. تسجيل Panel في `extension.ts`
3. إضافة Configuration في `package.json`
4. ربط البيانات من `ODAVLDataService`

## 💡 نصائح متقدمة

### استخدم @workspace بذكاء

```
# ❌ سؤال عام - إجابة عامة
"كيف أعمل testing؟"

# ✅ سؤال محدد - إجابة دقيقة
"@workspace كيف أكتب test لـ RiskBudgetGuard.validate() مع Vitest؟"
```

### استخدم الملفات كسياق

```
# افتح الملفات ذات الصلة ثم اسأل
# افتح: apps/cli/src/phases/act.ts
# افتح: apps/cli/src/core/risk-budget.ts

"@workspace كيف أضمن أن saveUndoSnapshot يعمل قبل RiskBudgetGuard.validate()؟"
```

### اطلب أمثلة من الكود الموجود

```
@workspace أرني أمثلة موجودة في الكود لاستخدام sh() wrapper
```

### استخدم /fix بذكاء

عند ظهور خطأ في ملف:

```
/fix هذا الخطأ مع مراعاة governance constraints
```

## 🔧 أوامر Copilot Chat المفيدة

### للتطوير اليومي

```bash
# 1. فهم ملف معقد
/explain ما هذا الملف وكيف يتفاعل مع باقي النظام؟

# 2. تحسين الكود
/optimize هذه الدالة مع الحفاظ على نفس السلوك

# 3. إضافة documentation
/doc أضف JSDoc comments لهذه الدالة

# 4. كتابة tests
/tests اكتب Vitest tests لهذا الكود

# 5. إيجاد bugs
/review راجع هذا الكود وابحث عن مشاكل محتملة
```

### للمهام الخاصة بـ ODAVL

```
# تحقق من الالتزام بالقواعد
@workspace هل هذا التعديل يلتزم بـ RiskBudgetGuard constraints؟

# فهم نظام Trust
@workspace كيف يتم حساب trust score في decide phase؟

# تصحيح مشاكل Attestation
@workspace لماذا لا يتم إنشاء attestation بعد verify phase؟

# فهم VS Code Extension
@workspace كيف يعمل ledger auto-open في extension.ts؟
```

## 📚 الأنماط الشائعة في ODAVL

### النمط 1: Command Execution الآمن

**اسأل Copilot:**

```
@workspace كيف أنفذ أمر shell بشكل آمن في ODAVL؟
```

**سيعطيك:**

```typescript
import { sh } from "./phases/act";

// ✅ الطريقة الصحيحة - never throws
const { out, err } = sh("eslint . --fix");
if (err) {
  console.error("ESLint failed:", err);
}

// ❌ خطأ - don't use execSync directly
const result = execSync("eslint . --fix"); // يمكن أن يرمي exception
```

### النمط 2: قراءة الإعدادات

**اسأل:**

```
@workspace كيف أقرأ governance config في الكود؟
```

**ستحصل على:**

```typescript
import { getGovernanceConfig } from "./core/policies";

const cfg = getGovernanceConfig();
console.log(`Max files: ${cfg.maxFiles}`);
console.log(`Max LOC: ${cfg.maxLocPerFile}`);
console.log(`Protected: ${cfg.protectedGlobs}`);
```

### النمط 3: إنشاء Ledger Entry

**اسأل:**

```
@workspace كيف أكتب ledger entry بعد run؟
```

## 🎓 تمارين عملية

### تمرين 1: إضافة Recipe

**المهمة:** أضف recipe لإزالة الـ debugger statements

**خطوات مع Copilot:**

1. `@workspace أين أضع recipe files وما هو الـ schema المطلوب؟`
2. `@workspace كيف أختبر recipe محلياً قبل commit؟`
3. `@workspace كيف أتأكد من أن trust score يتحدث بشكل صحيح؟`

### تمرين 2: إضافة Quality Gate

**المهمة:** أضف gate جديدة لعدد الـ TODO comments

**خطوات:**

1. `@workspace كيف يعمل verify phase مع gates.yml؟`
2. `@workspace أعطني مثال على gate موجودة`
3. `@workspace كيف أضيف custom verification logic؟`

### تمرين 3: تحسين VS Code Extension

**المهمة:** أضف notification عند اكتمال ODAVL cycle

**خطوات:**

1. `@workspace كيف يراقب extension الـ ledger files؟`
2. `@workspace أرني كود file watcher الموجود`
3. `@workspace كيف أضيف VS Code notification؟`

## 🔍 استكشاف الأخطاء

### مشكلة: Copilot يعطي إجابات عامة

**الحل:**

```
# ❌ سؤال غير واضح
"كيف أعمل testing؟"

# ✅ سؤال محدد بالسياق
"@workspace في ODAVL، كيف أكتب test لـ observe phase مع mock لـ ESLint output؟ 
استخدم Vitest وتأكد من أن test coverage يضاف إلى reports/test-results.json"
```

### مشكلة: Copilot لا يفهم ODAVL-specific patterns

**الحل:**

```
# أشر إلى copilot-instructions.md
"@workspace حسب الـ instructions في .github/copilot-instructions.md، 
كيف أضمن أن التعديلات تلتزم بـ RiskBudgetGuard؟"
```

### مشكلة: إجابات طويلة جداً

**الحل:**

```
# اطلب إجابة مختصرة مع مثال
"@workspace في 3 نقاط فقط، كيف يعمل trust scoring system؟ مع مثال كود"
```

## 📊 قياس الإنتاجية

### قبل استخدام Copilot بشكل مثالي

- ⏱️ 30 دقيقة للبحث في الكود لفهم pattern
- 🐛 أخطاء متكررة في الالتزام بـ constraints
- 📝 وقت طويل في كتابة boilerplate code

### بعد استخدام Copilot بشكل مثالي

- ⚡ 2-3 دقائق للحصول على إجابة دقيقة
- ✅ التزام تلقائي بـ project patterns
- 🚀 تركيز على business logic بدلاً من boilerplate

## 🎯 الخلاصة: القواعد الذهبية

1. **استخدم @workspace دائماً** - يعطي Copilot سياق كامل للمشروع
2. **كن محدداً في أسئلتك** - اذكر أسماء الملفات والدوال
3. **افتح الملفات ذات الصلة** - يساعد Copilot على الفهم أفضل
4. **اطلب أمثلة من الكود الموجود** - أفضل من أمثلة عامة
5. **استخدم /fix و /tests و /doc** - commands مخصصة للمهام الشائعة
6. **راجع الإجابات** - Copilot قوي لكن يحتاج مراجعة
7. **استثمر في copilot-instructions.md** - كلما كان أفضل، كانت الإجابات أدق

## 🔗 موارد إضافية

- `.github/copilot-instructions.md` - المرجع الرئيسي للمشروع
- `docs/ARCHITECTURE.md` - فهم عميق للبنية
- `DEVELOPER_GUIDE.md` - أساسيات التطوير
- `apps/cli/src/phases/` - أمثلة على patterns مهمة

---

**ملاحظة:** هذا الدليل يتطور باستمرار. شارك تجربتك واقتراحاتك!
