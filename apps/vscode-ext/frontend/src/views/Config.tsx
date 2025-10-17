
import React, { useEffect, useState } from 'react';

const statusIcon = (status: string) => {
  if (status === 'pass') return <span className="text-green-500">✅</span>;
  if (status === 'warn') return <span className="text-yellow-500">⚠️</span>;
  return <span className="text-red-500">❌</span>;
};


const ENTERPRISE_DEFAULTS = {
  enableSecurityScan: true,
  blockOnCritical: false,
  includeGatesInReports: true,
  riskBudget: 75,
};

type EnterpriseConfig = typeof ENTERPRISE_DEFAULTS;

const Config: React.FC = () => {
  const [gates, setGates] = useState<any[]>([]);
  const [compliance, setCompliance] = useState(0);
  const [riskScore, setRiskScore] = useState(0);
  const [enterprise, setEnterprise] = useState<EnterpriseConfig>(ENTERPRISE_DEFAULTS);

  // Debounce timer for slider
  const sliderTimeout = React.useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.origin !== 'null' && event.origin !== globalThis.origin) return;
      const msg = event.data;
      if (msg?.type === 'governanceUpdate') {
        setGates(msg.payload.gates || []);
        setCompliance(msg.payload.compliance || 0);
        setRiskScore(msg.payload.riskScore || 0);
      }
      if (msg?.type === 'enterpriseConfigUpdate') {
        setEnterprise({ ...ENTERPRISE_DEFAULTS, ...msg.payload });
      }
    }
    globalThis.addEventListener('message', handleMessage);
    const vscode = (globalThis as any).acquireVsCodeApi?.();
    if (vscode) {
      vscode.postMessage({ type: 'refreshGovernance' });
      vscode.postMessage({ type: 'refreshEnterpriseConfig' });
    }
    return () => globalThis.removeEventListener('message', handleMessage);
  }, []);

  const updateConfig = (updated: Partial<EnterpriseConfig>) => {
    const newConfig = { ...enterprise, ...updated };
    setEnterprise(newConfig);
    const vscode = (globalThis as any).acquireVsCodeApi?.();
    if (vscode) {
      vscode.postMessage({ type: 'updateEnterpriseConfig', payload: newConfig });
    }
  };

  return (
    <div className="p-8 space-y-8">
      <div>
        <h2 className="text-xl font-bold mb-2">Governance Gates</h2>
        <div className="mb-2 flex items-center gap-4">
          <div className="w-64 bg-gray-200 rounded-full h-4 overflow-hidden">
            <div className="bg-green-500 h-4 rounded-full" style={{ width: `${compliance}%` }} />
          </div>
          <span className="font-semibold">Compliance: {compliance.toFixed(1)}%</span>
          <span className="ml-6">Risk Score: <span className="font-bold text-red-500">{riskScore.toFixed(1)}</span></span>
          <button className="ml-6 px-3 py-1 bg-blue-600 text-white rounded" onClick={() => {
            const vscode = (globalThis as any).acquireVsCodeApi?.();
            if (vscode) {
              vscode.postMessage({ type: 'refreshGovernance' });
            }
          }}>Re-scan Policies</button>
        </div>
        <ul className="divide-y divide-gray-200 bg-white rounded shadow">
          {gates.length === 0 && <li className="p-4 text-gray-500">No gates loaded (missing or invalid policy/gates file).</li>}
          {gates.map((g: any) => (
            <li key={g.name} className="flex items-center justify-between px-4 py-2">
              <span className="font-medium">{g.name}</span>
              <span className="text-sm text-gray-500">{g.condition}</span>
              {statusIcon(g.status)}
              <span className="text-xs text-gray-400 ml-2">Risk: {g.riskWeight}</span>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h2 className="text-xl font-bold mb-2">Enterprise Security Controls</h2>
        <div className="space-y-4 bg-white dark:bg-gray-900 rounded p-4 shadow">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={enterprise.enableSecurityScan}
              onChange={() => updateConfig({ enableSecurityScan: !enterprise.enableSecurityScan })}
            />
            <span className="font-medium">Enable Security Scan on Every Cycle</span>
            <span className="ml-2 text-xs text-gray-500" title="Automatically perform a vulnerability scan before each ODAVL run.">🛈</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={enterprise.blockOnCritical}
              onChange={() => updateConfig({ blockOnCritical: !enterprise.blockOnCritical })}
            />
            <span className="font-medium">Block Execution if Critical Vulnerability Found</span>
            <span className="ml-2 text-xs text-gray-500" title="Prevent the ODAVL cycle from running if critical vulnerabilities exist.">🛈</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={enterprise.includeGatesInReports}
              onChange={() => updateConfig({ includeGatesInReports: !enterprise.includeGatesInReports })}
            />
            <span className="font-medium">Include Gates in Attestation Reports</span>
            <span className="ml-2 text-xs text-gray-500" title="Attach gate compliance results to each verify-report.md.">🛈</span>
          </label>
          <div className="flex items-center gap-4">
            <span className="font-medium">Risk Budget</span>
            <input
              type="range"
              min={0}
              max={100}
              value={enterprise.riskBudget}
              onChange={e => {
                const val = Number(e.target.value);
                setEnterprise(prev => ({ ...prev, riskBudget: val }));
                if (sliderTimeout.current) clearTimeout(sliderTimeout.current);
                sliderTimeout.current = setTimeout(() => {
                  updateConfig({ riskBudget: val });
                }, 300);
              }}
              className="w-48"
            />
            <span className="ml-2 font-mono text-blue-600">{enterprise.riskBudget}</span>
            <span className="ml-2 text-xs text-gray-500" title="Defines the acceptable risk tolerance threshold.">🛈</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Config;
