// ODAVL Insight Phase 12 – CLI
export async function recommendCommand(signature: string) {
    const baseUrl = process.env.INSIGHT_CLOUD_URL || "http://localhost:3000";

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const res = await fetch(`${baseUrl}/api/recommend?signature=${encodeURIComponent(signature)}`, {
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        const data = await res.json();

        if (!data.ok) {
            console.error(`Error: ${data.error}`);
            process.exit(1);
        }

        console.log(`\n🔍 Recommendations for signature: ${signature.slice(0, 16)}...`);
        console.log(`\n${data.rationale}\n`);

        for (let i = 0; i < data.hints.length; i++) {
            const hint = data.hints[i];
            console.log(`${i + 1}. [${(hint.confidence * 100).toFixed(0)}%] ${hint.hint}`);
            console.log(`   Source: ${hint.source}, ID: ${hint.id}\n`);
        }
    } catch (err) {
        console.error(`Network error: ${err}`);
        process.exit(1);
    }
}
