# 🎯 Guardian - الدليل السريع

## ✨ استخدام سهل وبسيط!

### الأمر الأساسي:
```bash
pnpm odavl:guardian <url>
```

## 📖 أمثلة سريعة

### 1. فحص موقع:
```bash
pnpm odavl:guardian https://github.com
```

### 2. فحص localhost:
```bash
pnpm odavl:guardian http://localhost:3000
```

### 3. مع خيارات:
```bash
pnpm odavl:guardian https://example.com --browser firefox --output ./my-reports
```

### 4. عرض المساعدة:
```bash
pnpm odavl:guardian --help
```

## 🚀 أوامر إضافية

### تشغيل API Server:
```bash
pnpm guardian:api
```

### تشغيل Dashboard:
```bash
pnpm guardian:dev
```

### بناء المشروع:
```bash
pnpm guardian:build
```

## 📊 النتائج

بعد الفحص، التقرير يُحفظ في:
```
.odavl/guardian/report-XXXXX.json
```

## 🎯 أمثلة حقيقية

### فحص شاشة بيضاء:
```bash
pnpm odavl:guardian file:///C:/path/to/your/page.html
```

### فحص موقع production:
```bash
pnpm odavl:guardian https://your-production-site.com
```

### فحص مع Firefox:
```bash
pnpm odavl:guardian https://example.com --browser firefox
```

## 💡 نصائح

1. **سريع**: `pnpm odavl:guardian <url>` - فحص فوري
2. **مفصل**: أضف `--format html` لتقرير HTML
3. **متعدد**: افحص مواقع مختلفة بنفس الأمر

## ❓ مشاكل شائعة

### "Command not found"
تأكد أنك في مجلد المشروع الرئيسي:
```bash
cd C:\Users\sabou\dev\odavl
```

### Playwright browser missing
ثبت المتصفحات:
```bash
cd odavl-studio/guardian/core
pnpm exec playwright install chromium
```

---

**هذا كل شيء!** 🎉  
أمر واحد بسيط: `pnpm odavl:guardian <url>`
