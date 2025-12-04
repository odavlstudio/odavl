// ODAVL Insight Phase 12 – Accuracy Gate
import { PrismaClient } from "@prisma/client";
import { logger } from '../src/utils/logger';

const prisma = new PrismaClient();

async function checkAccuracy() {
    const recs = await prisma.fixRecommendation.findMany();

    const totalSuccess = recs.reduce((sum: number, r: any) => sum + r.successCount, 0);
    const totalFail = recs.reduce((sum: number, r: any) => sum + r.failCount, 0);
    const total = totalSuccess + totalFail;

    if (total === 0) {
        logger.debug("⚠️  No feedback data available yet");
        process.exit(0);
    }

    const accuracy = totalSuccess / total;

    logger.debug(`\n📊 Global Accuracy: ${(accuracy * 100).toFixed(1)}%`);
    logger.debug(`   Success: ${totalSuccess}, Fail: ${totalFail}\n`);

    if (accuracy < 0.4) {
        logger.debug("🔴 RED: Accuracy below 0.4 threshold");
        await prisma.$disconnect();
        process.exit(1);
    } else if (accuracy < 0.6) {
        logger.debug("🟡 YELLOW: Accuracy below 0.6 threshold (warning)");
        await prisma.$disconnect();
        process.exit(0);
    } else {
        logger.debug("🟢 GREEN: Accuracy meets threshold");
        await prisma.$disconnect();
        process.exit(0);
    }
}

checkAccuracy().catch((err) => {
    logger.error("Error checking accuracy:", err);
    process.exit(1);
});
