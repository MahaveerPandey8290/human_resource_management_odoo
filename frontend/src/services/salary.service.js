/**
 * Salary service — fetch, update salary structure and generate payslips.
 *
 * Backend endpoints:
 *   GET /employees/:id/salary          → current salary structure + components
 *   PUT /employees/:id/salary          → update wage / config
 *   GET /employees/:id/payslip         → ?year=YYYY&month=MM (prorated payslip)
 *
 * Client-side salary calculations (computeSalaryComponents, computePF, recompute)
 * are kept here for the live preview in the Salary Info tab — so the numbers
 * update as the user types without waiting for a round-trip to the backend.
 */

import { api } from '@/lib/api';

// ── Fetch salary structure ────────────────────────────────────────────────────

/**
 * Returns the full salary structure for an employee, including all components.
 * Only accessible to admin.
 *
 * @param {string|number} employeeId
 */
export async function getSalary(employeeId) {
  return api.get(`/employees/${employeeId}/salary`);
}

// ── Update salary ─────────────────────────────────────────────────────────────

/**
 * Saves a new wage configuration.  The backend recomputes all components
 * automatically, so there is no need to send component values.
 *
 * @param {string|number} employeeId
 * @param {{ monthlyWage: number, workingDaysPerWeek?: number, breakMinutes?: number, effectiveFrom?: string }} payload
 */
export async function updateSalary(employeeId, payload) {
  return api.put(`/employees/${employeeId}/salary`, {
    monthlyWage:          Number(payload.monthlyWage) || 0,
    workingDaysPerWeek:   payload.workingDaysPerWeek ?? 5,
    breakMinutes:         payload.breakMinutes ?? 0,
    effectiveFrom:        payload.effectiveFrom || null,
  });
}

/**
 * Update only monthly wage (convenience helper)
 */
export async function updateMonthlyWage(employeeId, monthlyWage) {
  return updateSalary(employeeId, { monthlyWage });
}

/**
 * Update working configuration (working days and break minutes)
 */
export async function updateWorkingConfig(employeeId, { workingDaysPerWeek, breakMinutes }) {
  return updateSalary(employeeId, { workingDaysPerWeek, breakMinutes });
}

// ── Payslip ───────────────────────────────────────────────────────────────────

/**
 * Returns a prorated payslip for a given month, including present days,
 * leave deductions, gross earnings, deductions, and net payable.
 *
 * @param {string|number} employeeId
 * @param {number} year
 * @param {number} month - 1-indexed
 */
export async function getPayslip(employeeId, year, month) {
  return api.get(`/employees/${employeeId}/payslip?year=${year}&month=${month}`);
}

// ── Client-side calculations (live preview) ───────────────────────────────────

/**
 * Computes salary component amounts from a monthly wage.
 * Used for the live preview in the Salary Info tab before saving.
 *
 * @param {number} monthlyWage
 * @returns {Array<{ name, category, computationType, rate, amount }>}
 */
export function computeSalaryComponents(monthlyWage) {
  const wage = Number(monthlyWage) || 0;

  const basic             = wage * 0.50;
  const hra               = basic * 0.50;
  const standardAllowance = basic * 0.1667;
  const performanceBonus  = basic * 0.0833;
  const lta               = basic * 0.0833;

  const sumAbove      = basic + hra + standardAllowance + performanceBonus + lta;
  const fixedAllow    = Math.max(0, wage - sumAbove);

  return [
    { name: 'Basic Salary',           category: 'earnings', computationType: 'percentage', rate: 50,    amount: Math.round(basic) },
    { name: 'House Rent Allowance',   category: 'earnings', computationType: 'percentage', rate: 50,    amount: Math.round(hra) },
    { name: 'Standard Allowance',     category: 'earnings', computationType: 'percentage', rate: 16.67, amount: Math.round(standardAllowance) },
    { name: 'Performance Bonus',      category: 'earnings', computationType: 'percentage', rate: 8.33,  amount: Math.round(performanceBonus) },
    { name: 'Leave Travel Allowance', category: 'earnings', computationType: 'percentage', rate: 8.33,  amount: Math.round(lta) },
    { name: 'Fixed Allowance',        category: 'earnings', computationType: 'balance',    rate: 0,     amount: Math.round(fixedAllow) },
  ];
}

/**
 * Computes PF and professional tax deductions.
 *
 * @param {number} monthlyWage
 */
export function computePF(monthlyWage) {
  const basic = (Number(monthlyWage) || 0) * 0.5;
  return {
    employeePF:      Math.round(basic * 0.12),
    employerPF:      Math.round(basic * 0.12),
    professionalTax: 200,
  };
}

/**
 * All-in-one recompute helper for the live Salary Info preview.
 *
 * @param {number} monthlyWage
 */
export function recompute(monthlyWage) {
  const components = computeSalaryComponents(monthlyWage);
  const pf         = computePF(monthlyWage);
  const total      = components.reduce((s, c) => s + c.amount, 0);
  const exceeds    = total > (Number(monthlyWage) || 0);
  return { components, pf, total, exceeds };
}
