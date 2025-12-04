import fs from "node:fs/promises";
import path from "node:path";

interface ReportData {
    project: string;
    summary: Record<string, unknown>;
    metrics: Record<string, unknown>;
    errors?: Array<{
        type: string;
        message: string;
        file?: string;
        line?: number;
        count: number;
    }>;
}

async function uploadInsightReports() {
    const apiUrl = process.env.INSIGHT_CLOUD_URL || "http://localhost:3000";
    const apiKey = process.env.INSIGHT_API_KEY;

    if (!apiKey) {
        console.error("❌ INSIGHT_API_KEY is not set. Cannot upload reports.");
        process.exit(1);
    }

    const reportsDir = path.join(process.cwd(), ".odavl/insight/logs");

    try {
        const files = await fs.readdir(reportsDir);
        const jsonFiles = files.filter((f) => f.endsWith(".json"));

        if (jsonFiles.length === 0) {
            console.log("ℹ️  No reports found in .odavl/insight/logs/");
            return;
        }

        console.log(`📤 Uploading ${jsonFiles.length} report(s)...`);

        for (const file of jsonFiles) {
            const filePath = path.join(reportsDir, file);
            const content = await fs.readFile(filePath, "utf8");
            const logs = JSON.parse(content);

            // Transform logs to report format
            const reportData: ReportData = {
                project: process.env.PROJECT_NAME || "odavl",
                summary: {
                    date: file.replace(".json", ""),
                    totalErrors: logs.length,
                    description: `Daily error log for ${file.replace(".json", "")}`,
                },
                metrics: {
                    errorCount: logs.length,
                    categories: logs.reduce((acc: Record<string, number>, log: any) => {
                        const cat = log.analysis?.category || "Unknown";
                        acc[cat] = (acc[cat] || 0) + 1;
                        return acc;
                    }, {}),
                },
                errors: logs.map((log: any) => ({
                    type: log.type || "Unknown",
                    message: log.message || "No message",
                    file: log.file,
                    line: log.line,
                    count: log.analysis?.count || 1,
                })),
            };

            const response = await fetch(`${apiUrl}/api/ingest`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${apiKey}`,
                },
                body: JSON.stringify(reportData),
            });

            if (response.ok) {
                const result = await response.json();
                console.log(`✅ Uploaded ${file} — Report ID: ${result.reportId}`);
            } else {
                const error = await response.text();
                console.error(`❌ Failed to upload ${file}:`, error);
            }
        }

        console.log("✅ All reports uploaded successfully!");
    } catch (error) {
        console.error("❌ Error during upload:", error);
        process.exit(1);
    }
}

uploadInsightReports();
