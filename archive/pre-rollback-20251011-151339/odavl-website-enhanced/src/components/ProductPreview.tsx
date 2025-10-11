'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';

export default function ProductPreview() {
  const t = useTranslations('hero');

  return (
    <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 1, delay: 0.4 }}>
      <Card className="p-6 bg-gradient-to-br from-card to-card/50 border-primary/20 shadow-2xl">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">{t('productPreview')}</h3>
            <div className="flex space-x-1">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
              <span className="text-sm">Code Quality Score</span>
              <motion.span className="font-bold text-primary" animate={{ opacity: [1, 0.7, 1] }} transition={{ duration: 2, repeat: Infinity }}>94.2%</motion.span>
            </div>
            <div className="flex items-center justify-between p-3 bg-secondary/5 rounded-lg">
              <span className="text-sm">Issues Fixed Today</span>
              <motion.span className="font-bold text-secondary" animate={{ opacity: [1, 0.7, 1] }} transition={{ duration: 2.5, repeat: Infinity }}>23</motion.span>
            </div>
            <div className="flex items-center justify-between p-3 bg-accent/5 rounded-lg">
              <span className="text-sm">Safety Gates Passed</span>
              <motion.span className="font-bold text-accent" animate={{ opacity: [1, 0.7, 1] }} transition={{ duration: 3, repeat: Infinity }}>✓ All</motion.span>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}