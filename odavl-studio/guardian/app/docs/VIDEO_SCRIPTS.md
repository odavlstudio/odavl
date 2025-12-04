# Documentation Video Scripts - Week 14

This document contains scripts and recording guides for 4 key Guardian documentation videos.

## Video 1: Getting Started (5 minutes)

**Target Audience**: New users, first-time setup  
**Objective**: Complete Guardian setup from zero to first test run  
**Format**: Screen recording with voiceover

### Script

**[0:00-0:30] Introduction**
> "Welcome to Guardian! In the next 5 minutes, I'll show you how to set up Guardian and run your first test. By the end of this video, you'll have Guardian installed, configured, and running tests on your application."

**[0:30-1:30] Installation**
> "First, let's install the Guardian CLI. Open your terminal and run: `npm install -g @guardian/cli`"
>
> [Show terminal with command]
>
> "Wait for the installation to complete. You'll see a success message when it's ready."
>
> [Show npm install output]
>
> "Verify the installation by running: `guardian --version`"
>
> [Show version output]

**[1:30-2:30] Configuration**
> "Next, we need to configure Guardian with your API key. Log in to your Guardian account and navigate to Settings > API Keys."
>
> [Show Guardian dashboard, navigate to API Keys]
>
> "Click 'Create New API Key', give it a name like 'Local Development', and copy the generated key."
>
> [Show API key creation]
>
> "Back in your terminal, run: `guardian config set-api-key`"
>
> [Show terminal command]
>
> "Paste your API key when prompted. Guardian will save this securely in your local config."

**[2:30-3:30] Initialize Project**
> "Now let's initialize Guardian in your project. Navigate to your project directory and run: `guardian init`"
>
> [Show cd to project, run guardian init]
>
> "Guardian will ask a few questions about your project:"
>
> - "What's your project name? [Enter project name]"
> - "What test framework are you using? [Select Playwright]"
> - "Where are your tests located? [Accept default: tests/]"
>
> [Show interactive prompts]
>
> "Guardian creates a `guardian.config.ts` file with your settings."

**[3:30-4:30] Run First Test**
> "Let's run your first test! Execute: `guardian run`"
>
> [Show terminal command]
>
> "Guardian will:"
>
> - "Discover all tests in your project"
> - "Run them in parallel"
> - "Upload results to your dashboard"
>
> [Show test execution output]
>
> "Once complete, you'll see a summary with a link to view detailed results."

**[4:30-5:00] View Results**
> "Click the link or visit your Guardian dashboard. Here you can see:"
>
> - "Test pass/fail status"
> - "Execution time"
> - "Error screenshots"
> - "Failure trends over time"
>
> [Show Guardian dashboard with test results]
>
> "That's it! You've successfully set up Guardian and run your first test. Check out our other videos to learn about monitoring, CI/CD integration, and advanced features."

### Recording Checklist

- [ ] Clean terminal (clear history)
- [ ] Prepare demo project with tests
- [ ] Valid API key ready
- [ ] Dashboard open in browser
- [ ] Record at 1920x1080 resolution
- [ ] Enable cursor highlighting
- [ ] Test audio levels
- [ ] Practice run-through

---

## Video 2: Running Your First Test (10 minutes)

**Target Audience**: Users familiar with testing frameworks  
**Objective**: Deep dive into test configuration and execution  
**Format**: Screen recording with voiceover

### Script

**[0:00-1:00] Introduction**
> "In this video, we'll explore Guardian's test runner in depth. We'll cover configuration options, test discovery, parallel execution, and result reporting."

**[1:00-3:00] Configuration Deep Dive**
> "Let's look at the `guardian.config.ts` file. Guardian supports three test frameworks: Playwright, Cypress, and Jest."
>
> [Show guardian.config.ts]
>
> "Key configuration options:"
>
> - "`framework`: Your test framework (playwright/cypress/jest)"
> - "`testDir`: Where Guardian looks for tests (default: tests/)"
> - "`parallelism`: Number of concurrent tests (default: 4)"
> - "`timeout`: Test timeout in milliseconds (default: 30000)"
> - "`retries`: Number of retry attempts on failure (default: 2)"
>
> [Highlight each option in config]
>
> "You can also configure reporters, environment variables, and custom hooks."

