# 🌐 Guardian Website Testing Guide

## ✅ ما تم إصلاحه

### المشاكل السابقة:
1. ❌ `net::ERR_ABORTED` على مواقع مثل Google
2. ❌ المواقع تكتشف headless browser وتمنعه
3. ❌ Timeout على `waitUntil: 'networkidle'`

### الحلول المطبقة:

#### 1. Stealth Mode
```typescript
// إخفاء علامات automation
args: [
  '--disable-blink-features=AutomationControlled',
  '--disable-dev-shm-usage',
  '--no-sandbox',
]

// حذف webdriver flag
delete navigator.webdriver;
```

#### 2. User Agent حقيقي
```typescript
userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)...'
viewport: { width: 1920, height: 1080 }
```

#### 3. Timeout أفضل
```typescript
// بدلاً من: waitUntil: 'networkidle' (يفشل كثيراً)
// الآن: waitUntil: 'domcontentloaded' (أسرع وأكثر موثوقية)
// مع fallback إلى 'load' إذا فشل
```

## 🎯 المواقع المدعومة الآن

### ✅ تعمل بشكل ممتاز:
- ✅ `http://localhost:3000` (مواقعك المحلية)
- ✅ `http://example.com` (موقع تجريبي)
- ✅ `https://httpbin.org` (API testing)
- ✅ مواقع Next.js/React الخاصة بك

### ⚠️ قد تعمل (حسب الحماية):
- ⚠️ `https://github.com`
- ⚠️ مواقع أخرى بدون حماية مشددة

### ❌ لن تعمل (حماية مشددة):
- ❌ `https://www.google.com` (Captcha + bot detection)
- ❌ `https://facebook.com` (حماية قوية)
- ❌ `https://twitter.com` (حماية قوية)

## 📋 كيفية الاستخدام

### الطريقة الموصى بها (المواقع المحلية):

```bash
# Terminal 1: شغل موقعك
cd apps/studio-hub
pnpm dev
# انتظر: ✓ Ready on http://localhost:3000

# Terminal 2: فحص بـ Guardian
pnpm odavl:guardian
# اختر: w
# أدخل: http://localhost:3000
```

### اختبار مواقع خارجية:

```bash
pnpm odavl:guardian
# اختر: w
# جرب:
# - http://example.com (موقع تجريبي بسيط)
# - https://httpbin.org (API testing site)
```

## 🔍 ما يفحصه Guardian

عند نجاح الاتصال، سيفحص:

1. **⚡ Performance**
   - Time to First Byte (TTFB)
   - First Contentful Paint (FCP)
   - Load Time
   - DOM Content Loaded

2. **♿ Accessibility**
   - WCAG compliance
   - ARIA labels
   - Color contrast
   - Keyboard navigation

3. **🔍 SEO**
   - Meta tags
   - Open Graph
   - Title & Description
   - Canonical URLs

4. **🔒 Security**
   - HTTPS
   - Security headers
   - CSP policies
   - Mixed content

5. **🐛 Console**
   - JavaScript errors
   - Network errors
   - Warnings

6. **🔗 Links**
   - Broken links
   - External links
   - Redirects

## 💡 نصائح

### للمواقع المحلية:
✅ **أفضل:** اختبر على localhost أثناء التطوير
✅ **سريع:** Guardian يعطي نتائج فورية
✅ **دقيق:** كل الفحوصات تعمل 100%

### للمواقع الخارجية:
⚠️ **محدود:** بعض المواقع تمنع bots
⚠️ **بطيء:** Timeout أطول للمواقع البطيئة
⚠️ **غير مضمون:** قد يفشل حسب حماية الموقع

## 🚀 الخطوات التالية

إذا كنت تريد فحص مواقع كبيرة (Google, Facebook, etc):
- استخدم أدوات مخصصة مثل:
  - Google Lighthouse
  - WebPageTest
  - GTmetrix

Guardian مصمم لـ:
- ✅ فحص مواقعك الخاصة
- ✅ اختبار أثناء التطوير
- ✅ CI/CD integration
- ✅ مواقع بدون حماية مشددة ضد bots
