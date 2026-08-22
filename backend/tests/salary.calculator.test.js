import { describe, it, expect } from "vitest";
import { SalaryCalculator } from "../src/utils/SalaryCalculator.js";
import { SalaryCategory } from "../src/core/Enums.js";

describe("SalaryCalculator", () => {
  it("should accurately compute all breakdown components for Rs 50,000 wage", () => {
    const components = SalaryCalculator.computeBreakdown(50000);
    expect(components).toBeDefined();
    expect(components.length).toBe(9);

    const basic = components.find((c) => c.name === "Basic");
    expect(basic.amount).toBe(25000.0); // 50% of 50,000

    const hra = components.find((c) => c.name === "House Rent Allowance");
    expect(hra.amount).toBe(12500.0); // 50% of 25,000

    const std = components.find((c) => c.name === "Standard Allowance");
    expect(std.amount).toBe(4167.5); // 16.67% of 25,000

    const bonus = components.find((c) => c.name === "Performance Bonus");
    expect(bonus.amount).toBe(2082.5); // 8.33% of 25,000

    const lta = components.find((c) => c.name === "Leave Travel Allowance");
    expect(lta.amount).toBe(2082.5); // 8.33% of 25,000

    const fixed = components.find((c) => c.name === "Fixed Allowance");
    // sum of earnings: basic + hra + std + bonus + lta = 25000 + 12500 + 4167.5 + 2082.5 + 2082.5 = 45832.50
    // fixed = 50000 - 45832.50 = 4167.50
    expect(fixed.amount).toBe(4167.5);

    const pfEmp = components.find((c) => c.name === "Provident Fund (Employee)");
    expect(pfEmp.amount).toBe(3000.0); // 12% of 25,000

    const pfCompany = components.find((c) => c.name === "Provident Fund (Employer)");
    expect(pfCompany.amount).toBe(3000.0); // 12% of 25,000

    const pt = components.find((c) => c.name === "Professional Tax");
    expect(pt.amount).toBe(200.0); // flat 200

    // Invariant: sum of earnings === wage
    const totalEarnings = components
      .filter((c) => c.category === SalaryCategory.EARNING)
      .reduce((sum, c) => Math.round((sum + c.amount) * 100) / 100, 0);

    expect(totalEarnings).toBe(50000.0);
  });

  it("should satisfy invariant for arbitrary fractional monthly wages", () => {
    const testWages = [35000, 75555.55, 120000, 42345.67, 150000];
    for (const wage of testWages) {
      const components = SalaryCalculator.computeBreakdown(wage);
      const totalEarnings = components
        .filter((c) => c.category === SalaryCategory.EARNING)
        .reduce((sum, c) => Math.round((sum + c.amount) * 100) / 100, 0);
      expect(totalEarnings).toBe(SalaryCalculator.round2(wage));
    }
  });

  it("should reject negative or zero wages", () => {
    expect(() => SalaryCalculator.computeBreakdown(0)).toThrow();
    expect(() => SalaryCalculator.computeBreakdown(-1000)).toThrow();
  });
});
