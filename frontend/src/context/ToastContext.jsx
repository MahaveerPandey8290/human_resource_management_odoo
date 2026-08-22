import { createContext, useContext, useCallback, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, XCircle, X } from 'lucide-react';
import { toastSpring } from '@/lib/motion';

const ToastContext = createContext(null);

let idCounter = 0;

const icons = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
  warning: XCircle,
};

const styles = {
  success: { bg: 'bg-success-tint', icon: 'text-success', border: 'border-success/20' },
  error: { bg: 'bg-danger-tint', icon: 'text-danger', border: 'border-danger/20' },
  info: { bg: 'bg-info-tint', icon: 'text-info', border: 'border-info/20' },
  warning: { bg: 'bg-warning-tint', icon: 'text-warning', border: 'border-warning/20' },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((message, type = 'success', duration = 3500) => {
    const id = `t${++idCounter}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    if (duration > 0) setTimeout(() => dismiss(id), duration);
    return id;
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => {
            const Icon = icons[t.type] || Info;
            const s = styles[t.type] || styles.info;
            return (
              <motion.div
                key={t.id}
                variants={toastSpring}
                initial="initial"
                animate="animate"
                exit="exit"
                className={`pointer-events-auto flex items-start gap-3 rounded-card border ${s.bg} ${s.border} px-4 py-3 shadow-lg max-w-sm`}
              >
                <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${s.icon}`} />
                <p className="text-sm text-ink-primary flex-1 leading-snug">{t.message}</p>
                <button onClick={() => dismiss(t.id)} className="text-ink-muted hover:text-ink-primary transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
