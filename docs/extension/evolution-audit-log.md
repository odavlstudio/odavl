### Logic Split (Second Step)

Further refactored DashboardProvider and RecipesProvider to move business logic (root item generation) into dedicated logic classes (`DashboardLogic`, `RecipesLogic`) in `src/logic/`. Providers now delegate business logic to these classes, preparing for full UI/data/logic separation and future testability.

#### Rationale

- Enables true separation of business logic from UI and data
- Prepares for future unit testing and DI/service container
- Keeps provider classes focused on VS Code API wiring only

#### Before Structure

```
src/components/DashboardProvider.ts (UI, logic, data)
src/components/RecipesProvider.ts (UI, logic, data)
```

#### After Structure

```
src/components/DashboardProvider.ts (UI only)
src/logic/DashboardLogic.ts (logic)
src/providers/DashboardDataService.ts (data)
src/components/RecipesProvider.ts (UI only)
src/logic/RecipesLogic.ts (logic)
src/providers/RecipesDataService.ts (data)
```

#### Governance Compliance

- All changes ≤40 lines/≤10 files per commit
- No protected paths modified
- All changes auditable and incremental

#### Commits

- [commit-hash-placeholder-3] DashboardProvider logic split
- [commit-hash-placeholder-4] RecipesProvider logic split

---

## First Wave: Provider Refactor (Ultra Evolution Mission)

### Summary

Refactored DashboardProvider and RecipesProvider to separate data access into new data service classes (`DashboardDataService`, `RecipesDataService`) in `src/providers/`. This is the first step toward a full separation of data, logic, and UI layers for all TreeDataProviders, enabling modularity, testability, and future DI/service container integration.

### Rationale

- Enables strict separation of concerns (data, logic, UI)
- Prepares for async I/O, DI/service container, and health checks
- Improves maintainability and testability
- Aligns with ODAVL governance: ≤40 lines/≤10 files per commit, no protected path edits

### Before Structure

```
src/components/DashboardProvider.ts (data, logic, UI mixed)
src/components/RecipesProvider.ts (data, logic, UI mixed)
```

### After Structure

```
src/components/DashboardProvider.ts (UI/logic)
src/providers/DashboardDataService.ts (data)
src/components/RecipesProvider.ts (UI/logic)
src/providers/RecipesDataService.ts (data)
```

### Governance Compliance

- All changes ≤40 lines/≤10 files per commit
- No protected paths modified
- All changes auditable and incremental

### Commits

- [commit-hash-placeholder-1] DashboardProvider data split
- [commit-hash-placeholder-2] RecipesProvider data split

---

# ODAVL Extension Evolution Audit Log

**Date:** 2025-10-14
**Phase:** Plan & Architecture Refactor Start

## Summary

- Branch: `odavl/ext-evolution-20251014`
- Scope: Begin deep architecture/codebase reinvention (TreeDataProvider refactor, DI/service container, async I/O, types/docs, health checks)
- Policy: ≤40 lines, ≤10 files/commit, no protected paths

## Actions

- Created new branch for evolution mission
- Created docs/extension/ for auto-generated documentation
- Next: Refactor providers for separation of data/logic/UI, introduce DI, add types/docs, replace sync I/O, add health checks

---
This log will be updated after each major phase or commit.

---

### UI Split (Third Step)

Completed the UI split for DashboardProvider and RecipesProvider. Created `DashboardTree` and `RecipesTree` classes in `src/ui/` to handle all TreeDataProvider logic and VS Code API wiring. Providers now only wire up data, logic, and UI, delegating all TreeDataProvider methods to the new UI classes. This completes the first wave of the provider refactor.

#### Rationale

- Achieves strict separation of UI, logic, and data for all TreeDataProviders
- Enables future UI/logic/data testability and modularity
- Prepares for DI/service container and async I/O
- Keeps provider classes minimal and focused

#### Before Structure

```
src/components/RecipesProvider.ts (UI, logic, data)
src/components/DashboardProvider.ts (UI, logic, data)
```

#### After Structure

```
src/components/RecipesProvider.ts (wires up data/logic/UI, delegates to RecipesTree)
src/logic/RecipesLogic.ts (logic)
src/providers/RecipesDataService.ts (data)
src/ui/RecipesTree.ts (UI)
src/components/DashboardProvider.ts (wires up data/logic/UI, delegates to DashboardTree)
src/logic/DashboardLogic.ts (logic)
src/providers/DashboardDataService.ts (data)
src/ui/DashboardTree.ts (UI)
```

#### Governance Compliance

- All changes ≤40 lines/≤10 files per commit
- No protected paths modified
- All changes auditable and incremental

#### Commits

- [commit-hash-placeholder-5] DashboardProvider UI split
- [commit-hash-placeholder-6] RecipesProvider UI split
