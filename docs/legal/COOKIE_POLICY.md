# Cookie Policy for ODAVL Studio

**Last Updated: December 3, 2025**

## 1. What Are Cookies?

Cookies are small text files stored on your device (computer, tablet, or mobile) when you visit a website. They help websites remember your preferences, authenticate your session, and analyze usage patterns.

**ODAVL Studio uses cookies to provide, improve, and secure our services.**

---

## 2. Types of Cookies We Use

### 2.1 Essential Cookies (Always Active)
These cookies are necessary for the Service to function and cannot be disabled.

| Cookie Name | Purpose | Duration |
|-------------|---------|----------|
| `odavl_session` | Maintains your login session | 7 days |
| `next-auth.session-token` | NextAuth.js authentication | 30 days |
| `next-auth.csrf-token` | CSRF protection | Session |
| `__Secure-next-auth.callback-url` | OAuth callback URL | Session |

**Legal Basis**: Legitimate interest (necessary for service delivery)

---

### 2.2 Functional Cookies (Enabled by Default)
These cookies enhance your experience by remembering your preferences.

| Cookie Name | Purpose | Duration |
|-------------|---------|----------|
| `odavl_theme` | Remember dark/light mode preference | 1 year |
| `odavl_language` | Remember language preference (en/ar/de) | 1 year |
| `odavl_workspace_id` | Remember last active workspace | 90 days |
| `odavl_sidebar_collapsed` | Remember sidebar state | 1 year |

**Legal Basis**: Consent (you can opt out in cookie settings)

---

### 2.3 Analytics Cookies (Requires Consent)
These cookies help us understand how users interact with ODAVL Studio.

| Cookie Name | Provider | Purpose | Duration |
|-------------|----------|---------|----------|
| `ph_*` | PostHog | Anonymous usage analytics | 1 year |
| `_ga` | Google Analytics | Anonymous visitor tracking | 2 years |
| `_gid` | Google Analytics | Session tracking | 24 hours |

**What We Track (Anonymized)**:
- Pages visited
- Features used
- Error rates
- Performance metrics
- Geographic region (country level only)

**What We DON'T Track**:
- Your code or sensitive data
- Personal identifiable information (PII)
- Keystrokes or form inputs

**Legal Basis**: Consent (opt-in via cookie banner)

---

### 2.4 Marketing Cookies (Requires Consent)
These cookies enable personalized content and targeted advertising.

| Cookie Name | Provider | Purpose | Duration |
|-------------|----------|---------|----------|
| `_fbp` | Facebook Pixel | Track conversions, retargeting | 90 days |
| `IDE` | Google Ads | Personalized ads | 1 year |

**Legal Basis**: Consent (opt-in via cookie banner)

**Note**: Marketing cookies are only used if you explicitly consent via our cookie banner.

---

## 3. Third-Party Cookies

ODAVL Studio uses third-party services that may set their own cookies:

### 3.1 Authentication Providers
- **GitHub OAuth**: `_gh_sess`, `logged_in`, `dotcom_user`
- **Google OAuth**: `SID`, `HSID`, `SSID`, `APISID`, `SAPISID`

### 3.2 Payment Processing
- **Stripe**: `__stripe_mid`, `__stripe_sid` (for fraud prevention)

### 3.3 Error Monitoring
- **Sentry**: Error tracking cookies (essential for debugging)

