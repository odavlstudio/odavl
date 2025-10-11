# 🚀 ODAVL Website Startup Guide

Generated: 2025-10-07 11:18:30Z

## 🔍 **ROOT CAUSE IDENTIFIED** ❌→✅

**THE PROBLEM**: You're running dev commands from the **wrong directory**!

### Environment Check ✅

- Node.js version: v22.19.0 ✅
- pnpm version: 9.12.2 ✅
- npm version: 11.4.2 ✅
- Port 3000: Available ✅
- Workspace: pnpm monorepo detected ✅
- Next.js: next.config.ts found ✅
- TypeScript: tsconfig.json found ✅

### **Why `npm run dev` Failed** ❌

When you run `pnpm run dev` from the **monorepo root** (`c:\Users\sabou\dev\odavl`), it tries to execute the root package.json scripts, which **don't include a "dev" script**.

**Root package.json scripts:**

- `odavl:run`, `odavl:observe`, `odavl:decide` (CLI tools)
- `ext:compile`, `ext:watch` (VS Code extension)
- **NO "dev" script** ❌

**Website package.json scripts:**

- `dev: "next dev --turbopack"` ✅
- `build: "next build --turbopack"` ✅

## 1️⃣ **CORRECT Startup Instructions**

### Method A: Change Directory First (Recommended)

```bash
cd odavl-website
npm run dev
# OR
pnpm run dev
```

### Method B: Run from Root with Workspace Commands

```bash
pnpm --filter odavl-website dev
```

### Method C: Direct Next.js Command

```bash
cd odavl-website
npx next dev --turbopack
```

## 2️⃣ **Quick Start (Copy & Paste)**

```bash
cd c:\Users\sabou\dev\odavl\odavl-website
npm install
npm run dev
```

**The ODAVL website will start on <http://localhost:3000> with Turbopack! 🚀**
