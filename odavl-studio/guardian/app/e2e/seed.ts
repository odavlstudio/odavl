import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seed() {
    console.log('🌱 Seeding E2E...');
    try {
        await prisma.organization.deleteMany({
            where: { name: { startsWith: 'E2E Test' } }
        });

        const org = await prisma.organization.create({
            data: {
                name: 'E2E Test Organization',
                slug: 'e2e-test-org',
                tier: 'pro',
                status: 'active',
                members: {
                    create: {
                        email: 'admin@e2e.local',
                        name: 'Admin E2E',
                        role: 'admin',
                        password: await bcrypt.hash('test1234', 10)
                    }
                },
                projects: {
                    create: {
                        name: 'E2E Test Project',
                        url: 'https://e2e-test.local'
                    }
                }
            }
        });

        console.log(`✅ Seeded: ${org.name}`);
    } catch (error) {
        console.error('❌ Error:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

seed().catch((e) => {
    console.error(e);
    process.exit(1);
});
