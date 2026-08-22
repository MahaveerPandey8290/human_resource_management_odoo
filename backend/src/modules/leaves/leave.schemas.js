/**
 * @file leave.schemas.js
 * Owns request validation schemas for leave applications, approvals, and allocations.
 * Must not touch database or controller logic.
 */

import { z } from "zod";
import { LeaveStatus } from "../../core/Enums.js";

export const createLeaveRequestSchema = z.object({
  body: z.object({
    leaveTypeId: z.coerce.number().min(1, "Leave type is required"),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Start date must be YYYY-MM-DD"),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "End date must be YYYY-MM-DD"),
    reason: z.string().max(1000).optional()
  })
});

export const reviewLeaveRequestSchema = z.object({
  params: z.object({
    id: z.coerce.number()
  }),
  body: z.object({
    status: z.enum([LeaveStatus.APPROVED, LeaveStatus.REJECTED]),
    reviewComment: z.string().max(500).optional()
  })
});

export const listLeavesSchema = z.object({
  query: z.object({
    scope: z.enum(["me", "all"]).default("me"),
    status: z.enum([LeaveStatus.PENDING, LeaveStatus.APPROVED, LeaveStatus.REJECTED]).optional(),
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20)
  })
});

export const createAllocationSchema = z.object({
  body: z.object({
    employeeId: z.coerce.number(),
    leaveTypeId: z.coerce.number(),
    year: z.coerce.number().min(2000).max(2100),
    allocatedDays: z.coerce.number().min(0).max(365)
  })
});

export const getCalendarSchema = z.object({
  query: z.object({
    year: z.coerce.number().min(2000).max(2100).optional()
  })
});
