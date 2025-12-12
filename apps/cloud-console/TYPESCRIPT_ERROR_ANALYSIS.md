# TypeScript Error Analysis - ODAVL Cloud Console
**Date**: December 8, 2025  
**Total Errors**: **109 errors**  
**Status**: Phase 14 - Production Hardening (Step 1 Complete)

---

## 📊 Error Categories Summary

| Category | Count | Severity | Root Cause |
|----------|-------|----------|------------|
| **1. Prisma Relation Mismatch** | 35 | 🔴 CRITICAL | `user.organizations` vs schema `organizations: OrganizationMember[]` |
| **2. Missing Prisma Model Accessors** | 25 | 🔴 CRITICAL | `prisma.organizationMember`, `prisma.subscription`, `prisma.usageEvent` don't exist |
| **3. Enum Not Exported** | 15 | 🔴 CRITICAL | `OrgRole`, `Tier`, `ProjectStatus`, etc. not exported from `@prisma/client` |
| **4. Field Name Mismatches** | 18 | 🟠 HIGH | `hashedPassword`, `tier`, `organizationId`, `keyHash` missing/wrong |
| **5. NextAuth Type Extensions** | 8 | 🟠 HIGH | `session.user.id`, `session.user.activeOrgId` not typed |
| **6. Implicit Any Types** | 5 | 🟡 MEDIUM | Map callbacks missing type annotations |
| **7. Library Version Mismatch** | 3 | 🟡 MEDIUM | Stripe API version, Sentry Integrations API |

---

## 🔴 CRITICAL: Category 1 - Prisma Relation Name Mismatch (35 errors)

### **Problem**
Code expects `user.organizations` but Prisma schema defines the relation as:
```prisma
model User {
  organizations  OrganizationMember[]  // Relation name: "organizations"
}
```

Prisma generates TypeScript accessor for the **model name** (OrganizationMember[]), not the field name.

### **Affected Files** (18 files)
- `app/api/analyze/route.ts` (3 errors)
- `app/api/audit/route.ts` (3 errors)
- `app/api/billing/portal/route.ts` (3 errors)
- `app/api/billing/subscribe/route.ts` (3 errors)
- `app/api/billing/usage/route.ts` (3 errors)
- `app/api/fix/route.ts` (3 errors)
- `lib/auth.ts` (8 errors) ⚠️ **TOP OFFENDER**
- `lib/org-context.ts` (9 errors) ⚠️ **TOP OFFENDER**

### **Example Errors**
```typescript
// ❌ Code tries:
include: { organizations: { include: { organization: true } } }
// Error: 'organizations' does not exist in type 'UserInclude<DefaultArgs>'

// ❌ Code tries:
user.organizations.length
// Error: Property 'organizations' does not exist on type 'User'

// ❌ Code tries:
user.organizations.map(om => ...)
// Error: Property 'organizations' does not exist
```

### **Resolution Strategy**
**Option A** (Recommended): Keep schema, fix code
- Replace all `organizations` → `organizations` (keep same name but understand it returns `OrganizationMember[]`)
- Prisma client correctly interprets this as the join table

**Option B**: Rename relation in schema
- Could rename to `organizationMemberships` for clarity
- But this requires migration and is riskier

**Decision**: Use **Option A** - the schema is correct, code just needs to understand the type properly.

---

## 🔴 CRITICAL: Category 2 - Missing Prisma Model Accessors (25 errors)

### **Problem**
Code calls Prisma client methods for models that exist in schema but accessor names are wrong.

### **Missing Accessors**

#### **2.1 `prisma.organizationMember` (10 errors)**

**Schema has**: `model OrganizationMember { ... }`  
**Prisma generates**: `prisma.organizationMember` (camelCase singular)  
**Code incorrectly uses**: Various patterns

**Affected Files**:
- `app/api/members/route.ts` (7 errors) ⚠️ **TOP OFFENDER**
- `lib/permissions.ts` (1 error)
- `prisma/seed.ts` (2 errors)

**Example Errors**:
```typescript
// ❌ Error: Property 'organizationMember' does not exist
prisma.organizationMember.findMany()
// This is actually CORRECT - the error is from stale generated client
```

**Root Cause**: Prisma client not regenerated after schema changes.

#### **2.2 `prisma.subscription` (6 errors)**

**Schema has**: `model Subscription { ... }` ✅  
**Code uses**: `prisma.subscription.*` ❌  
**Generated accessor**: Should be `prisma.subscription` but missing

