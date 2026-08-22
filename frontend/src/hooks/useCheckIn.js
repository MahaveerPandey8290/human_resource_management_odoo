/**
 * useCheckIn — manages the Check In / Check Out widget state.
 *
 * On mount it fetches today's attendance state from the backend.
 * After check-in/check-out it re-fetches to stay in sync with server time.
 */

import { useEffect, useState, useCallback } from 'react';
import * as attendanceService from '@/services/attendance.service';

export function useCheckIn() {
  const [state,   setState]   = useState(null);   // null = not checked in yet
  const [loading, setLoading] = useState(true);

  // Fetch today's status from the backend
  const refresh = useCallback(async () => {
    const res = await attendanceService.getAttendanceStatus();
    if (res.success && res.data?.isCheckedIn) {
      setState({
        checkIn:    res.data.checkIn,
        checkOut:   res.data.checkOut || null,
        // startedAt is a Unix ms timestamp — we compute it from checkIn time
        startedAt:  buildStartedAt(res.data.checkIn),
      });
    } else {
      setState(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const doCheckIn = async () => {
    setLoading(true);
    const res = await attendanceService.checkIn();
    if (res.success) await refresh();
    else setLoading(false);
    return res;
  };

  const doCheckOut = async () => {
    setLoading(true);
    const res = await attendanceService.checkOut();
    if (res.success) await refresh();
    else setLoading(false);
    return res;
  };

  return { state, loading, checkIn: doCheckIn, checkOut: doCheckOut, refresh };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Converts an "HH:MM" string (today's check-in time) to a Unix ms timestamp.
 * Used so the live timer in CheckInWidget can compute elapsed duration.
 *
 * @param {string} timeStr - "09:03"
 * @returns {number} milliseconds
 */
function buildStartedAt(timeStr) {
  if (!timeStr) return Date.now();
  const [h, m] = timeStr.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.getTime();
}
