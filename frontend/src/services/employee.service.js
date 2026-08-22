/**
 * Employee service — list, create, update employees; manage departments.
 *
 * Field names match the backend exactly (camelCase):
 *   id, loginId, firstName, lastName, workEmail, role, jobPosition,
 *   department, departmentId, manager, managerId, workLocation,
 *   dateOfJoining, empCode, status, todayStatus, avatarUrl, ...
 */

import { api, apiFetch } from '@/lib/api';

// ── Employee list ─────────────────────────────────────────────────────────────

/**
 * Fetches a paginated, filterable list of employee cards with today's
 * attendance status already resolved (present / on_leave / absent).
 *
 * @param {{ search?: string, departmentId?: string, status?: string, page?: number, limit?: number }} opts
 */
export async function listEmployees({ search = '', departmentId = '', status = '', page = 1, limit = 20 } = {}) {
  const params = new URLSearchParams({ page, limit });
  if (search)       params.set('search', search);
  if (departmentId) params.set('departmentId', departmentId);
  if (status)       params.set('status', status);
  return api.get(`/employees?${params}`);
}

// ── Single employee ───────────────────────────────────────────────────────────

/**
 * Fetches a single employee's full profile.
 *
 * @param {string|number} id
 */
export async function getEmployee(id) {
  return api.get(`/employees/${id}`);
}

// ── Create employee ───────────────────────────────────────────────────────────

/**
 * Creates a new employee.  The backend auto-generates the Login ID and
 * a temporary password, and returns them in the response (shown once only).
 *
 * @param {{ firstName, lastName, email, phone, role, jobPosition, departmentId, managerId, workLocation, dateOfJoining }} payload
 */
export async function createEmployee(payload) {
  return api.post('/employees', {
    firstName:         payload.firstName,
    lastName:          payload.lastName,
    workEmail:         payload.email || payload.workEmail,
    phone:             payload.phone,
    role:              payload.role || 'employee',
    jobPosition:       payload.jobPosition,
    departmentId:      payload.departmentId || payload.department,
    managerId:         payload.managerId || payload.manager || null,
    workLocation:      payload.workLocation || '',
    dateOfJoining:     payload.dateOfJoining,
  });
}

// ── Update employee ───────────────────────────────────────────────────────────

/**
 * Partially updates an employee's profile.
 * Employees may only call this for their own profile; admin can update any.
 *
 * @param {string|number} id
 * @param {object} patch
 */
export async function updateEmployee(id, patch) {
  return api.patch(`/employees/${id}`, patch);
}

/**
 * Convenience wrapper — update a single named field.
 */
export async function updateProfileField(id, field, value) {
  return updateEmployee(id, { [field]: value });
}

// ── Avatar upload ─────────────────────────────────────────────────────────────

/**
 * Uploads a new avatar image for an employee.
 *
 * @param {string|number} id
 * @param {File} file
 */
export async function uploadAvatar(id, file) {
  const formData = new FormData();
  formData.append('avatar', file);
  return apiFetch(`/employees/${id}/avatar`, { method: 'POST', body: formData });
}

// ── Skills ────────────────────────────────────────────────────────────────────

/**
 * Adds a skill or certification to an employee's resume.
 *
 * @param {string|number} employeeId
 * @param {{ name: string, kind: 'skill'|'certification' }} skill
 */
export async function addSkill(employeeId, skill) {
  return api.post(`/employees/${employeeId}/skills`, skill);
}

/**
 * Removes a skill from an employee's resume.
 *
 * @param {string|number} employeeId
 * @param {string|number} skillId
 */
export async function removeSkill(employeeId, skillId) {
  return api.delete(`/employees/${employeeId}/skills/${skillId}`);
}

// ── Departments ───────────────────────────────────────────────────────────────

/**
 * Fetches all departments for the authenticated user's company.
 * Returns the list as an array of { id, name, employeeCount } objects.
 */
export async function listDepartments() {
  return api.get('/departments');
}
