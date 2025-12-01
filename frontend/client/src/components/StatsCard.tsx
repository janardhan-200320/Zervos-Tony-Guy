import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  delay?: number;
}

export default function StatsCard({
  title,
  value,
  change,
  changeType = 'neutral',
  icon: Icon,
  iconColor = 'text-indigo-600',
  iconBg = 'bg-indigo-100 dark:bg-indigo-900',
  delay = 0,
}: StatsCardProps) {
  const changeColors = {
    positive: 'text-green-600 dark:text-green-400',
    negative: 'text-red-600 dark:text-red-400',
    neutral: 'text-gray-500 dark:text-gray-400',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ 
        y: -4, 
        scale: 1.02,
        transition: { type: "spring", stiffness: 300, damping: 20 }
      }}
      className="group bg-white/70 dark:bg-gray-900/80 backdrop-blur-lg p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h3>
        <motion.div
          whileHover={{ scale: 1.1, rotate: 5 }}
          transition={{ type: "spring", stiffness: 400 }}
          className={`p-2 rounded-lg ${iconBg}`}
        >
          <Icon className={`w-4 h-4 ${iconColor}`} />
        </motion.div>
      </div>
      <motion.p
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: delay + 0.1 }}
        className="text-3xl font-bold text-gray-900 dark:text-white mb-1"
      >
        {value}
      </motion.p>
      {change && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: delay + 0.2 }}
          className={`text-xs ${changeColors[changeType]} flex items-center gap-1`}
        >
          {changeType === 'positive' && '↗'}
          {changeType === 'negative' && '↘'}
          {change}
        </motion.p>
      )}
    </motion.div>
  );
}

interface StatsGridProps {
  children: ReactNode;
}

export function StatsGrid({ children }: StatsGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {children}
    </div>
  );
}
