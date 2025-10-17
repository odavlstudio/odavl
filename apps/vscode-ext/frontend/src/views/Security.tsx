import React, { useState } from "react";
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
import { PieChart, Pie, Cell, Legend, Tooltip as ChartTooltip } from "recharts";
import { ShieldCheck, ShieldX, AlertTriangle } from "lucide-react";

interface Vulnerability {
    pkg: string;
    severity: "low" | "medium" | "high" | "critical";
    id?: string;
    desc?: string;
}
interface SecurityReport {
    scanned: number;
    vulnerabilities: Vulnerability[];
    timestamp: string;
}
interface GovernanceGate {
    name: string;
    condition: string;
    status: "pass" | "fail" | "warn";
    riskWeight: number;
}
interface VerificationSummary {
    gates: GovernanceGate[];
    compliance: number;
}

const COLORS = ["#22c55e", "#f59e42", "#f43f5e", "#a78bfa"];
const SEVERITIES = ["critical", "high", "medium", "low"];

const Security: React.FC = () => {
    const [report, setReport] = useState<SecurityReport | null>(null);
    const [gates, setGates] = useState<VerificationSummary | null>(null);

    React.useEffect(() => {
        function handleMessage(event: any) {
            // Only accept messages from the same origin or trusted sources
            if (globalThis.window !== undefined && event.origin && event.origin !== globalThis.window.origin) return;
            if (event.data?.type === "securityReport") {
                setReport(event.data.payload.report);
                setGates(event.data.payload.gates);
            }
        }
        globalThis.addEventListener("message", handleMessage);
        return () => globalThis.removeEventListener("message", handleMessage);
    }, []);

    const vulnCounts = SEVERITIES.map(sev => ({
        name: sev.charAt(0).toUpperCase() + sev.slice(1),
        value: report ? report.vulnerabilities.filter(v => v.severity === sev).length : 0
    }));
    const totalVulns = report ? report.vulnerabilities.length : 0;
    const compliance = gates ? gates.compliance : 100;

    return (
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6 dark:bg-black">
            <div className="grid grid-cols-2 gap-4 col-span-2">
                <Card>
                    <CardHeader><CardTitle>Total Packages</CardTitle></CardHeader>
                    <CardContent>{report ? report.scanned : "-"}</CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Vulnerabilities</CardTitle></CardHeader>
                    <CardContent>{totalVulns}</CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Compliance %</CardTitle></CardHeader>
                    <CardContent>{compliance}</CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Last Scan</CardTitle></CardHeader>
                    <CardContent>{report ? new Date(report.timestamp).toLocaleString() : "-"}</CardContent>
                </Card>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-lg p-4 shadow col-span-1">
                <div className="font-semibold mb-2">Vulnerability Severity</div>
                <PieChart width={220} height={180}>
                    <Pie data={vulnCounts} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} label>
                        {vulnCounts.map((entry, i) => <Cell key={entry.name} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Legend />
                    <ChartTooltip />
                </PieChart>
            </div>
            <div className="col-span-1">
                <div className="font-semibold mb-2">Gates Evaluation</div>
                <table className="min-w-full text-sm">
                    <thead><tr><th>Gate</th><th>Status</th><th>Condition</th></tr></thead>
                    <tbody>
                        {gates?.gates.map(g => {
                            let statusIcon;
                            if (g.status === "pass") {
                                statusIcon = <ShieldCheck className="text-green-500 inline" />;
                            } else if (g.status === "warn") {
                                statusIcon = <AlertTriangle className="text-yellow-500 inline" />;
                            } else {
                                statusIcon = <ShieldX className="text-red-500 inline" />;
                            }
                            return (
                                <tr key={g.name}>
                                    <td>{g.name}</td>
                                    <td>{statusIcon}</td>
                                    <td>{g.condition}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            <div className="col-span-2 flex gap-4 mt-4">
                <Button variant="default" onClick={() => {
                    if ((globalThis as any).acquireVsCodeApi) {
                        const vscode = (globalThis as any).acquireVsCodeApi();
                        vscode.postMessage({ type: "runSecurityScan" });
                    }
                }}>Run Security Scan</Button>
                <Button variant="secondary" onClick={() => {
                    if ((globalThis as any).acquireVsCodeApi) {
                        const vscode = (globalThis as any).acquireVsCodeApi();
                        vscode.postMessage({ type: "openLatestAttestation" });
                    }
                }}>Open Latest Report</Button>
            </div>
        </div>
    );
};

export default Security;
