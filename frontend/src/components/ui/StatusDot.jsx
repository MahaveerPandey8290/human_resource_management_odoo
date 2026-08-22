import { motion } from 'framer-motion';
import { Plane } from 'lucide-react';

const map = {
  present: { color: '#22C55E', label: 'Present', isPlane: false },
  leave: { color: '#0EA5E9', label: 'On Leave', isPlane: true },
  on_leave: { color: '#0EA5E9', label: 'On Leave', isPlane: true },
  absent: { color: '#F59E0B', label: 'Absent', isPlane: false },
};

export default function StatusDot({ status, showLabel = false, className = '', pulse = false }) {
  const normKey = (status || '').toLowerCase().replace('-', '_');
  const cfg = map[normKey] || map.absent;

  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`} title={cfg.label}>
      {cfg.isPlane ? (
        <span className="w-5 h-5 rounded-full bg-info-tint flex items-center justify-center text-info shrink-0" title="On Leave">
          <Plane className="w-3 h-3 rotate-[-45deg]" />
        </span>
      ) : (
        <span className="relative inline-flex items-center justify-center w-3.5 h-3.5">
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
      )}
      {showLabel && <span className="text-small text-ink-secondary font-medium">{cfg.label}</span>}
    </span>
  );
}
