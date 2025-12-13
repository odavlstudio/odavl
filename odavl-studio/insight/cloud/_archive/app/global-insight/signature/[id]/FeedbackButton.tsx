"use client";
import { useState } from "react";

export default function FeedbackButton({ hintId, signature }: { hintId: string; signature: string }) {
    const [status, setStatus] = useState<string>("");

    const handleFeedback = async (outcome: "success" | "fail") => {
        setStatus("sending...");
        try {
            const res = await fetch("/api/feedback", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ signature, hintId, outcome }),
            });
            const data = await res.json();
            if (data.ok) {
                setStatus(`✓ Recorded (confidence: ${(data.confidence * 100).toFixed(0)}%)`);
            } else {
                setStatus(`✗ Error: ${data.error}`);
            }
        } catch (err) {
            setStatus("✗ Network error");
        }
    };

    return (
        <div className="flex gap-2 items-center">
            <button
                onClick={() => handleFeedback("success")}
                className="px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
            >
                Worked
            </button>
            <button
                onClick={() => handleFeedback("fail")}
                className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
            >
                Failed
            </button>
            {status && <span className="text-xs text-gray-600">{status}</span>}
        </div>
    );
}
