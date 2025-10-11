import { Metadata } from 'next';
import { LearningVisualizationDashboard } from '@/components/LearningVisualizationDashboard';

export const metadata: Metadata = {
  title: 'ODAVL Learning Dashboard | Autonomous Code Quality Analytics',
  description: 'Real-time machine learning insights and analytics for autonomous code quality improvement systems',
  keywords: 'ODAVL, machine learning, code quality, autonomous systems, analytics, dashboard',
};

export default function LearningDashboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <LearningVisualizationDashboard />
    </div>
  );
}