**Affected Files**:
- `app/api/billing/webhook/route.ts` (5 errors)
- `lib/usage.ts` (3 errors)
- `prisma/seed.ts` (2 errors)

#### **2.3 `prisma.usageEvent` (3 errors)**

**Schema has**: `model UsageEvent { ... }` ✅  
**Code uses**: `prisma.usageEvent.*` ❌

**Affected Files**:
- `lib/usage.ts` (1 error)
- `prisma/seed.ts` (1 error)

#### **2.4 `prisma.errorSignature` (1 error)**
**Affected**: `prisma/seed.ts`

#### **2.5 `prisma.fixAttestation` (1 error)**
**Affected**: `prisma/seed.ts`

#### **2.6 `prisma.auditResult` (1 error)**
**Affected**: `prisma/seed.ts`

#### **2.7 `prisma.auditIssue` (1 error)**
**Affected**: `prisma/seed.ts`

### **Resolution Strategy**
1. **Verify schema model names are correct** (they are ✅)
2. **Regenerate Prisma client**: `pnpm prisma generate`
3. **Verify generated accessors match usage**

**Root Cause**: Schema is correct, but Prisma client generation might be stale or incomplete.

---

## 🔴 CRITICAL: Category 3 - Enums Not Exported (15 errors)

### **Problem**
Code imports enums from `@prisma/client` but they're not in generated client exports.

### **Missing Enums**

#### **3.1 `OrgRole` (6 errors)**

**Schema has**:
```prisma
enum OrgRole {
  OWNER
  ADMIN
  DEVELOPER
  VIEWER
}
```

**Code imports**:
```typescript
import { OrgRole } from '@prisma/client';  // ❌ Error: no exported member 'OrgRole'
```

**Affected Files**:
- `app/api/members/route.ts` (1 error)
- `app/team/page.tsx` (1 error)
- `lib/api-client.ts` (1 error)
- `lib/audit.ts` (1 error)
- `lib/org-context.ts` (1 error)
- `lib/rbac.ts` (1 error)
- `prisma/seed.ts` (1 error)

#### **3.2 `Tier` (1 error)**
**Affected**: `prisma/seed.ts`

#### **3.3 `ProjectStatus` (1 error)**
**Affected**: `prisma/seed.ts`

#### **3.4 `FixStatus` (1 error)**
**Affected**: `prisma/seed.ts`

#### **3.5 `AuditStatus` (1 error)**
**Affected**: `prisma/seed.ts`

#### **3.6 `SubscriptionStatus` (1 error)**
**Affected**: `prisma/seed.ts`

### **Resolution Strategy**
**Root Cause**: Prisma client should export these enums automatically when they're defined in schema.

**Solution**:
1. Verify enums are correctly defined in `schema.prisma` ✅ (CONFIRMED)
2. Regenerate Prisma client
3. If still missing, check Prisma version compatibility
4. Fallback: Define enums manually in `lib/types.ts` and reference them

---

## 🟠 HIGH: Category 4 - Field Name Mismatches (18 errors)

### **4.1 `hashedPassword` field (3 errors)**

**Problem**: Code expects `user.hashedPassword` but it's not in generated User type.

**Schema has**:
```prisma
model User {
  hashedPassword String?  // ✅ Field EXISTS
}
```

**Code uses**:
```typescript
user.hashedPassword  // ❌ Error: Property 'hashedPassword' does not exist
```

**Affected Files**:
- `app/api/auth/reset-password/route.ts` (1 error)
- `app/api/auth/signup/route.ts` (1 error)
- `lib/auth.ts` (2 errors)

**Root Cause**: Prisma client not regenerated after adding this field.

### **4.2 `tier` field writes (5 errors)**

**Problem**: Code tries to write to `organization.tier` directly.

**Schema has**:
```prisma
model Organization {
  tier Tier @default(FREE)  // ✅ Field EXISTS
}
```

**Code tries**:
```typescript
await prisma.organization.update({
  data: { tier: 'PRO' }  // ❌ Error: 'tier' does not exist in UpdateInput
})
```

**Affected Files**:
- `app/api/auth/signup/route.ts` (1 error)
- `app/api/billing/webhook/route.ts` (2 errors)
- `lib/auth.ts` (1 error)
- `prisma/seed.ts` (2 errors)

**Root Cause**: TypeScript sees `tier` as read-only in some contexts. May need to verify Prisma input types.

### **4.3 `organizationId` direct access (6 errors)**