**[3:00-5:00] Test Discovery**
> "Guardian automatically discovers tests based on your framework:"
>
> - "Playwright: `*.spec.ts` and `*.test.ts`"
> - "Cypress: Files in `cypress/integration/`"
> - "Jest: Files matching Jest's default patterns"
>
> [Show file explorer with test files]
>
> "You can filter tests using the `--grep` flag:"
>
> - "`guardian run --grep 'login'` - Run only tests matching 'login'"
> - "`guardian run --grep 'smoke'` - Run smoke tests only"
>
> [Show terminal commands]

**[5:00-7:00] Parallel Execution**
> "Guardian runs tests in parallel by default. Let's see how this works."
>
> [Show guardian run command with verbose output]
>
> "Notice Guardian is running 4 tests simultaneously. This is controlled by the `parallelism` setting."
>
> [Show terminal output with parallel execution]
>
> "For CI/CD, you can increase parallelism: `guardian run --parallel 8`"
>
> "This cuts execution time significantly. Our test suite runs in 2 minutes instead of 15!"

**[7:00-9:00] Result Reporting**
> "After tests complete, Guardian uploads results to your dashboard. Let's explore the detailed view."
>
> [Open Guardian dashboard]
>
> "The test run summary shows:"
>
> - "Total tests, pass/fail counts"
> - "Execution duration"
> - "Comparison with previous runs"
>
> [Show test run summary]
>
> "Click a failed test to see:"
>
> - "Error message and stack trace"
> - "Screenshot at point of failure"
> - "Video recording (for Playwright)"
> - "Browser console logs"
>
> [Show failed test details]

**[9:00-10:00] Wrap-up**
> "That's Guardian's test runner! Key takeaways:"
>
> - "Configure once, run everywhere"
> - "Parallel execution saves time"
> - "Detailed reporting helps debug faster"
>
> "Next, check out our monitoring video to learn about continuous test execution."

### Recording Checklist

- [ ] Prepare project with 10+ tests
- [ ] Mix of passing/failing tests
- [ ] Configure different parallelism levels
- [ ] Record execution with verbose output
- [ ] Prepare dashboard with test results

---

## Video 3: Setting Up Monitors (15 minutes)

**Target Audience**: DevOps engineers, SREs  
**Objective**: Configure continuous monitoring for production apps  
**Format**: Screen recording with voiceover

### Script

**[0:00-1:00] Introduction**
> "Monitors let you continuously test your production endpoints. Guardian runs checks every minute and alerts you when issues arise."

**[1:00-3:00] Create HTTP Monitor**
> "Let's create a monitor for an API endpoint. Navigate to Monitors > Create Monitor."
>
> [Show Guardian dashboard, navigate to Monitors]
>
> "Configure the monitor:"
>
> - "Name: 'Production API Health'"
> - "URL: 'https://api.yourapp.com/health'"
> - "Method: GET"
> - "Interval: Every 1 minute"
> - "Timeout: 5 seconds"
>
> [Show monitor creation form]
>
> "Add assertions:"
>
> - "Status code equals 200"
> - "Response time less than 500ms"
> - "Body contains 'healthy'"
>
> [Show assertion configuration]

**[3:00-5:00] Configure Alerts**
> "Set up alerts to notify your team when checks fail."
>
> [Show alerts configuration]
>
> "Alert options:"
>
> - "Email: Send to team@yourapp.com"
> - "Slack: Post to #alerts channel"
> - "Webhook: Call your incident management system"
>
> [Configure Slack integration]
>
> "Alert thresholds:"
>
> - "Alert after: 3 consecutive failures"
> - "Recovery notification: Yes"
> - "Escalation: Page on-call after 5 failures"

