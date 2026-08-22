/**
 * @file attendance.schemas.js
 * Owns request validation schemas for attendance check-in, check-out, and roster filters.
 * Must not contain business logic or SQL.
 */

import { z } from "zod";

export const getMonthlyAttendanceSchema = z.object({
  query: z.object({
    month: z.string().regex(/^\d{4}-\d{2}$/, "Month must be formatted as YYYY-MM").optional()
  })
});

export const getDailyAttendanceSchema = z.object({
  query: z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be formatted as YYYY-MM-DD").optional(),
    search: z.string().optional(),
    departmentId: z.coerce.number().optional(),
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20)
  })
});