**Problem**: Code uses `organizationId` scalar field but Prisma expects relation syntax.

**Affected Files**:
- `app/api/fix/route.ts` (1 error)
- `app/api/projects/route.ts` (3 errors)
- `prisma/seed.ts` (3 errors)

**Example**:
```typescript
// ❌ Error: 'organizationId' does not exist in ProjectWhereInput
where: { organizationId: '...' }

// ✅ Should be:
where: { organization: { id: '...' } }
```

### **4.4 `organizationId_slug` compound unique (3 errors)**

**Schema has**:
```prisma
model Project {
  @@unique([organizationId, slug])
}
```

**Code tries**:
```typescript
where: { organizationId_slug: { organizationId: '...', slug: '...' } }
// ❌ Error: 'organizationId_slug' does not exist
```

**Affected**: `prisma/seed.ts` (3 errors)

**Root Cause**: Prisma generates compound unique constraint names differently.

### **4.5 `keyHash` field (1 error)**

**Affected**: `prisma/seed.ts`

---

## 🟠 HIGH: Category 5 - NextAuth Type Extensions (8 errors)

### **Problem**
NextAuth's default types don't include custom fields we added to session/user.

### **Missing Types**

#### **5.1 `session.user.id` (3 errors)**

**Code expects**:
```typescript
const userId = session.user.id;  // ❌ Property 'id' does not exist
```

**Default NextAuth type**:
```typescript
interface Session {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    // ❌ NO 'id' field
  }
}
```

**Affected Files**:
- `app/api/organizations/route.ts` (1 error)
- `lib/auth.ts` (1 error)

#### **5.2 `session.activeOrgId` (code uses `as any`)

Currently code does:
```typescript
(session as any).activeOrgId = token.activeOrgId;  // Workaround
```

This works at runtime but bypasses type safety.

#### **5.3 `session.organizations` array**

Same issue - not typed.

### **Resolution Strategy**
Create type declaration file: `types/next-auth.d.ts`

```typescript
import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      activeOrgId?: string;
      organizations?: Array<{
        id: string;
        name: string;
        slug: string;
        role: string;
      }>;
    } & DefaultSession['user'];
  }
  
  interface User {
    id: string;
    // ... other fields
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    activeOrgId?: string;
    organizations?: Array<{
      id: string;
      name: string;
      slug: string;
      role: string;
    }>;
  }
}
```

---

## 🟡 MEDIUM: Category 6 - Implicit Any Types (5 errors)

### **Problem**
TypeScript can't infer parameter types in callbacks.

### **Examples**

```typescript
// ❌ Parameter 'm' implicitly has an 'any' type
user.organizations.map(m => m.role)

// ✅ Should be:
user.organizations.map((m: OrganizationMember) => m.role)
```

**Affected Files**:
- `app/api/members/route.ts` (1 error)
- `lib/auth.ts` (1 error)
- `lib/org-context.ts` (3 errors)

### **Resolution**
Add explicit type annotations to map/filter/find callbacks.

---

## 🟡 MEDIUM: Category 7 - Library Version Mismatch (3 errors)

### **7.1 Stripe API Version (1 error)**

**Error**:
```typescript
// lib/stripe.ts(8,3): error TS2322:
// Type '"2024-12-18.acacia"' is not assignable to type '"2023-10-16"'
```

**Cause**: `@types/stripe` package expects older API version.

**Resolution**: Update Stripe types or use older API version string.

### **7.2 Sentry Integrations (1 error)**

**Error**:
```typescript
// sentry.server.config.ts(15,16): error TS2551:
// Property 'Integrations' does not exist on type 'typeof import(...)'
```

**Cause**: Sentry v10.x API changed. Old v7.x syntax:
```typescript
import * as Sentry from '@sentry/nextjs';
Sentry.Integrations.Prisma()  // ❌ Old API
```

New v10.x syntax:
```typescript
import { prismaIntegration } from '@sentry/nextjs';
prismaIntegration()  // ✅ New API
```

**Resolution**: Update Sentry config to v10 API.

---

## 🟢 Category 8 - Missing Exported Functions (2 errors)

### **8.1 `withOrgContext` not exported**

**Error**: `app/api/organizations/route.ts(9,10)`

**Code tries**:
```typescript
import { withOrgContext, withPermission } from '@/lib/org-context';
// ❌ Error: no exported member 'withOrgContext'
```

**Resolution**: Check if these middleware functions exist in `lib/org-context.ts` or create them.

