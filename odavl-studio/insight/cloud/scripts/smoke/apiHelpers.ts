/**
 * API test helpers for smoke-collective.ts
 */

interface EventData {
    projectId: string;
    timestamp: string;
    error: {
        message: string;
        stack: string[];
        type: string;
        module: string;
        file: string;
        line: number;
        column: number;
    };
    env: {
        runtime: string;
        framework: string;
        versions: { node: string };
    };
    meta: Record<string, unknown>;
}

interface IngestResponse {
    ok: boolean;
    signature: string;
}

interface RecommendResponse {
    ok: boolean;
    hints: Array<{ id: string }>;
}

interface FeedbackResponse {
    ok: boolean;
    confidence: number;
}

/**
 * Test event ingestion
 */
export async function testIngestEvent(baseUrl: string, event: EventData): Promise<IngestResponse> {
    const response = await fetch(`${baseUrl}/api/ingest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(event),
    });
    return await response.json();
}

/**
 * Test getting recommendations
 */
export async function testGetRecommendations(baseUrl: string, signature: string): Promise<RecommendResponse> {
    const response = await fetch(`${baseUrl}/api/recommend?signature=${encodeURIComponent(signature)}`);
    return await response.json();
}

/**
 * Test submitting feedback
 */
export async function testSubmitFeedback(
    baseUrl: string,
    signature: string,
    hintId: string,
    outcome: "success" | "failure"
): Promise<FeedbackResponse> {
    const response = await fetch(`${baseUrl}/api/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signature, hintId, outcome }),
    });
    return await response.json();
}
