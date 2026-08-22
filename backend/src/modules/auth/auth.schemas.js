/**
 * @file auth.schemas.js
 * Owns request validation schemas for authentication and company bootstrapping.
 * Must not touch database or request handling logic.
 */

import { z } from "zod";

export const registerCompanySchema = z.object({
  body: z.object({
    companyName: z.string().min(2, "Company name must be at least 2 characters").max(255),
    companyPhone: z.string().max(50).optional(),
    logoUrl: z.string().max(500).optional(),
    adminFirstName: z.string().min(1, "First name is required").max(100),
    adminLastName: z.string().min(1, "Last name is required").max(100),
    adminEmail: z.string().email("Valid admin email is required"),
    adminPassword: z.string().min(8, "Password must be at least 8 characters")
  })
});

export const loginSchema = z.object({
  body: z.object({
    identifier: z.string().min(1, "Login ID or Email is required"),
    password: z.string().min(1, "Password is required")
  })
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain an uppercase letter")
      .regex(/[a-z]/, "Password must contain a lowercase letter")
      .regex(/[0-9]/, "Password must contain a number")
  })
});
