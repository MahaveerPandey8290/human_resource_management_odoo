/**
 * @file employee.schemas.js
 * Owns request validation schemas for employee management, profiling, and skills.
 * Must not touch database or controller handling logic.
 */

import { z } from "zod";
import { UserRole, SkillKind } from "../../core/Enums.js";

export const listEmployeesSchema = z.object({
  query: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
    search: z.string().optional(),
    departmentId: z.coerce.number().optional(),
    status: z.enum(["active", "inactive"]).optional(),
    sort: z.enum(["id", "first_name", "date_of_joining", "created_at"]).default("id"),
    sortOrder: z.enum(["ASC", "DESC", "asc", "desc"]).default("DESC")
  })
});

export const createEmployeeSchema = z.object({
  body: z.object({
    firstName: z.string().min(1, "First name is required").max(100),
    lastName: z.string().min(1, "Last name is required").max(100),
    workEmail: z.string().email("Valid work email is required"),
    role: z.enum([UserRole.ADMIN, UserRole.HR, UserRole.EMPLOYEE]).default(UserRole.EMPLOYEE),
    phone: z.string().max(50).optional(),
    jobPosition: z.string().max(100).optional(),
    departmentId: z.coerce.number().optional(),
    managerId: z.coerce.number().optional(),
    workLocation: z.string().default("On-site"),
    dateOfJoining: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format must be YYYY-MM-DD"),
    empCode: z.string().max(50).optional(),
    dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    gender: z.string().max(20).optional(),
    maritalStatus: z.string().max(20).optional(),
    nationality: z.string().default("Indian"),
    personalEmail: z.string().email().optional(),
    address: z.string().optional(),
    bankName: z.string().optional(),
    accountNumber: z.string().optional(),
    ifsc: z.string().optional(),
    pan: z.string().optional(),
    uan: z.string().optional(),
    about: z.string().optional(),
    jobLove: z.string().optional(),
    interests: z.string().optional()
  })
});

export const updateEmployeeSchema = z.object({
  params: z.object({
    id: z.coerce.number()
  }),
  body: z.object({
    firstName: z.string().max(100).optional(),
    lastName: z.string().max(100).optional(),
    workEmail: z.string().email().optional(),
    role: z.enum([UserRole.ADMIN, UserRole.HR, UserRole.EMPLOYEE]).optional(),
    phone: z.string().max(50).optional(),
    jobPosition: z.string().max(100).optional(),
    departmentId: z.coerce.number().nullable().optional(),
    managerId: z.coerce.number().nullable().optional(),
    workLocation: z.string().optional(),
    dateOfJoining: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    empCode: z.string().max(50).optional(),
    dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
    gender: z.string().max(20).optional(),
    maritalStatus: z.string().max(20).optional(),
    nationality: z.string().optional(),
    personalEmail: z.string().email().nullable().optional(),
    address: z.string().nullable().optional(),
    bankName: z.string().nullable().optional(),
    accountNumber: z.string().nullable().optional(),
    ifsc: z.string().nullable().optional(),
    pan: z.string().nullable().optional(),
    uan: z.string().nullable().optional(),
    about: z.string().nullable().optional(),
    jobLove: z.string().nullable().optional(),
    interests: z.string().nullable().optional(),
    status: z.enum(["active", "inactive"]).optional()
  })
});

export const addSkillSchema = z.object({
  params: z.object({
    id: z.coerce.number()
  }),
  body: z.object({
    name: z.string().min(1).max(100),
    kind: z.enum([SkillKind.SKILL, SkillKind.CERTIFICATION]).default(SkillKind.SKILL)
  })
});

export const deleteSkillSchema = z.object({
  params: z.object({
    id: z.coerce.number(),
    skillId: z.coerce.number()
  })
});
