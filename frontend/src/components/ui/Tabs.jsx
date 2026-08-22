import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Tabs({ tabs, active, onChange, className = '' }) {
  const [internalActive, setInternalActive] = useState(active || tabs[0]?.id);
  const current = active !== undefined ? active : internalActive;
  const handleChange = onChange || setInternalActive;

  return (
    <div className={className}>
      <div className="relative flex items-center gap-1 border-b border-border">
        {tabs.map((tab) => {
          const isActive = current === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleChange(tab.id)}
              className={`relative px-4 py-3 text-body font-medium transition-colors ${
                isActive ? 'text-ink-primary' : 'text-ink-muted hover:text-ink-secondary'
              }`}
            >
              {tab.label}
              {isActive && (
                <motion.div
                  layoutId="tab-underline"
                  className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary rounded-full"
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
