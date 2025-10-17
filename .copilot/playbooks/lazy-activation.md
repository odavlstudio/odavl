# Playbook: Lazy Activation

## Goal

Replace eager activation (`onStartupFinished`) with lazy activation triggered by views or commands.

## Safety

- ≤40 lines, ≤10 files, no protected paths

## Patch Plan

1. In `package.json`, replace "onStartupFinished" with:

   ```json
   "activationEvents": [
     "onView:odavl.dashboard",
     "onCommand:odavl.openDashboard",
     "onCommand:odavl.runDoctor"
   ]
   ```

2. In src/extension.ts, wrap heavy initialization in an async activateOnDemand(context) function.
3. Register commands to trigger activation on first use.
4. Dispose resources in deactivate().

## Verify

- `pnpm build` passes cleanly.
- Extension activates only when user opens ODAVL view or runs a command.
