# Re-Engagement Email Campaign

## Email 1: Inactive User (No Activity in 14 Days)

**Subject**: We Miss You! What Can We Do Better?

**Body**:
```html
Hey {{firstName}},

It's been {{daysSinceLastLogin}} days since you last used ODAVL.

We noticed you signed up but haven't been active. **What went wrong?**

**Common Reasons Users Stop**:
❌ Too complicated to set up
❌ Didn't see value immediately
❌ Found a different solution
❌ Just got busy

**We Want to Help**:

**1. Free Onboarding Call** (30 min)
Book with our team: [calendly link]

**2. Quick Start Guide**
5-minute setup: odavl.com/quickstart

**3. Demo Video**
Watch ODAVL in action: [video link]

**Or Just Tell Us Why**:
Reply with what blocked you. We read every response.

**Special Offer**:
Come back in next 7 days → Get 60 days Pro (instead of 30)

**No Pressure**:
If ODAVL isn't right for you, no worries. We'd still love to hear why.

Thanks for trying us out.

— {{senderName}}, ODAVL Team

P.S. Want to unsubscribe? No hard feelings: [unsubscribe link]
```

---

## Email 2: Trial Ending Soon (3 Days Before Expiry)

**Subject**: Your Trial Ends in 3 Days - Ready to Upgrade?

**Body**:
```html
Hi {{firstName}},

Your 30-day ODAVL Pro trial ends on {{trialEndDate}}.

**Your Usage This Month**:
📊 Issues detected: {{issuesDetected}}
🤖 Auto-fixed: {{autoFixed}}
⏱️ Time saved: {{hoursSaved}} hours
💰 Value: ${{dollarsSaved}}

**What Happens Next**:

**Option 1: Upgrade to Pro** ($29/user/month)
✅ Keep all features
✅ Unlimited projects
✅ Priority support

[Upgrade Now →]

**Option 2: Free Tier** (automatically)
✅ 3 projects
✅ Core features
✅ Community support

**Option 3: Pause & Decide Later**
Reply "PAUSE" - we'll extend your trial 7 days

**Questions Before Deciding?**
• Is Pro worth it? [ROI calculator]
• Need more time? Reply "EXTEND"
• Want team pricing? Reply "ENTERPRISE"

**Risk-Free Upgrade**:
30-day money-back guarantee. Cancel anytime.

What works best for you?

— ODAVL Team
```

---

## Email 3: Trial Expired (Day After Expiry)

**Subject**: Your Trial Expired - Here's What You Missed

**Body**:
```html
{{firstName}},

Your ODAVL Pro trial ended yesterday.

**You're Now on Free Tier**:
✅ 3 projects (you had {{projectCount}})
✅ Core features
⚠️ Pro features disabled:
   • Unlimited projects
   • Advanced detectors
   • Priority support
   • Team collaboration

**Want to Upgrade?**

**Last-Chance Offer**:
Upgrade in next 48 hours → Get 20% off first 3 months

**Pro Plan**: $29/user → **$23/user** (save $18/month)

[Claim Discount →]

**Or Keep Free Tier**:
If 3 projects work for you, stay on Free. No pressure.

**Your Data is Safe**:
All your scans, history, and settings are preserved.
Upgrade anytime to restore Pro features.

**Questions?**
Reply to this email or chat with us: odavl.com/support

— ODAVL Team

P.S. Offer expires in 48 hours ({{expiryDate}})
```

---

## Email 4: Dormant User (No Activity in 60 Days)

**Subject**: One Last Question Before You Go

**Body**:
```html
Hi {{firstName}},

It's been {{daysSinceLastLogin}} days since you used ODAVL.

**We're going to guess why you left**:

**❌ Setup Too Complex**
Fair. Dev tools shouldn't require a PhD.
→ We built 1-click setup: odavl.com/instant-setup

**❌ Didn't See Value Fast Enough**
Also fair. You shouldn't need weeks to see ROI.
→ New users now see results in first scan (2 minutes)

**❌ Found a Better Tool**
Totally fine. Which one? (We're genuinely curious)
→ Reply with competitor name - helps us improve

**❌ Just Forgot About It**
Happens to the best of us.
→ Want a reminder email in 3 months? Reply "REMIND ME"

**One Last Offer**:

Come back, and we'll give you:
• 90-day Pro trial (triple the usual)
• Free 1-on-1 onboarding (30 min)
• $100 credit (if you upgrade after)

[Give ODAVL Another Shot →]

**Or Unsubscribe**:
If ODAVL isn't for you, no hard feelings.
Click here to stop these emails: [unsubscribe]

Thanks for giving us a chance.

— {{founderName}}, Founder
ODAVL Studio

P.S. Seriously, tell us what went wrong. We read every reply: {{founderEmail}}
```

---

## Email 5: Win-Back Campaign (Unsubscribed Users)

**Subject**: We Fixed What You Didn't Like (Probably)

**Body**:
```html
Hey,

You unsubscribed from ODAVL emails, so we won't spam you.

But... we did fix a bunch of stuff based on feedback.

**What Changed in Last 6 Months**:

✅ **Faster Setup** (5 min → 30 seconds)
✅ **Better UX** (redesigned dashboard)
✅ **More Languages** (added Go, Rust, Ruby)
✅ **Cheaper Pricing** (Pro: $49 → $29/month)
✅ **Better Docs** (video tutorials, interactive guides)

**Why We're Emailing** (Last Time, Promise):

If the reason you left was any of the above... maybe give us another look?

**Special Win-Back Offer**:
• 90-day Pro trial (free)
• No credit card required
• Unsubscribe again anytime (we won't be mad)

[Check Out the New ODAVL →]

**Not Interested?**
No worries. This is the last email you'll get from us.

Take care,
— ODAVL Team

P.S. If you want to permanently delete your account (vs just unsubscribe): odavl.com/delete-account
```

---

## Re-Engagement Email Triggers

| Email | Trigger | Send After | Goal |
|-------|---------|------------|------|
| Inactive User | No login/activity | 14 days | Identify blockers |
| Trial Ending | Trial expiry approaching | 3 days before | Convert to paid |
| Trial Expired | Trial ended | 1 day after | Last-chance upgrade |
| Dormant User | No activity | 60 days | Win-back or unsubscribe |
| Win-Back | Unsubscribed | 6 months | Final offer |

---

## Response Templates for Replies

### "Too Expensive"
```
Totally fair. A few options:

1. Free tier (3 projects, core features)
2. Annual plan (save 20%): $279/year
3. OSS Program (free for open source)
4. Custom discount: What budget works for you?

Not trying to hard sell - just want to find a fit if there is one.
```

### "Didn't Work for My Stack"
```
Which language/framework? We're adding support for:

Coming Q2: Swift, Kotlin, C++
Coming Q3: C#, Scala, Elixir

If yours isn't listed, we prioritize based on demand.
Want us to notify you when it's ready?
```

### "Too Complicated"
```
Ugh, that sucks. Where did you get stuck?

We're working on:
• 1-click setup (no config files)
• VS Code extension (zero CLI)
• Video walkthroughs (5 min)

Would a 15-min onboarding call help? My calendar: [link]

No pressure - just want to make this easier.
```

### "Found a Better Tool"
```
Which one? (Genuinely curious)

We're always looking to improve. If [competitor] does something better, we'd love to know.

And if there's a feature combo you need that nothing offers... that's our opportunity.

Thanks for the honest feedback.
```
