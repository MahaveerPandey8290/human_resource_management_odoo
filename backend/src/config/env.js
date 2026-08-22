import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  
  DB_HOST: z.string().default("127.0.0.1"),
  DB_PORT: z.coerce.number().default(3306),
  DB_USER: z.string().default("root"),
  DB_PASSWORD: z.string().default("root"),
  DB_NAME: z.string().default("dayflow_hrms"),
  DB_POOL_LIMIT: z.coerce.number().default(10),

  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters long"),
  JWT_EXPIRES_IN: z.string().default("8h"),
  BCRYPT_ROUNDS: z.coerce.number().default(12),

  CORS_ORIGIN: z.string().default("http://localhost:3000,http://localhost:5173"),

  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000),
  RATE_LIMIT_MAX: z.coerce.number().default(100),
  AUTH_RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().default(5),

  UPLOAD_DIR: z.string().default("src/uploads"),
  MAX_AVATAR_SIZE_MB: z.coerce.number().default(2),
  MAX_ATTACHMENT_SIZE_MB: z.coerce.number().default(5),

  DEDUCT_BREAK_FROM_WORK_HOURS: z
    .string()
    .transform((val) => val === "true")
    .default("false")
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  process.stderr.write("Invalid environment configuration:\n" + JSON.stringify(parsed.error.format(), null, 2) + "\n");
  process.exit(1);
}

export const env = parsed.data;
