import { env } from "../config/env.js";

/**
 * Utility for calculating attendance work minutes and extra minutes.
 */
export class AttendanceCalculator {
  /**
   * Computes work minutes and extra minutes between check-in and check-out timestamps.
   * @param {Date|string} checkIn
   * @param {Date|string} checkOut
   * @param {number} [standardMinutes=480] 8 hours standard work day
   * @param {number} [breakMinutes=0]
   * @returns {{ workMinutes: number, extraMinutes: number }}
   */
  static calculateHours(checkIn, checkOut, standardMinutes = 480, breakMinutes = 0) {
    const inTime = new Date(checkIn).getTime();
    const outTime = new Date(checkOut).getTime();
    const diffMinutes = Math.max(0, Math.floor((outTime - inTime) / (1000 * 60)));

    let workMinutes = diffMinutes;
    if (env.DEDUCT_BREAK_FROM_WORK_HOURS && breakMinutes > 0) {
      workMinutes = Math.max(0, workMinutes - breakMinutes);
    }

    const extraMinutes = Math.max(0, workMinutes - standardMinutes);
    return {
      workMinutes,
      extraMinutes
    };
  }
}
