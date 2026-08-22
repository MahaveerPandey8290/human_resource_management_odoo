/**
 * Attendance service — check-in / check-out, monthly view, admin roster.
 *
 * Backend endpoints:
 *   GET  /attendance/status          → today's state for logged-in employee
 *   POST /attendance/check-in        → record check-in
 *   POST /attendance/check-out       → record check-out
 *   GET  /attendance/my-monthly      → ?year=YYYY&month=MM
 *   GET  /attendance/roster          → ?date=YYYY-MM-DD&page=N&limit=N (admin)
 */

import { api } from '@/lib/api';

// ── Format Helper ─────────────────────────────────────────────────────────────

export function formatHHMM(minutes) {
  if (!minutes || minutes < 0) return '00:00';
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// ── Today's status (widget) ───────────────────────────────────────────────────

/**
 * Fetches the current check-in state for the authenticated employee.
 * Used to restore the CheckInWidget state on page load or refresh.
 *
 * Returns: { isCheckedIn, checkIn, checkOut, attendanceId, workedMinutesToday }
 */
export async function getAttendanceStatus() {
  return api.get('/attendance/status');
}

// ── Check in ──────────────────────────────────────────────────────────────────

/**
 * Records a check-in for the authenticated employee.
 * The server uses the current server time so clocks can't be spoofed.
 */
export async function checkIn() {
  return api.post('/attendance/check-in', {});
}

// ── Check out ─────────────────────────────────────────────────────────────────

/**
 * Records a check-out and returns computed work + extra minutes.
 */
export async function checkOut() {
  return api.post('/attendance/check-out', {});
}

// ── My monthly records ────────────────────────────────────────────────────────

/**
 * Returns all attendance rows for a specific month plus summary stats.
 * Used on the employee's own attendance page.
 *
 * @param {number} year  - e.g. 2026
 * @param {number} month - 1-indexed, e.g. 8 for August
 */
export async function getMyMonthlyAttendance(year, month) {
  return api.get(`/attendance/my-monthly?year=${year}&month=${month}`);
}

/**
 * Compatibility helper for attendance page
 */
export async function getMyAttendance(employeeId, { month } = {}) {
  let y, m;
  if (month && typeof month === 'string') {
    const parts = month.split('-');
    y = parseInt(parts[0], 10);
    m = parseInt(parts[1], 10);
  } else {
    const now = new Date();
    y = now.getFullYear();
    m = now.getMonth() + 1;
  }
  const res = await getMyMonthlyAttendance(y, m);
  if (res.success && res.data) {
    // Return the attendance rows array directly for the table
    return {
      success: true,
      data: res.data.records || res.data.rows || (Array.isArray(res.data) ? res.data : []),
      summary: res.data.summary || res.data,
    };
  }
  return res;
}

// ── Admin daily roster ────────────────────────────────────────────────────────

/**
 * Returns attendance for all employees on a given date.
 * Only accessible to admin and HR roles.
 *
 * @param {{ date: string, search?: string, departmentId?: string, page?: number, limit?: number }} opts
 */
export async function getDailyRoster({ date, search = '', departmentId = '', page = 1, limit = 30 } = {}) {
  const params = new URLSearchParams({ page, limit });
  if (date)         params.set('date', date);
  if (search)       params.set('search', search);
  if (departmentId) params.set('departmentId', departmentId);
  return api.get(`/attendance/roster?${params}`);
}

/**
 * Compatibility helper for admin attendance
 */
export async function getDailyAttendance(date) {
  const res = await getDailyRoster({ date });
  if (res.success && res.data) {
    return {
      success: true,
      data: res.data.rows || (Array.isArray(res.data) ? res.data : []),
    };
  }
  return res;
}
