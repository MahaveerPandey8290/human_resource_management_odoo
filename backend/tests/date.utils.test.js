import { describe, it, expect } from "vitest";
import { DateUtils } from "../src/utils/DateUtils.js";

describe("DateUtils", () => {
  it("should calculate working days excluding weekends correctly", () => {
    // 2026-08-17 (Monday) to 2026-08-21 (Friday) is 5 working days
    const days = DateUtils.calculateWorkingDaysInRange("2026-08-17", "2026-08-21", [], 5);
    expect(days).toBe(5);

    // 2026-08-17 (Monday) to 2026-08-23 (Sunday) is 5 working days (weekend excluded)
    const daysWithWeekend = DateUtils.calculateWorkingDaysInRange("2026-08-17", "2026-08-23", [], 5);
    expect(daysWithWeekend).toBe(5);
  });

  it("should exclude public holidays from working days count", () => {
    const holidays = ["2026-08-18"];
    const days = DateUtils.calculateWorkingDaysInRange("2026-08-17", "2026-08-21", holidays, 5);
    expect(days).toBe(4);
  });
});
