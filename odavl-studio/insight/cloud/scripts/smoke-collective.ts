// ODAVL Insight Phase 12 – Smoke
import { logger } from '../src/utils/logger';
import { ReportBuilder } from './smoke/reportBuilder';
import { testIngestEvent, testGetRecommendations, testSubmitFeedback } from './smoke/apiHelpers';

const baseUrl = process.env.INSIGHT_CLOUD_URL || "http://localhost:3000";

async function smokeTest() {
    const timestamp = Date.now();
    const report = new ReportBuilder();

    report.addHeader("ODAVL Insight Cloud Collective Intelligence Smoke Test", timestamp);

    // 1. Test event ingestion
    const sampleEvent = createSampleEvent();
    report.addSection("1. Ingest Event");
    report.addJsonBlock(sampleEvent);

    const ingestData = await testIngestEvent(baseUrl, sampleEvent);
    report.addText("**Response:**");
    report.addJsonBlock(ingestData);

    if (!ingestData.ok) {
        report.addError("Ingest failed");
        report.save(timestamp);
        process.exit(1);
    }

    // 2. Test recommendations
    report.addSection("2. Get Recommendations");
    const recData = await testGetRecommendations(baseUrl, ingestData.signature);
    report.addText("**Response:**");
    report.addJsonBlock(recData);

    if (!recData.ok || recData.hints.length === 0) {
        report.addError("Recommend failed");
        report.save(timestamp);
        process.exit(1);
    }

    // 3. Test feedback submission
    report.addSection("3. Submit Feedback (success)");
    const feedbackData = await testSubmitFeedback(baseUrl, ingestData.signature, recData.hints[0].id, "success");
    report.addText("**Response:**");
    report.addJsonBlock(feedbackData);

    if (!feedbackData.ok) {
        report.addError("Feedback failed");
        report.save(timestamp);
        process.exit(1);
    }

    // 4. Build summary
    report.addSection("4. Summary");
    report.addBullet(`Signature: \`${ingestData.signature}\``);
    report.addBullet(`Recommendations: ${recData.hints.length}`);
    report.addBullet(`Feedback confidence: ${(feedbackData.confidence * 100).toFixed(0)}%`);
    report.addSuccess("All smoke tests passed");

    const reportPath = report.save(timestamp);
    logger.debug(`✅ Smoke test passed. Report: ${reportPath}`);
}

function createSampleEvent() {
    return {
        projectId: "smoke-test",
        timestamp: new Date().toISOString(),
        error: {
            message: "Cannot read property 'foo' of undefined",
            stack: [
                "at smoke (/test.js:10:5)",
                "at main (/test.js:20:3)",
            ],
            type: "TypeError",
            module: "test",
            file: "/test.js",
            line: 10,
            column: 5,
        },
        env: {
            runtime: "node",
            framework: "jest",
            versions: { node: "18.0.0" },
        },
        meta: {},
    };
}

smokeTest().catch((err) => {
    logger.error("Smoke test error:", err);
    process.exit(1);
});
