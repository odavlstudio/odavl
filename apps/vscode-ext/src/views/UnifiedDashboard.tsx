

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { requestDashboardData } from './UnifiedDashboardBridge';


// Types are now imported from the bridge
type DashboardData = Awaited<ReturnType<typeof requestDashboardData>>;

const TABS = [
    { key: 'overview', label: 'System Overview', icon: '🧠' },
    { key: 'cycle', label: 'Run Cycle', icon: '⚙️' },
    { key: 'analytics', label: 'Analytics', icon: '📊' },
    { key: 'config', label: 'Config', icon: '🛠️' },
];

const tabVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 }
};

const UnifiedDashboard: React.FC = () => {

    const [activeTab, setActiveTab] = useState('overview');
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        requestDashboardData().then((d) => {
            setData(d);
            setLoading(false);
        });
    }, []);

    // Tab content renderers
    const renderOverview = () => (
        <motion.div key="overview" {...tabVariants} initial="initial" animate="animate" exit="exit" className="tw-grid tw-grid-cols-3 tw-gap-6">
            <div className="tw-bg-odavl-accent tw-text-white tw-rounded tw-p-6 tw-shadow">
                <div className="tw-text-lg tw-font-bold">Trust Score</div>
                <div className="tw-text-3xl tw-font-extrabold tw-mt-2">{data?.trustScore ?? '—'}%</div>
                <div className="tw-mt-2 tw-text-sm">Quality Trend: <span className="tw-font-semibold">{data?.qualityTrend ?? '—'}</span></div>
                <div className="tw-mt-2 tw-text-xs">Last Run: {data?.lastRun ?? '—'}</div>
            </div>
            <div className="tw-bg-white tw-rounded tw-p-6 tw-shadow tw-border tw-border-odavl-accent">
                <div className="tw-text-lg tw-font-bold">System Metrics</div>
                <div className="tw-mt-2">Total Runs: <span className="tw-font-semibold">{data?.totalRuns ?? '—'}</span></div>
                <div className="tw-mt-2">Evidence Files: <span className="tw-font-semibold">{data?.evidenceCount ?? '—'}</span></div>
                <div className="tw-mt-2 tw-text-xs tw-text-odavl-accent">Status: Active</div>
            </div>
            <div className="tw-bg-white tw-rounded tw-p-6 tw-shadow tw-border tw-border-odavl-accent">
                <div className="tw-text-lg tw-font-bold">AI Insights</div>
                <ul className="tw-mt-2 tw-list-disc tw-list-inside">
                    {data?.aiInsights?.map((ins) => (
                        <li key={ins.type + ins.message} className="tw-mb-1 tw-text-odavl-accent">{ins.message}</li>
                    ))}
                </ul>
            </div>
        </motion.div>
    );

    const renderCycle = () => (
        <motion.div key="cycle" {...tabVariants} initial="initial" animate="animate" exit="exit">
            <div className="tw-bg-white tw-rounded tw-p-6 tw-shadow tw-border tw-border-odavl-accent">
                <div className="tw-text-lg tw-font-bold">ODAVL Cycle Execution</div>
                <div className="tw-mt-4 tw-bg-gray-100 tw-rounded tw-p-4 tw-h-48 tw-overflow-y-auto tw-font-mono tw-text-xs">
                    {data?.logs?.map((log) => {
                        let bg = 'tw-bg-blue-100', border = 'tw-border-blue-500';
                        if (log.type === 'success') { bg = 'tw-bg-green-100'; border = 'tw-border-green-500'; }
                        else if (log.type === 'warning') { bg = 'tw-bg-yellow-100'; border = 'tw-border-yellow-500'; }
                        return (
                            <div key={log.type + log.text} className={`tw-mb-2 tw-p-2 tw-rounded ${bg} tw-border-l-4 ${border}`}>{log.text}</div>
                        );
                    })}
                </div>
                <button className="tw-mt-4 tw-bg-odavl-accent tw-text-white tw-px-4 tw-py-2 tw-rounded hover:tw-bg-odavl-accent-dark tw-transition" onClick={() => alert('Run ODAVL Cycle (hook up to CLI)')}>▶️ Run ODAVL Cycle</button>
            </div>
        </motion.div>
    );

    const renderAnalytics = () => (
        <motion.div key="analytics" {...tabVariants} initial="initial" animate="animate" exit="exit" className="tw-grid tw-grid-cols-2 tw-gap-6">
            <div className="tw-bg-white tw-rounded tw-p-6 tw-shadow tw-border tw-border-odavl-accent">
                <div className="tw-text-lg tw-font-bold">Quality Trend (Last 7 Days)</div>
                <div className="tw-mt-4">
                    {/* Simple bar chart (replace with chart lib for real) */}
                    <div className="tw-flex tw-items-end tw-h-32 tw-gap-2">
                        {data?.analytics?.quality?.map((v, i) => (
                            <div key={data.analytics.labels[i] + v} className="tw-bg-odavl-accent tw-rounded tw-w-6" style={{ height: `${v * 8}px` }} title={data.analytics.labels[i]}></div>
                        ))}
                    </div>
                    <div className="tw-flex tw-justify-between tw-mt-2 tw-text-xs tw-text-gray-500">
                        {data?.analytics?.labels?.map((l) => (
                            <span key={l}>{l}</span>
                        ))}
                    </div>
                </div>
            </div>
            <div className="tw-bg-white tw-rounded tw-p-6 tw-shadow tw-border tw-border-odavl-accent">
                <div className="tw-text-lg tw-font-bold">Forecast</div>
                <div className="tw-mt-4 tw-text-odavl-accent tw-font-semibold">Stable improvement expected</div>
                <div className="tw-mt-2 tw-text-xs tw-text-gray-500">Powered by ODAVL Intelligence</div>
            </div>
        </motion.div>
    );

    const renderConfig = () => (
        <motion.div key="config" {...tabVariants} initial="initial" animate="animate" exit="exit" className="tw-grid tw-grid-cols-2 tw-gap-6">
            <div className="tw-bg-white tw-rounded tw-p-6 tw-shadow tw-border tw-border-odavl-accent">
                <div className="tw-text-lg tw-font-bold">Safety Gates</div>
                <div className="tw-mt-2">Status: <span className="tw-text-green-600 tw-font-semibold">Active</span></div>
                <div className="tw-mt-2">Policy Compliance: <span className="tw-text-green-600 tw-font-semibold">Enforced</span></div>
            </div>
            <div className="tw-bg-white tw-rounded tw-p-6 tw-shadow tw-border tw-border-odavl-accent">
                <div className="tw-text-lg tw-font-bold">System Configuration</div>
                <div className="tw-mt-2">Recipe Trust: <span className="tw-text-blue-600 tw-font-semibold">Learning</span></div>
                <div className="tw-mt-2">File Watchers: <span className="tw-text-green-600 tw-font-semibold">Monitoring</span></div>
            </div>
        </motion.div>
    );

    const tabContent = () => {
        if (loading) return <div className="tw-p-8 tw-text-center tw-text-odavl-accent">Loading...</div>;
        switch (activeTab) {
            case 'overview': return renderOverview();
            case 'cycle': return renderCycle();
            case 'analytics': return renderAnalytics();
            case 'config': return renderConfig();
            default: return null;
        }
    };

    return (
        <div className="tw-bg-gray-50 tw-min-h-screen tw-p-8 tw-font-sans">
            <div className="tw-flex tw-items-center tw-mb-6">
                <span className="tw-text-3xl tw-font-extrabold tw-text-odavl-accent tw-mr-4">🎛️ ODAVL Dashboard</span>
                <div className="tw-flex tw-gap-2">
                    {TABS.map((tab) => (
                        <button
                            key={tab.key}
                            className={`tw-px-4 tw-py-2 tw-rounded tw-font-semibold tw-transition tw-border-b-4 ${activeTab === tab.key ? 'tw-bg-odavl-accent tw-text-white tw-border-odavl-accent' : 'tw-bg-white tw-text-odavl-accent tw-border-transparent hover:tw-bg-odavl-accent/10'}`}
                            onClick={() => setActiveTab(tab.key)}
                        >
                            <span className="tw-mr-2">{tab.icon}</span>{tab.label}
                        </button>
                    ))}
                </div>
            </div>
            <AnimatePresence mode="wait">
                {tabContent()}
            </AnimatePresence>
        </div>
    );
};

export default UnifiedDashboard;
