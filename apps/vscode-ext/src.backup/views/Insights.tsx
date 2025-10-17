
import { useEffect, useState } from 'react';
import { isTrustedMessage } from '../utils/isTrustedMessage';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Tooltip, ResponsiveContainer, Cell, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Card } from '../components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import type { Metric, InsightsSummary } from '../types/insights';


export default function Insights() {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [summary, setSummary] = useState<InsightsSummary>({ successRate: 0, totalRuns: 0, avgDuration: '' });
  const [showCharts, setShowCharts] = useState(false);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (!isTrustedMessage(event)) return;
      if (event.data.type === 'cycleComplete') {
        const data = event.data.data || {};
        setMetrics(Array.isArray(data.metrics) ? data.metrics : []);
        setSummary({
          successRate: data.successRate ?? 0,
          totalRuns: data.totalRuns ?? 0,
          avgDuration: data.avgDuration ?? '',
        });
        setShowCharts(true);
      }
    }
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'];

  return (
    <div className="p-4 space-y-6">
      <AnimatePresence>
        {showCharts && (
          <motion.div
            key="insights-charts"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.4 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-3 gap-4">
              <Card><h3 className="font-semibold">Total Runs</h3><p>{summary.totalRuns}</p></Card>
              <Card><h3 className="font-semibold">Success Rate</h3><p>{summary.successRate}%</p></Card>
              <Card><h3 className="font-semibold">Avg Duration</h3><p>{summary.avgDuration}</p></Card>
            </div>

            <Card>
              <h3 className="font-semibold mb-2">Phase Durations</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={metrics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="phase" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="duration">
                    {metrics.map((entry, index) => (
                      <Cell key={`cell-bar-${entry.phase}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card>
              <h3 className="font-semibold mb-2">Performance Trend</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={metrics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="phase" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="duration" stroke="#3B82F6" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            <Card>
              <h3 className="font-semibold mb-2">Phase Distribution</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={metrics} dataKey="duration" nameKey="phase" outerRadius={100} label>
                    {metrics.map((entry, index) => (
                      <Cell key={`cell-pie-${entry.phase}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
      {!showCharts && <div className="text-muted-foreground p-8">Insights</div>}
    </div>
  );
}
