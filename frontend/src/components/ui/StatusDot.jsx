import { motion } from 'framer-motion';
import { Plane } from 'lucide-react';

const map = {
  present: { color: '#22C55E', label: 'Present', icon: null },
  leave: { color: '#0EA5E9', label: 'On Leave', icon: Plane },
  absent: { color: '#F59E0B', label: 'Absent', icon: null },
};

export default function StatusDot({ status, showLabel = false, className = '', pulse = false }) {
  const cfg = map[status] || map.absent;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span className="relative inline-flex">
        <motion.span
          animate={{ scale: [1, 1.15, 1] }}
          transition={pulse ? { duration: 1.8, repeat: Infinity, ease: 'easeInOut' } : { duration: 0 }}
          className="w-2.5 h-2.5 rounded-full"
          style={{ backgroundColor: cfg.color }}
        />
        {pulse && (
          <motion.span
            animate={{ scale: [1, 2.2], opacity: [0.5, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
            className="absolute inset-0 w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: cfg.color }}
          />
        )}
      </span>
      {Icon && <Icon className="w-3.5 h-3.5" style={{ color: cfg.color }} />}
      {showLabel && <span className="text-small text-ink-secondary font-medium">{cfg.label}</span>}
    </span>
  );
}
