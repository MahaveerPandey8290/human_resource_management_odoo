/**
 * @file salary.schemas.js
 * Owns request validation schemas for salary structures, component computations, and payslips.
 * Must not contain business calculations or SQL logic.
 */

import { z } from "zod";

export const updateSalarySchema = z.object({
  params: z.object({
    id: z.coerce.number()
  }),
  body: z.object({
    monthlyWage: z.coerce.number().positive("Monthly wage must be greater than 0"),
    workingDaysPerWeek: z.coerce.number().min(4).max(7).default(5),
    breakMinutes: z.coerce.number().min(0).max(180).default(0),
    effectiveFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Effective date must be YYYY-MM-DD")
  })
});

export const getPayslipSchema = z.object({
  params: z.object({
    id: z.coerce.number()
  }),
  query: z.object({
    month: z.string().regex(/^\d{4}-\d{2}$/, "Month must be formatted as YYYY-MM").optional()
  })
});
