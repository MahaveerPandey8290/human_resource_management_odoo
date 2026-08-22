/**
 * @file Enums.js
 * Frozen domain enumerations used across the application.
 */

export const UserRole = Object.freeze({
  ADMIN: "admin",
  HR: "hr",
  EMPLOYEE: "employee"
});

export const EmployeeStatus = Object.freeze({
  ACTIVE: "active",
  INACTIVE: "inactive"
});

export const TodayStatus = Object.freeze({
  ON_LEAVE: "on_leave",
  PRESENT: "present",
  ABSENT: "absent"
});

export const AttendanceStatus = Object.freeze({
  PRESENT: "present",
  ABSENT: "absent",
  HALF_DAY: "half_day",
  LEAVE: "leave"
});

export const LeaveStatus = Object.freeze({
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected"
});

export const SkillKind = Object.freeze({
  SKILL: "skill",
  CERTIFICATION: "certification"
});

export const SalaryCategory = Object.freeze({
  EARNING: "earning",
  EMPLOYER_CONTRIBUTION: "employer_contribution",
  DEDUCTION: "deduction"
});

export const SalaryComputationType = Object.freeze({
  PERCENT_OF_WAGE: "percent_of_wage",
  PERCENT_OF_BASIC: "percent_of_basic",
  FIXED: "fixed",
  REMAINDER: "remainder"
});
