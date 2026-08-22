import { motion } from 'framer-motion';
import { easeOut } from '@/lib/motion';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function StatCard({ label, value, suffix, icon: Icon, tone = 'primary', trend, index = 0 }) {
  const tones = {
    primary: 'text-primary bg-primary-tint',
    success: 'text-success bg-success-tint',
    warning: 'text-warning bg-warning-tint',
    info: 'text-info bg-info-tint',
    danger: 'text-danger bg-danger-tint',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: easeOut, delay: index * 0.08 }}
      className="bg-surface border border-border rounded-card p-5"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-label font-medium uppercase tracking-wide text-ink-muted">{label}</span>
        {Icon && (
          <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${tones[tone]}`}>
            <Icon className="w-4 h-4" />
          </span>
        )}
      </div>
      <div className="flex items-end gap-1.5">
        <span className="text-h1 font-semibold text-ink-primary tnum tabular-nums">{value}</span>
        {suffix && <span className="text-body text-ink-muted mb-1">{suffix}</span>}
      </div>
      {trend != null && (
        <div className="flex items-center gap-1 mt-2">
          {trend >= 0 ? (
            <TrendingUp className="w-3.5 h-3.5 text-success" />
          ) : (
            <TrendingDown className="w-3.5 h-3.5 text-danger" />
          )}
          <span className={`text-small font-medium ${trend >= 0 ? 'text-success' : 'text-danger'}`}>
            {trend >= 0 ? '+' : ''}{trend}% vs last month
          </span>
        </div>
      )}
    </motion.div>
  );
}
