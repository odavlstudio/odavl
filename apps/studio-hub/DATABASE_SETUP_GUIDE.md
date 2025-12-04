# 🗄️ دليل إعداد قاعدة البيانات - ODAVL Studio Hub

**التاريخ**: 24 نوفمبر 2025  
**الحالة**: يتطلب إجراء يدوي  
**الأولوية**: 🔴 حرجة

---

## 📋 الوضع الحالي

**DATABASE_URL الحالي**: `file:./dev.db` (SQLite)  
**المطلوب**: PostgreSQL 15+ للإنتاج

---

## ✅ خيار 1: PostgreSQL عبر Docker (موصى به)

### الخطوة 1: تثبيت Docker Desktop
1. تحميل من: https://www.docker.com/products/docker-desktop/
2. تثبيت وإعادة تشغيل الجهاز
3. فتح Docker Desktop والتأكد من تشغيله

### الخطوة 2: تشغيل PostgreSQL Container
```powershell
docker run --name odavl-postgres `
  -e POSTGRES_PASSWORD=postgres `
  -e POSTGRES_DB=odavl_hub `
  -p 5432:5432 `
  -d postgres:15-alpine

# التحقق من التشغيل
docker ps
```

### الخطوة 3: تحديث .env.local
```powershell
# استبدال DATABASE_URL في .env.local
$envContent = Get-Content .env.local -Raw
$envContent = $envContent -replace 'DATABASE_URL="file:./dev.db"', 'DATABASE_URL="postgresql://postgres:postgres@localhost:5432/odavl_hub?schema=public"'
$envContent | Set-Content .env.local
```

### الخطوة 4: تطبيق Migrations
```powershell
pnpm db:generate
pnpm db:push
```

### الخطوة 5: إنشاء seed script
```powershell
# إنشاء ملف prisma/seed.ts (انظر الكود أدناه)
pnpm db:seed
```

---

## ✅ خيار 2: PostgreSQL محلي (بدون Docker)

### Windows - تثبيت PostgreSQL
```powershell
# عبر winget
winget install PostgreSQL.PostgreSQL

# أو تحميل من
# https://www.postgresql.org/download/windows/
```

### بعد التثبيت
```powershell
# إنشاء database
psql -U postgres
CREATE DATABASE odavl_hub;
\q

# تحديث .env.local
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/odavl_hub?schema=public"

# تطبيق migrations
pnpm db:generate
pnpm db:push
```

---

## 📝 ملف seed.ts (مطلوب)

**إنشاء**: `prisma/seed.ts`

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create demo organization
  const org = await prisma.organization.upsert({
    where: { id: 'demo-org' },
    update: {},
    create: {
      id: 'demo-org',
      name: 'ODAVL Demo Organization',
      slug: 'demo-org',
      plan: 'PRO',
      monthlyApiCalls: 0,
      monthlyInsightRuns: 0,
      monthlyAutopilotRuns: 0,
      monthlyGuardianTests: 0,
    },
  });

  console.log('✅ Organization created:', org.name);

  // Create demo user
  const user = await prisma.user.upsert({
    where: { email: 'demo@odavl.com' },
    update: {},
    create: {
      email: 'demo@odavl.com',
      name: 'Demo User',
      role: 'ADMIN',
      organizationId: org.id,
    },
  });

  console.log('✅ User created:', user.email);

  // Create demo project
  const project = await prisma.project.create({
    data: {
      name: 'Demo Project',
      slug: 'demo-project',
      organizationId: org.id,
      userId: user.id,
      status: 'ACTIVE',
    },
  });

  console.log('✅ Project created:', project.name);
  console.log('\n🎉 Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

---

## 🔧 تحديث package.json

**إضافة** script في `package.json`:

```json
{
  "scripts": {
    "db:seed": "tsx prisma/seed.ts"
  }
}
```

---

## ✅ التحقق من النجاح

```powershell
# فتح Prisma Studio
pnpm db:studio
# يجب أن يفتح على http://localhost:5555

# التحقق من البيانات
# يجب أن ترى:
# - 1 organization (demo-org)
# - 1 user (demo@odavl.com)
# - 1 project (Demo Project)
```

---

## 🚨 استكشاف الأخطاء

### خطأ: Connection refused
```powershell
# تأكد من تشغيل PostgreSQL
docker ps  # للـ Docker
# أو
Get-Service postgresql*  # للـ Windows Service
```

### خطأ: Authentication failed
```powershell
# تحقق من كلمة المرور في .env.local
# يجب أن تطابق كلمة مرور PostgreSQL
```

### خطأ: Database does not exist
```powershell
# إنشاء database يدوياً
docker exec -it odavl-postgres psql -U postgres -c "CREATE DATABASE odavl_hub;"
```

---

## 📊 التقدم الحالي

- ✅ **TypeScript**: 0 errors (100% نظيف)
- ⏳ **Database**: يتطلب إعداد PostgreSQL
- ⏳ **OAuth**: بعد Database
- ⏳ **Environment Variables**: بعد Database

**التالي**: بعد إتمام Database → Phase 1.2 (OAuth Configuration)

---

## 🎯 الأوامر السريعة

```powershell
# ملخص الإعداد الكامل (Docker)
docker run --name odavl-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=odavl_hub -p 5432:5432 -d postgres:15-alpine

# تحديث .env.local (يدوياً أو آلياً)
# DATABASE_URL="postgresql://postgres:postgres@localhost:5432/odavl_hub?schema=public"

# تطبيق التغييرات
pnpm db:generate
pnpm db:push
pnpm db:seed  # بعد إنشاء prisma/seed.ts

# التحقق
pnpm db:studio
```

---

**ملاحظة هامة**: هذا الملف دليل إرشادي. يتطلب تنفيذ يدوي من المستخدم لأن Docker قد لا يكون مثبتاً.
