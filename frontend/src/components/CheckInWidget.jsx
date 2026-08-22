/**
 * CheckInWidget — the clock-in/clock-out button in the top navigation bar.
 *
 * Before check-in: shows a pulsing red dot with "Check In →"
 * After check-in:  dot springs to green + shows "Since HH:MM" + elapsed timer
 * After check-out: dot stays green but timer stops
 */

import { motion } from 'framer-motion';
import { LogIn, LogOut } from 'lucide-react';
import { useCheckIn } from '@/hooks/useCheckIn';
import useNow from '@/hooks/useNow';
import { useToast } from '@/context/ToastContext';

function formatDuration(ms) {
  if (ms <= 0) return '00h 00m';
  const totalMin = Math.floor(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m`;
}

export default function CheckInWidget() {
  const { state, loading, checkIn, checkOut } = useCheckIn();
  const now = useNow(1000);
  const { toast } = useToast();

  const handleCheckIn = async () => {
    const res = await checkIn();
    if (res?.success) toast('Checked in! Have a great day 🎉', 'success');
    else              toast(res?.error?.message || 'Could not check in.', 'error');
  };

  const handleCheckOut = async () => {
    const res = await checkOut();
    if (res?.success) toast('Checked out. See you tomorrow! 👋', 'success');
    else              toast(res?.error?.message || 'Could not check out.', 'error');
  };

  // ── Not checked in yet ─────────────────────────────────────────────────────
  if (!state) {
    return (
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={handleCheckIn}
        disabled={loading}
        className="inline-flex items-center gap-2 h-9 px-3.5 rounded-input bg-white border border-border-strong text-body font-medium text-ink-primary hover:border-primary hover:bg-primary-tint/50 transition-colors focus-ring disabled:opacity-60"
      >
        {/* Pulsing red dot */}
        <span className="relative inline-flex">
          <span className="w-2.5 h-2.5 rounded-full bg-danger" />
          <motion.span
            animate={{ scale: [1, 2], opacity: [0.5, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
            className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-danger"
          />
        </span>
        <span>Check In</span>
        <LogIn className="w-4 h-4 text-ink-muted" />
      </motion.button>
    );
  }

  // ── Checked in (or already checked out) ───────────────────────────────────
  const elapsed = state.checkOut ? 0 : Math.max(0, now - state.startedAt);

  return (
    <div className="inline-flex items-center gap-3 h-9 px-3.5 rounded-input bg-white border border-border-strong">
      {/* Dot — springs from red to green on check-in */}
      <span className="relative inline-flex">
        <motion.span
          initial={{ scale: 0.6, backgroundColor: '#EF4444' }}
          animate={{ scale: 1, backgroundColor: '#22C55E' }}
          transition={{ type: 'spring', stiffness: 380, damping: 22 }}
          className="w-2.5 h-2.5 rounded-full"
        />
        <motion.span
          animate={{ scale: [1, 2.2], opacity: [0.4, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
          className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-success"
        />
      </span>

      {/* Time labels */}
      <div className="flex flex-col leading-tight">
        <span className="text-[10px] text-ink-muted uppercase tracking-wide">
          Since {state.checkIn}
        </span>
        {!state.checkOut && (
          <span className="text-small font-semibold text-ink-primary tnum">
            {formatDuration(elapsed)}
          </span>
        )}
      </div>

      {/* Check Out button — hidden after checkout */}
      {!state.checkOut && (
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleCheckOut}
          disabled={loading}
          className="inline-flex items-center gap-1.5 text-small font-medium text-danger hover:text-red-700 transition-colors disabled:opacity-60"
        >
          <span>Check Out</span>
          <LogOut className="w-3.5 h-3.5" />
        </motion.button>
      )}
    </div>
  );
}
