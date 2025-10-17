

import React, { useEffect, useState } from "react";
// @ts-ignore: moduleResolution workaround for @shadcn/ui
// Minimal local UI components to replace @shadcn/ui
const Card = ({ children, ...props }: React.PropsWithChildren<any>) => <div className="bg-white dark:bg-gray-900 rounded-lg p-4 shadow" {...props}>{children}</div>;
const CardHeader = ({ children }: React.PropsWithChildren<any>) => <div className="font-semibold mb-2">{children}</div>;
const CardContent = ({ children }: React.PropsWithChildren<any>) => <div className="text-base">{children}</div>;
const CardTitle = ({ children }: React.PropsWithChildren<any>) => <div className="text-lg font-bold">{children}</div>;
const Button = ({ children, variant, size, ...props }: any) => {
  let variantClass = "bg-blue-500 text-white";
  if (variant === "ghost") variantClass = "bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800";
  else if (variant === "outline") variantClass = "border border-gray-300 dark:border-gray-700";
  else if (variant === "secondary") variantClass = "bg-gray-200 dark:bg-gray-700";
  let sizeClass = "px-4 py-2";
  if (size === "sm") sizeClass = "px-2 py-1 text-sm";
  else if (size === "icon") sizeClass = "p-1";
  return (
    <button className={`btn ${variantClass} ${sizeClass} rounded`} {...props}>{children}</button>
  );
};
const Tooltip = ({ content, children }: { content: string, children: React.ReactNode }) => (
  <span className="relative group">
    {children}
    <span className="absolute left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none z-10 whitespace-nowrap">{content}</span>
  </span>
);
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, Tooltip as ChartTooltip, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from "recharts";
import { FileText, Copy } from "lucide-react";


// --- Type Definitions ---
interface PhaseMetric {
  phase: string;
  duration: number;
  status: string;
}

interface TelemetryEntry {
  timestamp: string;
  metrics: {
    totalDuration: number;
    phases: PhaseMetric[];
  };
  riskScore: number;
  summary: string;
  result?: string;
  phases?: { [key: string]: { duration: number } };
}

interface ReportItem {
  file: string;
  date: string;
  path: string;
}





const phaseNames = ['observe', 'decide', 'act', 'verify', 'learn'];
const COLORS = ['#0ea5e9', '#f59e42', '#22c55e', '#a78bfa', '#f43f5e'];


