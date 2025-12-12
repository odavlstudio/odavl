# Product Hunt Comment Response Templates

**Goal**: Respond within 15 minutes, be genuine, provide value

---

## Pricing Questions

### "Too expensive"
Response:
```
Fair question! Breakdown:

Free tier: 3 projects, core features (perfect for side projects)
Pro: $29/user/month

For context, if it saves just 1 hour per engineer per month (our avg is 8 hours), that's a 10x+ ROI.

We also have an Open Source Program - apply at odavl.com/oss for free Pro forever.
```

### "Why not free/OSS?"
Response:
```
Great question. The ML models, infrastructure, and 24/7 support require ongoing resources.

However, we're committed to accessibility:
- Free tier for individuals (3 projects)
- OSS Program for open source maintainers
- Considering open-sourcing detector engines in 2025

What pricing model would work better for your use case?
```

---

## Technical Questions

### "How does autonomous fixing work?"
Response:
```
Great question! Our O-D-A-V-L cycle:

1. Observe: Analyze codebase (ESLint, TypeScript, custom detectors)
2. Decide: ML model scores each fix by trust (success rate, impact, risk)
3. Act: Execute highest-trust fixes in parallel
4. Verify: Quality gates ensure no regressions
5. Learn: Update trust scores based on outcomes

Every change has a diff snapshot for instant rollback. You're always in control.
```

### "What languages do you support?"
Response:
```
Currently: TypeScript, JavaScript, Python, Java

Coming Q2 2025: Go, Rust, Ruby, PHP, Swift, Kotlin

Which language is most important for your team? That helps us prioritize!
```

### "Integration with [Tool]?"
Response:
```
Yes! We integrate with:
- Version Control: GitHub, GitLab, Bitbucket
- CI/CD: GitHub Actions, CircleCI, Jenkins
- Communication: Slack, Discord
- Project Management: Jira, Linear

What's your specific setup? I can share docs or jump on a quick call to help configure.
```

### "How accurate is the detection?"
Response:
```
Great question. Current stats from production usage:

- 16 detectors (TypeScript, security, performance, complexity, etc.)
- 95%+ precision (very few false positives)
- 87% recall (catches most real issues)

We're continuously training the ML models on real-world data. False positives can be suppressed per-project.

Anything specific you're concerned about detecting?
```

---

## Comparison Questions

### "How is this different from SonarQube?"
Response:
```
Key difference: SonarQube detects, ODAVL detects + fixes + validates.

SonarQube shows you a to-do list.
ODAVL completes the to-do list autonomously.

Think of it as the difference between a linter (tells you what's wrong) and an autonomous system (actually fixes it).

Both can coexist! Some teams use SonarQube for compliance, ODAVL for velocity.
```

### "vs Snyk?"
Response:
```
Snyk is security-focused (CVEs, dependencies).
ODAVL covers 16+ categories (security, performance, TypeScript, complexity, etc.).

They're complementary - Snyk for deep security scanning, ODAVL for holistic code quality + autonomous fixing.

We do integrate with Snyk - you can feed Snyk findings into ODAVL for auto-remediation.
```

### "vs GitHub Copilot?"
Response:
```
Different use cases:

Copilot: AI pair programming (helps you WRITE code)
ODAVL: Autonomous quality (helps you MAINTAIN code)

Many teams use both - Copilot for feature development, ODAVL for tech debt reduction and pre-deploy validation.
```

---

## Security/Safety Concerns

### "Worried about auto-fixing breaking things"
Response:
```
Totally fair! Safety is our #1 priority:

1. Risk Budgets: Max 10 files per cycle (configurable)
2. Protected Paths: Never touch security/, auth/, tests without approval
3. Undo Snapshots: Every change has a diff snapshot for instant rollback
4. Attestation Chain: Cryptographic proof of every improvement
5. Quality Gates: If tests fail, changes are rolled back automatically

You can run in "review mode" first - it suggests fixes, you approve.

Want to see a demo of the safety mechanisms?
```

### "How do you prevent runaway AI?"
Response:
```
Great question. Multiple safeguards:

1. Trust Scoring: Recipes with 3+ consecutive failures are blacklisted
2. Complexity Limits: Won't modify files >500 LOC without review
3. Test Coverage: Requires 80%+ coverage before fixing test-related code
4. Human-in-Loop: You can require approval for high-risk changes

The ML model is conservative - it won't execute fixes below 0.8 trust score.

Think Tesla Autopilot: autonomous, but supervised.
```

---

## Use Case Questions

### "Good for [X] type of project?"
Response:
```
Absolutely! We have customers using ODAVL for:

- Startups (fast iteration, can't afford QA)
- Enterprise (compliance, audit trails, distributed teams)
- OSS (volunteer contributors, varying skill levels)
- Agencies (multiple client projects, consistency)

What's your specific setup? I can share a relevant case study.
```

### "Does this work with monorepos?"
Response:
```
Yes! ODAVL is built for monorepos (we use a pnpm monorepo ourselves).

Features:
- Per-package configuration (.odavl/gates.yml)
- Selective analysis (only changed packages)
- Parallel execution across packages

Our largest customer has a 400-package monorepo - works great!
```

---

## Feature Requests

### "Can you add [feature]?"
Response:
```
Love it! I'm adding this to our roadmap.

Quick questions to help prioritize:
1. How often would you use this?
2. What's your workaround today?
3. Would this be a deal-breaker for adoption?

Also tracking this in our public roadmap: github.com/odavlstudio/roadmap/issues
```

### "When will you support [language]?"
Response:
```
We're actively working on language expansion! Current plan:

Q2 2025: Go, Rust, Ruby
Q3 2025: PHP, Swift, Kotlin

Which language is most critical for your team? Helps us prioritize!

In the meantime, you can use ODAVL for TypeScript/Python/Java parts of polyglot projects.
```

---

## Skepticism/Criticism

### "This looks like vaporware"
Response:
```
Fair skepticism! Proof:

- 8 design partners in production (happy to intro you)
- Public GitHub: github.com/odavlstudio (open source components)
- Live demo: odavl.com/demo
- Case studies with real metrics: odavl.com/customers

Want a 15-min live walkthrough? I'll show you the actual product, not slides.
```

### "Another AI hype tool"
Response:
```
I get the AI fatigue! We focus on boring, practical value:

- 40% faster code reviews (measured across 8 teams)
- 95% fewer production bugs (real metric, not marketing)
- ML is a means, not the message (we could do rules-based, just less accurate)

The AI is in trust scoring, not "magic". It's more "Autopilot" than "AGI".

What would convince you it's real value, not hype?
```

---

## General Positive Comments

### "This looks great!"
Response:
```
Thank you! 🙏

If you're interested in trying it, I'd love to offer you 3 months Pro free (use code PH-EARLY).

Also happy to jump on a quick call to answer questions or give a personalized demo.

What's your current code quality stack? I can show you how ODAVL fits in.
```

### "Been waiting for something like this"
Response:
```
That means a lot! We felt the same pain - spent years manually fixing ESLint warnings.

Would love to hear about your specific workflow. What's the most frustrating part of code reviews for your team?

(DM me if you want early access or a demo!)
```

---

## Questions for Engagement

**Ask these to spark discussion**:

- "What's the biggest time sink in your code review process?"
- "Do you use SonarQube/Snyk/ESLint? How's that working?"
- "What would make you trust autonomous code fixes?"
- "Which language should we support next?"
- "What's one code quality issue you wish just... disappeared?"

**Goal**: Turn comments into conversations, show genuine interest in problems
