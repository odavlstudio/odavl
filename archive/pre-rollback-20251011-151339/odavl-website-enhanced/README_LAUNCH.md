# ODAVL Studio - Launch Guide

## 🚀 Deployment Commands

### Build & Test Locally

```bash
npm run build
npm run start
```

### Deploy to Production

```bash
npx vercel --prod
```

## 🔧 Environment Variables

Set these in your Vercel dashboard:

- `PLAUSIBLE_DOMAIN` - Your analytics domain (default: odavl.com)
- `NODE_ENV` - Set to "production" for live deployment

## 🛡️ Security Features

- **Rate Limiting**: 20 requests/minute per IP on API endpoints
- **Security Headers**: CSP, HSTS, XSS Protection, Frame Options
- **Analytics**: Privacy-friendly Plausible.io (production only)

## 📝 Forms & Endpoints

- **Contact Form**: `/contact` → `/api/lead` (type: contact)
- **Pilot Form**: `/pilot` → `/api/lead` (type: pilot)
- **Success Messages**: "Thanks! We'll contact you within 24h."

## 🌍 Internationalization

- **Default Route**: `/` → `/en` (auto-redirect)
- **Supported Locales**: English (`/en`), Arabic (`/ar`)
- **RTL Support**: Automatic for Arabic locale

## 📊 Monitoring

- **Dev Mode**: LaunchMonitor component shows build info
- **Production**: Plausible analytics for user behavior
- **Rate Limits**: Headers show remaining requests

## 🔍 Quality Gates

✅ TypeScript compilation clean  
✅ ESLint passes without warnings  
✅ Security headers applied  
✅ Rate limiting functional  
✅ Forms validated with ARIA labels  
✅ Analytics privacy-compliant  

---
**ODAVL Studio** - Autonomous Code Quality Improvement  
Ready for production deployment 🚀
