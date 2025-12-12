# Insight Demo Script (90 seconds)

**Goal**: Show 16 detectors finding real issues

## Setup
- Demo workspace with intentional errors
- Insight dashboard showing fresh scan results
- ~200 total issues across categories

## Script (90s)

**[0-15s] Opening**
"This is ODAVL Insight - ML-powered error detection across 16 categories. Let me show you what it catches that other tools miss."

**[15-35s] Dashboard Tour**
*Scroll through detector categories*
- TypeScript: 45 issues (unused vars, any types)
- Security: 12 issues (hardcoded secrets, SQL injection)
- Performance: 28 issues (sync operations, memory leaks)
- Imports: 18 issues (circular deps, unused imports)

**[35-55s] Drill Down**
*Click Security detector*
"Here's a hardcoded API key Insight caught. Severity: Critical. File location, line number, suggested fix."

*Click Performance detector*
"Synchronous file reads blocking event loop. Insight recommends async alternatives."

**[55-75s] VS Code Integration**
*Switch to VS Code*
"Native extension shows issues in Problems Panel. Click to navigate. One-click handoff to Autopilot for fixing."

**[75-90s] Results**
"16 detectors, 95% accuracy, real-time analysis. Catches bugs before code review. Try free at odavl.com"
