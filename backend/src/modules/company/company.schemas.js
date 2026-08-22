/**
 * @file company.schemas.js
 * Owns request validation schemas for departments and company holidays.
 * Must not contain business rules or SQL logic.
 */

import { z } from "zod";

export const createDepartmentSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Department name is required").max(100)
  })
});

export const createHolidaySchema = z.object({
  body: z.object({
    holidayDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format must be YYYY-MM-DD"),
    name: z.string().min(1, "Holiday name is required").max(255)
  })
});

export const getHolidaysSchema = z.object({
  query: z.object({
    year: z.coerce.number().min(2000).max(2100).optional()
  })
});