const Insights: React.FC = () => {
  const [telemetry, setTelemetry] = useState<TelemetryEntry[]>([]);
  const [reports, setReports] = useState<string[]>([]);
  // Removed unused selectedRuns and compareResult state

  useEffect(() => {
    // Request initial telemetry and reports from backend
    if ((globalThis as any)?.acquireVsCodeApi) {
      const vscode = (globalThis as any).acquireVsCodeApi();
      vscode.postMessage({ type: 'requestTelemetry' });
      vscode.postMessage({ type: 'requestReports' });
    }
    function handleMessage(event: MessageEvent) {
      if ((event as any).origin && (event as any).origin !== 'vscode-webview://') return;
      const msg = (event as any).data;
      if (msg?.type === 'telemetryUpdate') {
        setTelemetry(Array.isArray(msg.payload) ? msg.payload : []);
      }
      if (msg?.type === 'reportsUpdate') {
        setReports(Array.isArray(msg.payload) ? msg.payload : []);
      }
    }
    globalThis.addEventListener('message', handleMessage as EventListener);
    return () => globalThis.removeEventListener('message', handleMessage as EventListener);
  }, []);

  // Aggregate metrics

  const totalCycles = telemetry.length;
  const avgRisk = totalCycles ? (telemetry.reduce((a, b) => a + (b.riskScore || 0), 0) / totalCycles).toFixed(1) : 0;
  const avgDurations: { [key: string]: string } = {};
  for (const phase of phaseNames) {
    avgDurations[phase] = totalCycles ? (telemetry.reduce((a, b) => a + (b.phases?.[phase]?.duration || 0), 0) / totalCycles).toFixed(1) : "0";
  }
  const avgTotalDuration = totalCycles ? (telemetry.reduce((a, b) => a + Object.values(b.phases || {}).reduce((s, p) => s + (p.duration || 0), 0), 0) / totalCycles).toFixed(1) : "0";
  const successCount = telemetry.filter((t: TelemetryEntry) => t.result === 'success').length;
  const failCount = totalCycles - successCount;
  const successRate = totalCycles ? ((successCount / totalCycles) * 100).toFixed(1) : "0";

  // Chart data
  const lineData = telemetry.map(t => ({
    timestamp: t.timestamp.slice(11, 16),
    total: Object.values(t.phases || {}).reduce((s, p) => s + (p.duration || 0), 0),
    risk: t.riskScore || 0
  }));
  const barData = phaseNames.map((phase, i) => ({
    phase,
    avg: avgDurations[phase],
    color: COLORS[i]
  }));
  const pieData = [
    { name: 'Success', value: successCount },
    { name: 'Failure', value: failCount }
  ];

  // Smart insights
  let smartText = '';
  if (totalCycles >= 2) {
    const last = telemetry[totalCycles - 1];
    const prev = telemetry[totalCycles - 2];
    const verifyDelta = prev.phases?.verify && last.phases?.verify ? (((prev.phases.verify.duration - last.phases.verify.duration) / prev.phases.verify.duration) * 100).toFixed(1) : null;
    const riskDelta = prev.riskScore && last.riskScore ? (((prev.riskScore - last.riskScore) / prev.riskScore) * 100).toFixed(1) : null;
    smartText = `Verify phase improved by ${verifyDelta}% over last run.\nRisk Score changed from ${prev.riskScore} → ${last.riskScore} (${riskDelta}%).\nOverall stability trend ${last.riskScore < prev.riskScore ? '✅ Improving' : '⚠️ Needs attention'}.`;
  }

  return (
    <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6 dark:bg-black">
      {/* Overview Cards */}
      <div className="grid grid-cols-2 gap-4 col-span-2">
        <Card>
          <CardHeader><CardTitle>Avg Duration (ms)</CardTitle></CardHeader>
          <CardContent>{avgTotalDuration}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Success Rate (%)</CardTitle></CardHeader>
          <CardContent>{successRate}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Avg Risk Score</CardTitle></CardHeader>
          <CardContent>{avgRisk}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Total Cycles</CardTitle></CardHeader>
          <CardContent>{totalCycles}</CardContent>
        </Card>
      </div>
      {/* Charts */}
      <div className="bg-white dark:bg-gray-900 rounded-lg p-4 shadow col-span-1">
        <div className="font-semibold mb-2">Total Duration Over Time</div>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={lineData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="timestamp" />
            <YAxis />
            <ChartTooltip />
            <Line type="monotone" dataKey="total" stroke="#0ea5e9" />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="bg-white dark:bg-gray-900 rounded-lg p-4 shadow col-span-1">
        <div className="font-semibold mb-2">Average Phase Durations</div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={barData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="phase" />
            <YAxis />
            <ChartTooltip />
            <Bar dataKey="avg">
              {barData.map((entry) => (
                <Cell key={entry.phase} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="bg-white dark:bg-gray-900 rounded-lg p-4 shadow col-span-1">
        <div className="font-semibold mb-2">Success vs Failure</div>
        <ResponsiveContainer width="100%" height={180}>
          <PieChart>
            <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} label>
              <Cell fill="#22c55e" />
              <Cell fill="#f43f5e" />
            </Pie>
            <Legend />
            <ChartTooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
      {/* Reports Section */}
      <div className="col-span-2">
        <Card>
          <CardHeader><CardTitle>Recent Reports</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {reports.map((r: string) => (
                <li key={r} className="flex items-center justify-between">
                  <Button variant="ghost" size="sm" onClick={() => {
                    if ((globalThis as any)?.acquireVsCodeApi) {
                      const vscode = (globalThis as any).acquireVsCodeApi();
                      vscode.postMessage({ type: 'openReport', file: r });
                    }
                  }}>
                    <FileText className="mr-2 h-4 w-4" />{r}
                  </Button>
                  <Tooltip content="Copy report name">
                    <Button variant="outline" size="icon" onClick={() => navigator.clipboard.writeText(r)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </Tooltip>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
      {/* Smart Insights */}
      <div className="col-span-2">
        <Card>
          <CardHeader><CardTitle>Smart Insights</CardTitle></CardHeader>
          <CardContent>
            <pre className="text-sm whitespace-pre-line">{smartText}</pre>
          </CardContent>
        </Card>
      </div>
      {/* Export & Compare */}
      <div className="col-span-2 flex gap-4 mt-4">
        <Button variant="default" onClick={() => {
          if ((globalThis as any)?.acquireVsCodeApi) {
            const vscode = (globalThis as any).acquireVsCodeApi();
            vscode.postMessage({ type: 'exportReports' });
          }
        }}>Export All Reports</Button>
        <Button variant="secondary" onClick={() => {
          if ((globalThis as any)?.acquireVsCodeApi) {
            const vscode = (globalThis as any).acquireVsCodeApi();
            vscode.postMessage({ type: 'compareRuns' });
          }
        }}>Compare Runs</Button>
      </div>
    </div>
  );
};

export default Insights;
