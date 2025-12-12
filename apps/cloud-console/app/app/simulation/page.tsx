"use client";

import { useState } from "react";
import Card, { CardHeader, CardBody } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { generateMetadata } from "@/components/seo/Metadata";

export const metadata = generateMetadata({
  title: "Guardian Simulation",
  description: "Run complete ODAVL cycle: Observe → Decide → Act → Verify → Learn",
  canonical: "/app/simulation",
  noindex: true,
});

export default function SimulationPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  async function start() {
    setLoading(true);
    const res = await fetch("/api/simulation/run", {
      method: "POST",
      body: JSON.stringify({ projectPath: process.cwd() }),
    });
    const json = await res.json();
    setResult(json);
    setLoading(false);
  }

  return (
    <div className="px-8 py-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">ODAVL Guardian Simulation</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Run complete O-D-A-V-L cycle: Observe → Decide → Act → Verify → Learn
        </p>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Simulation Control</h2>
        </CardHeader>
        <CardBody>
          <Button 
            onClick={start} 
            disabled={loading}
            variant="primary"
            size="lg"
            className="w-full sm:w-auto"
          >
            {loading ? "⏳ Running Simulation..." : "▶️ Start Simulation"}
          </Button>
          </Button>

          {result && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Simulation Results</h3>
              <pre className="bg-gray-900 dark:bg-black text-green-400 p-5 rounded-lg text-xs overflow-auto border border-gray-700 font-mono">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