---

## 🟢 Category 9 - Wrong Property Access (4 errors)

### **9.1 `recipesApplied` doesn't exist (1 error)**

**File**: `app/api/fix/route.ts(129,9)`

**Code tries**:
```typescript
metadata: { duration, filesModified, riskScore, recipesApplied }
// ❌ 'recipesApplied' does not exist in allowed type
```

**Resolution**: Remove or rename to match schema.

### **9.2 `issuesFixed` doesn't exist (1 error)**

**File**: `app/api/fix/route.ts(170,11)`

**Resolution**: Verify `AutopilotRun` model field names.

### **9.3 `errorSignatures` count (1 error)**

**File**: `app/api/projects/route.ts(59,13)`

**Code tries**:
```typescript
_count: { select: { errorSignatures: true } }
// ❌ 'errorSignatures' does not exist in ProjectCountOutputTypeSelect
```

**Resolution**: Verify relation name in schema.

### **9.4 Project `status` field (1 error)**

**File**: `app/api/projects/route.ts(203,15)`

**Code tries**:
```typescript
await prisma.project.update({
  data: { status: 'ARCHIVED' }
  // ❌ 'status' does not exist in ProjectUpdateInput
})
```

**Resolution**: Verify if `status` field exists in Project model.

---

## 🟢 Category 10 - Wrong Enum Values (2 errors)

### **10.1 `AuditAction` enum mismatch**

**File**: `app/api/fix/route.ts`

**Code uses**:
```typescript
action: 'autopilot.run'  // ❌ String literal not in enum
action: 'autopilot.run.failed'  // ❌ String literal not in enum
```

**Schema likely has**:
```prisma
enum AuditAction {
  ANALYZE_RUN
  GUARDIAN_TEST
  // Missing: AUTOPILOT_RUN, AUTOPILOT_RUN_FAILED
}
```

**Resolution**: Add missing enum values to schema.

---

## 📋 Action Plan Priority

### **🔥 PRIORITY 1: Fix Prisma Client Generation (Solves 55+ errors)**

1. **Regenerate Prisma client**:
   ```bash
   cd apps/cloud-console
   pnpm prisma generate
   ```

2. **Verify generated types** in `node_modules/.prisma/client/index.d.ts`:
   - ✅ Enums exported (`OrgRole`, `Tier`, etc.)
   - ✅ Model accessors exist (`organizationMember`, `subscription`, etc.)
   - ✅ Field types correct (`hashedPassword`, `tier`, etc.)

3. **If enums still missing**: Check Prisma version, update if needed

**Expected Result**: Eliminates Categories 2, 3, and most of 4 (~55 errors)

---

### **🔥 PRIORITY 2: Fix Schema Field Access Patterns (Solves 35 errors)**

1. **User.organizations relation**: Update code to correctly use `OrganizationMember[]` type
2. **organizationId scalar vs relation**: Use relation syntax in where clauses
3. **Compound unique constraints**: Fix naming

**Expected Result**: Eliminates Category 1 (~35 errors)

---

### **🔥 PRIORITY 3: Create NextAuth Type Extensions (Solves 8 errors)**

Create `types/next-auth.d.ts` with proper session/user type extensions.

**Expected Result**: Eliminates Category 5 (~8 errors)

---

### **🟡 PRIORITY 4: Fix Remaining Issues (Solves 11 errors)**

1. Add explicit type annotations (Category 6)
2. Update library APIs (Category 7)
3. Fix property access errors (Categories 8, 9, 10)

**Expected Result**: Eliminates remaining ~11 errors

---

## 📊 Expected Progress

| Phase | Errors Remaining | Target |
|-------|------------------|--------|
| **Current** | 109 | - |
| **After Prisma Regen** | ~54 | Regenerate client |
| **After Schema Fixes** | ~19 | Fix relation patterns |
| **After NextAuth Types** | ~11 | Add type declarations |
| **After Cleanup** | **0** | ✅ GOAL |

---

## 🎯 Success Criteria

- [📋] **0 TypeScript errors** in `pnpm typecheck`
- [📋] **Production build passes** (`pnpm build`)
- [📋] **No `as any` workarounds** (except in controlled type helpers)
- [📋] **All Prisma models accessible** via client
- [📋] **All enums exported** from `@prisma/client`
- [📋] **NextAuth session properly typed**

---

**Next Step**: Begin STEP 2 - Create Prisma Schema Alignment Strategy
