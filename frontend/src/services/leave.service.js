/**
 * Leave service — types, balances, requests, approvals, holidays.
 *
 * Backend endpoints:
 *   GET    /leaves/balances     → ?year=YYYY
 *   GET    /leaves              → ?page=N&limit=N&status=...&employeeId=...
 *   POST   /leaves              → submit new request
 *   PATCH  /leaves/:id/review   → approve / reject (admin/HR)
 *   DELETE /leaves/:id          → cancel a pending request
 *   GET    /leaves/calendar     → ?year=YYYY (approved leaves for the calendar)
 *   GET    /leave-types         → all leave types for this company
 *   GET    /holidays            → ?year=YYYY
 */

import { api } from '@/lib/api';

// ── Leave types ───────────────────────────────────────────────────────────────

/**
 * Returns all leave types configured for the company
 * (Paid Time Off, Sick Leave, Unpaid Leave, etc.)
 */
export async function listLeaveTypes() {
  const res = await api.get('/leave-types');
  if (res.success && Array.isArray(res.data)) return res;
  // Fallback to /leaves/types
  return api.get('/leaves/types');
}

// ── Balances ──────────────────────────────────────────────────────────────────

/**
 * Returns the leave allocation and used-days balance for the
 * authenticated employee for a given year.
 *
 * @param {number|string} [yearOrEmpId]
 */
export async function getMyBalances(yearOrEmpId) {
  const currentYear = new Date().getFullYear();
  const year = (typeof yearOrEmpId === 'number' && yearOrEmpId > 1900) ? yearOrEmpId : currentYear;
  const res = await api.get(`/leaves/allocations/me?year=${year}`);
  return res;
}

// ── Leave requests list ───────────────────────────────────────────────────────

/**
 * Lists leave requests.
 *
 * Employees automatically see only their own; admin/HR see all when scope='all'.
 *
 * @param {{ status?: string, search?: string, page?: number, limit?: number, scope?: string }} opts
 */
export async function listRequests({ status = '', search = '', page = 1, limit = 50, scope = 'me' } = {}) {
  const params = new URLSearchParams({ page, limit, scope });
  if (status) params.set('status', status);
  if (search) params.set('search', search);
  return api.get(`/leaves?${params}`);
}

export async function listMyRequests(employeeId) {
  return listRequests({ scope: 'me' });
}

export async function listAllRequests(opts = {}) {
  return listRequests({ ...opts, scope: 'all' });
}

// ── Submit leave request ──────────────────────────────────────────────────────

/**
 * Submits a new time-off request.
 * Can take a FormData instance (with attached medical certificate file) or a JSON object.
 *
 * @param {FormData|{ leaveTypeId, startDate, endDate, reason, attachmentUrl? }} payload
 */
export async function createRequest(payload) {
  if (payload instanceof FormData) {
    return api.post('/leaves', payload);
  }
  return api.post('/leaves', {
    leaveTypeId:   Number(payload.leaveTypeId),
    startDate:     payload.startDate,
    endDate:       payload.endDate,
    reason:        payload.reason || '',
    attachmentUrl: payload.attachmentUrl || null,
  });
}

// ── Review (approve / reject) ────────────────────────────────────────────────

/**
 * Approves or rejects a leave request (admin/HR only).
 * On approval the backend automatically deducts from the balance
 * and inserts attendance rows for the leave dates.
 *
 * @param {string|number} requestId
 * @param {'approved'|'rejected'|'approve'|'reject'} action
 * @param {string} [comment]
 */
export async function reviewRequest(requestId, action, comment) {
  const status = action === 'approved' || action === 'approve' ? 'approved' : 'rejected';
  return api.patch(`/leaves/${requestId}/status`, {
    status,
    reviewComment: comment || '',
  });
}

// ── Cancel request ────────────────────────────────────────────────────────────

/**
 * Cancels a pending leave request.
 * Only works if the request is still pending and belongs to the
 * authenticated employee.
 *
 * @param {string|number} requestId
 */
export async function cancelRequest(requestId) {
  return api.delete(`/leaves/${requestId}`);
}

// ── Calendar (approved leaves) ────────────────────────────────────────────────

/**
 * Returns all leave ranges for the year calendar view.
 *
 * @param {number} [year]
 */
export async function getCalendarLeaves(year) {
  const y = year || new Date().getFullYear();
  return api.get(`/leaves/calendar?year=${y}`);
}

// ── Public holidays ───────────────────────────────────────────────────────────

/**
 * Returns public holidays for the company in a given year.
 *
 * @param {number} [year]
 */
export async function listHolidays(year) {
  const y = year || new Date().getFullYear();
  return api.get(`/holidays?year=${y}`);
}

// ── Utility ───────────────────────────────────────────────────────────────────

/**
 * Counts working days (Mon–Fri) between two date strings (inclusive).
 *
 * @param {string} startDate - YYYY-MM-DD
 * @param {string} endDate   - YYYY-MM-DD
 */
export function workingDaysInRange(startDate, endDate) {
  if (!startDate || !endDate) return 0;
  const start = new Date(startDate);
  const end   = new Date(endDate);
  if (end < start) return 0;
  let count = 0;
  const cur = new Date(start);
  while (cur <= end) {
    const day = cur.getDay();
    if (day !== 0 && day !== 6) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}
