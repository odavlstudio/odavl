// odavl-studio/insight/cloud/components/dashboard-v2/AnimatedChart.tsx
'use client';

import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorBoundary } from '@/components/ui/error-boundary';

interface AnimatedChartProps {
  data: any[];
  loading?: boolean;
  error?: Error | null;
  realtime?: boolean;
}

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: 'easeOut',
      staggerChildren: 0.1
    }
  }
};

const chartVariants = {
  hidden: { scale: 0.95, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      duration: 0.3,
      ease: 'easeOut'
    }
  }
};

export function AnimatedChart({ data, loading, error, realtime }: AnimatedChartProps) {
  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-4"
      >
        <Skeleton className="h-[300px] w-full" />
      </motion.div>
    );
  }

  if (error) {
    return (
      <ErrorBoundary error={error}>
        <div className="flex items-center justify-center h-[300px]">
          <p className="text-red-500">Failed to load chart</p>
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="relative"
    >
      {realtime && (
        <motion.div
          className="absolute top-2 right-2 flex items-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="w-2 h-2 bg-green-500 rounded-full"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [1, 0.5, 1]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
          <span className="text-xs text-gray-500">Live</span>
        </motion.div>
      )}

      <motion.div variants={chartVariants}>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#8884d8"
              strokeWidth={2}
              animationDuration={1000}
              animationEasing="ease-in-out"
            />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>
    </motion.div>
  );
}