**[5:00-7:00] Dashboard Metrics**
> "The monitor dashboard shows real-time status. Let's explore the metrics."
>
> [Show monitor dashboard]
>
> "Key metrics:"
>
> - "Uptime: 99.95% over last 30 days"
> - "Avg response time: 145ms"
> - "Success rate: 99.8%"
> - "Check history: Last 1000 checks"
>
> [Show metric charts]

**[7:00-10:00] Multi-Step Monitors**
> "For complex workflows, create multi-step monitors. Example: user login flow."
>
> [Create new monitor]
>
> "Steps:"
>
> 1. "GET /login page - Assert status 200"
> 2. "POST /login with credentials - Assert status 200"
> 3. "GET /dashboard - Assert redirected, status 200"
>
> [Configure each step]
>
> "Guardian executes steps sequentially and tracks success rate for the entire flow."

**[10:00-12:00] Geographic Distribution**
> "Run monitors from multiple regions to detect regional outages."
>
> [Show region configuration]
>
> "Available regions:"
>
> - "US East (Virginia)"
> - "US West (Oregon)"
> - "EU West (Ireland)"
> - "Asia Pacific (Singapore)"
>
> "Select multiple regions to get global coverage."

**[12:00-15:00] Incident Response**
> "When a monitor fails, Guardian creates an incident. Let's walk through the response flow."
>
> [Trigger a test failure]
>
> "1. Guardian detects failure (3 consecutive checks)"
> "2. Alert sent via Slack: 'API Health check failing'"
> "3. Team investigates using Guardian's detailed logs"
> "4. Issue resolved, monitor returns to healthy"
> "5. Guardian sends recovery notification"
>
> [Show incident timeline]
>
> "Post-incident, review the timeline to understand:"
>
> - "When did the issue start?"
> - "How long was it down?"
> - "What was the error?"
> - "Response time from alert to resolution"

### Recording Checklist

- [ ] Prepare test API endpoints
- [ ] Configure Slack integration
- [ ] Create sample monitors (passing/failing)
- [ ] Record geographic region selector
- [ ] Simulate incident and resolution

---

## Video 4: CI/CD Integration (20 minutes)

**Target Audience**: DevOps engineers, CI/CD admins  
**Objective**: Integrate Guardian into automated pipelines  
**Format**: Screen recording with voiceover

### Script

**[0:00-1:00] Introduction**
> "Running tests in CI/CD is critical for catching bugs before production. This video shows how to integrate Guardian into GitHub Actions, GitLab CI, Jenkins, and other platforms."

**[1:00-5:00] GitHub Actions Integration**
> "Let's add Guardian to a GitHub Actions workflow. Create `.github/workflows/guardian.yml`."
>
> [Show file creation in VS Code]
>
> ```yaml
> name: Guardian Tests
> on: [push, pull_request]
> jobs:
>   test:
>     runs-on: ubuntu-latest
>     steps:
>       - uses: actions/checkout@v3
>       - uses: actions/setup-node@v3
>       - run: npm install -g @guardian/cli
>       - run: guardian run
>         env:
>           GUARDIAN_API_KEY: ${{ secrets.GUARDIAN_API_KEY }}
> ```
>
> [Show YAML file]
>
> "Store your API key in GitHub Secrets: Settings > Secrets > GUARDIAN_API_KEY"
>
> [Show GitHub secrets configuration]
>
> "Now push a commit and watch the workflow run."
>
> [Show GitHub Actions tab with running workflow]

**[5:00-8:00] GitLab CI Integration**
> "For GitLab, add Guardian to `.gitlab-ci.yml`."
>
> [Show .gitlab-ci.yml]
>
> ```yaml
> test:
>   image: node:18
>   script:
>     - npm install -g @guardian/cli
>     - guardian run
>   variables:
>     GUARDIAN_API_KEY: $GUARDIAN_API_KEY
> ```
>
> [Show GitLab CI/CD pipeline]