**We do not control third-party cookies.** Review their privacy policies:
- [GitHub Privacy Policy](https://docs.github.com/en/site-policy/privacy-policies/github-privacy-statement)
- [Google Privacy Policy](https://policies.google.com/privacy)
- [Stripe Privacy Policy](https://stripe.com/privacy)

---

## 4. How to Manage Cookies

### 4.1 Cookie Consent Banner
When you first visit ODAVL Studio, you'll see a cookie consent banner. You can:
- **Accept All**: Enable all cookies (analytics + marketing)
- **Reject Non-Essential**: Only essential + functional cookies
- **Customize**: Choose specific cookie categories

### 4.2 Cookie Settings Page
Update your preferences anytime at: **Settings → Privacy → Cookie Preferences**

### 4.3 Browser Settings
You can also manage cookies via your browser:

**Chrome**:
```
Settings → Privacy and security → Cookies and other site data
```

**Firefox**:
```
Settings → Privacy & Security → Cookies and Site Data
```

**Safari**:
```
Preferences → Privacy → Manage Website Data
```

**Edge**:
```
Settings → Cookies and site permissions → Manage and delete cookies
```

**Note**: Blocking essential cookies may prevent you from using ODAVL Studio.

---

## 5. Do Not Track (DNT)

We respect browser "Do Not Track" signals:
- If DNT is enabled, we disable analytics and marketing cookies automatically
- Essential and functional cookies remain active (necessary for service)

**To enable DNT**:
- Chrome: `chrome://settings/privacy` → Enable "Send Do Not Track"
- Firefox: `about:preferences#privacy` → Enable "Tell websites not to track"

---

## 6. Cookie Lifespan

| Type | Lifespan |
|------|----------|
| **Session Cookies** | Deleted when you close your browser |
| **Persistent Cookies** | Stored until expiration or manual deletion |
| **Essential Cookies** | 7-30 days (session management) |
| **Analytics Cookies** | 1-2 years (usage trends) |
| **Marketing Cookies** | 90 days - 1 year (ad campaigns) |

---

## 7. Cookies and GDPR Compliance

Under GDPR (EU regulation), we:
- ✅ Obtain explicit consent before setting non-essential cookies
- ✅ Provide clear information about cookie purposes
- ✅ Allow you to withdraw consent anytime
- ✅ Respect "Do Not Track" signals
- ✅ Use cookies only for specified, lawful purposes

**Your Rights**:
- Right to withdraw consent
- Right to access cookie data
- Right to object to cookie-based processing

---

## 8. Cookies and Children's Privacy

ODAVL Studio is not intended for children under 13. We do not knowingly collect cookies from children under 13. If you believe a child has provided cookie data, contact us at privacy@odavl.studio.

---

## 9. Changes to This Cookie Policy

We may update this Cookie Policy periodically. Changes will be notified via:
- Updated "Last Updated" date
- Cookie banner notification (for material changes)
- Email notification (for significant changes)

**Continued use after changes constitutes acceptance.**

---

## 10. Contact Us

Questions about our cookie practices?

**ODAVL Studio Privacy Team**  
📧 Email: privacy@odavl.studio  
🌐 Website: https://odavl.studio/cookies  
📍 Address: [To be added]

---

## 11. Cookie Consent Banner Implementation

For developers implementing ODAVL Studio's cookie consent:

```typescript
// apps/studio-hub/components/cookie-banner.tsx
import { useState, useEffect } from 'react';

export function CookieBanner() {
  const [consent, setConsent] = useState<'pending' | 'accepted' | 'rejected'>('pending');

  useEffect(() => {
    // Check existing consent
    const savedConsent = localStorage.getItem('cookie_consent');
    if (savedConsent) {
      setConsent(savedConsent as 'accepted' | 'rejected');
    }
  }, []);

  const acceptAll = () => {
    localStorage.setItem('cookie_consent', 'accepted');
    enableAnalytics();
    enableMarketing();
    setConsent('accepted');
  };

  const rejectNonEssential = () => {
    localStorage.setItem('cookie_consent', 'rejected');
    disableAnalytics();
    disableMarketing();
    setConsent('rejected');
  };

  if (consent !== 'pending') return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4 z-50">
      <p>
        We use cookies to improve your experience. 
        <a href="/cookies" className="underline">Learn more</a>
      </p>
      <div className="flex gap-2 mt-2">
        <button onClick={acceptAll}>Accept All</button>
        <button onClick={rejectNonEssential}>Reject Non-Essential</button>
        <a href="/settings/cookies">Customize</a>
      </div>
    </div>
  );
}
```

---

**Note to User**: This is a **draft** Cookie Policy. **You MUST**:
1. Add your business address
2. Update cookie names to match actual implementation
3. Review with a privacy lawyer (GDPR/ePrivacy Directive compliance)
4. Test cookie banner implementation
5. Ensure cookie consent is properly recorded
6. Update before public launch

**Do not publish this draft without legal review.**
