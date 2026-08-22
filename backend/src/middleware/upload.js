import multer from "multer";
import path from "path";
import { randomBytes } from "crypto";
import { env } from "../config/env.js";
import { ValidationError } from "../core/AppError.js";
import { ErrorCodes } from "../core/ErrorCodes.js";

const avatarStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.resolve(env.UPLOAD_DIR));
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `avatar_${Date.now()}_${randomBytes(8).toString("hex")}${ext}`;
    cb(null, uniqueName);
  }
});

const attachmentStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.resolve(env.UPLOAD_DIR));
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `leave_${Date.now()}_${randomBytes(8).toString("hex")}${ext}`;
    cb(null, uniqueName);
  }
});

const allowedImageMimes = ["image/jpeg", "image/png", "image/webp"];
const allowedAttachmentMimes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

export const avatarUpload = multer({
  storage: avatarStorage,
  limits: { fileSize: env.MAX_AVATAR_SIZE_MB * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!allowedImageMimes.includes(file.mimetype)) {
      return cb(new ValidationError("Only JPEG, PNG, and WebP images are allowed for avatars", [{
        field: "avatar",
        code: ErrorCodes.INVALID_FILE_TYPE,
        message: "Invalid file type"
      }]));
    }
    cb(null, true);
  }
});

export const leaveAttachmentUpload = multer({
  storage: attachmentStorage,
  limits: { fileSize: env.MAX_ATTACHMENT_SIZE_MB * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!allowedAttachmentMimes.includes(file.mimetype)) {
      return cb(new ValidationError("Only PDF, JPEG, PNG, and WebP files are allowed for attachments", [{
        field: "attachment",
        code: ErrorCodes.INVALID_FILE_TYPE,
        message: "Invalid attachment type"
      }]));
    }
    cb(null, true);
  }
});