**[8:00-12:00] Pull Request Checks**
> "Guardian can block PR merges if tests fail. Let's configure PR checks."
>
> [Show GitHub branch protection rules]
>
> "Enable required status checks:"
>
> - "Require 'Guardian Tests' to pass"
> - "Require branches to be up to date"
>
> [Show configuration]
>
> "Now when a PR has failing tests, the merge button is disabled until tests pass."
>
> [Show example PR with failed tests]

**[12:00-16:00] Parallel Test Sharding**
> "For large test suites, use test sharding to run tests across multiple jobs."
>
> [Show GitHub Actions matrix strategy]
>
> ```yaml
> jobs:
>   test:
>     runs-on: ubuntu-latest
>     strategy:
>       matrix:
>         shard: [1, 2, 3, 4]
>     steps:
>       - run: guardian run --shard ${{ matrix.shard }}/4
> ```
>
> "Guardian automatically splits tests into 4 equal groups. This cuts execution time by 4x!"
>
> [Show parallel jobs running]

**[16:00-18:00] Deployment Gates**
> "Use Guardian as a deployment gate. Only deploy if tests pass."
>
> [Show deployment workflow]
>
> ```yaml
> deploy:
>   needs: test
>   runs-on: ubuntu-latest
>   steps:
>     - run: echo "Deploying to production..."
> ```
>
> "The `needs: test` ensures deployment only happens after tests pass."

**[18:00-20:00] Best Practices**
> "CI/CD best practices with Guardian:"
>
> - "Run tests on every PR"
> - "Use test sharding for speed"
> - "Cache dependencies (node_modules)"
> - "Set appropriate timeouts"
> - "Monitor flaky tests"
> - "Keep API keys in secrets"
>
> "For more, check our docs at guardian.app/docs/cicd"

### Recording Checklist

- [ ] Prepare GitHub repo with tests
- [ ] Configure GitHub Actions workflow
- [ ] Set up secrets
- [ ] Record workflow execution
- [ ] Show PR with failed tests
- [ ] Configure branch protection
- [ ] Demonstrate test sharding

---

## General Recording Guidelines

### Equipment & Setup

- **Resolution**: 1920x1080 (1080p)
- **Frame Rate**: 30 FPS
- **Software**: OBS Studio / ScreenFlow / Camtasia
- **Cursor**: Enable highlight (yellow circle)
- **Microphone**: Blue Yeti / Rode NT-USB
- **Audio**: 44.1kHz, stereo

### Editing Guidelines

- Add intro/outro (5 seconds each)
- Include Guardian logo animation
- Add chapter markers for sections
- Include closed captions
- Export at 1080p, H.264, 5 Mbps

### Publishing Checklist

- [ ] Upload to YouTube
- [ ] Add to Guardian docs
- [ ] Create thumbnail (1280x720)
- [ ] Add video description with timestamps
- [ ] Tag relevant keywords
- [ ] Add to video playlist

---

## Video Production Timeline

| Video | Script | Recording | Editing | Review | Publish |
|-------|--------|-----------|---------|--------|---------|
| 1. Getting Started | Week 14 Day 1 | Week 14 Day 1 | Week 14 Day 2 | Week 14 Day 2 | Week 14 Day 3 |
| 2. First Test | Week 14 Day 2 | Week 14 Day 2 | Week 14 Day 3 | Week 14 Day 3 | Week 14 Day 4 |
| 3. Monitors | Week 14 Day 3 | Week 14 Day 3 | Week 14 Day 4 | Week 14 Day 4 | Week 14 Day 5 |
| 4. CI/CD | Week 14 Day 4 | Week 14 Day 4 | Week 14 Day 5 | Week 14 Day 5 | Week 14 Day 5 |

**Total Production Time**: 5 days  
**Total Video Duration**: 50 minutes  
**Target**: Published by Week 14 Day 5
