import { BusinessRuleError } from "../core/AppError.js";
import { SalaryCategory, SalaryComputationType } from "../core/Enums.js";

/**
 * Pure class for calculating salary breakdown components.
 * Zero database dependencies, fully unit testable.
 */
export class SalaryCalculator {
  /**
   * Default percentage and rule configuration.
   */
  static CONFIG = {
    BASIC_PERCENT_OF_WAGE: 50.0,
    HRA_PERCENT_OF_BASIC: 50.0,
    STANDARD_ALLOWANCE_PERCENT_OF_BASIC: 16.67,
    PERFORMANCE_BONUS_PERCENT_OF_BASIC: 8.33,
    LTA_PERCENT_OF_BASIC: 8.33,
    PF_EMPLOYEE_PERCENT_OF_BASIC: 12.0,
    PF_EMPLOYER_PERCENT_OF_BASIC: 12.0,
    PROFESSIONAL_TAX_FLAT: 200.0
  };

  /**
   * Rounds a number to exactly two decimal places.
   * @param {number} num
   * @returns {number}
   */
  static round2(num) {
    return Math.round((num + Number.EPSILON) * 100) / 100;
  }

  /**
   * Computes detailed salary components given a monthly wage.
   * Note: The wireframe prints Fixed Allowance as 2918.00 for a ?50,000 wage,
   * which does not reconcile with the other printed values. The written spec —
   * "fixed allowance = wage - total of all components" — wins as specified.
   *
   * @param {number} monthlyWage
   * @returns {Array<{ name: string, category: string, computationType: string, rate: number, amount: number, sortOrder: number }>}
   */
  static computeBreakdown(monthlyWage) {
    const wage = SalaryCalculator.round2(Number(monthlyWage));
    if (wage <= 0 || isNaN(wage)) {
      throw new BusinessRuleError("Monthly wage must be a positive number");
    }

    const cfg = SalaryCalculator.CONFIG;
    const basic = SalaryCalculator.round2((wage * cfg.BASIC_PERCENT_OF_WAGE) / 100);
    const hra = SalaryCalculator.round2((basic * cfg.HRA_PERCENT_OF_BASIC) / 100);
    const standardAllowance = SalaryCalculator.round2((basic * cfg.STANDARD_ALLOWANCE_PERCENT_OF_BASIC) / 100);
    const performanceBonus = SalaryCalculator.round2((basic * cfg.PERFORMANCE_BONUS_PERCENT_OF_BASIC) / 100);
    const lta = SalaryCalculator.round2((basic * cfg.LTA_PERCENT_OF_BASIC) / 100);

    const subtotalEarnings = SalaryCalculator.round2(basic + hra + standardAllowance + performanceBonus + lta);
    // Remainder absorbs rounding errors to ensure exact equality with monthly wage
    const fixedAllowance = SalaryCalculator.round2(wage - subtotalEarnings);

    if (fixedAllowance < 0) {
      throw new BusinessRuleError("Salary breakdown error: computed fixed allowance cannot be negative");
    }

    const pfEmployee = SalaryCalculator.round2((basic * cfg.PF_EMPLOYEE_PERCENT_OF_BASIC) / 100);
    const pfEmployer = SalaryCalculator.round2((basic * cfg.PF_EMPLOYER_PERCENT_OF_BASIC) / 100);
    const professionalTax = cfg.PROFESSIONAL_TAX_FLAT;

    const components = [
      { name: "Basic", category: SalaryCategory.EARNING, computationType: SalaryComputationType.PERCENT_OF_WAGE, rate: cfg.BASIC_PERCENT_OF_WAGE, amount: basic, sortOrder: 1 },
      { name: "House Rent Allowance", category: SalaryCategory.EARNING, computationType: SalaryComputationType.PERCENT_OF_BASIC, rate: cfg.HRA_PERCENT_OF_BASIC, amount: hra, sortOrder: 2 },
      { name: "Standard Allowance", category: SalaryCategory.EARNING, computationType: SalaryComputationType.PERCENT_OF_BASIC, rate: cfg.STANDARD_ALLOWANCE_PERCENT_OF_BASIC, amount: standardAllowance, sortOrder: 3 },
      { name: "Performance Bonus", category: SalaryCategory.EARNING, computationType: SalaryComputationType.PERCENT_OF_BASIC, rate: cfg.PERFORMANCE_BONUS_PERCENT_OF_BASIC, amount: performanceBonus, sortOrder: 4 },
      { name: "Leave Travel Allowance", category: SalaryCategory.EARNING, computationType: SalaryComputationType.PERCENT_OF_BASIC, rate: cfg.LTA_PERCENT_OF_BASIC, amount: lta, sortOrder: 5 },
      { name: "Fixed Allowance", category: SalaryCategory.EARNING, computationType: SalaryComputationType.REMAINDER, rate: 0.0, amount: fixedAllowance, sortOrder: 6 },
      { name: "Provident Fund (Employee)", category: SalaryCategory.DEDUCTION, computationType: SalaryComputationType.PERCENT_OF_BASIC, rate: cfg.PF_EMPLOYEE_PERCENT_OF_BASIC, amount: pfEmployee, sortOrder: 7 },
      { name: "Provident Fund (Employer)", category: SalaryCategory.EMPLOYER_CONTRIBUTION, computationType: SalaryComputationType.PERCENT_OF_BASIC, rate: cfg.PF_EMPLOYER_PERCENT_OF_BASIC, amount: pfEmployer, sortOrder: 8 },
      { name: "Professional Tax", category: SalaryCategory.DEDUCTION, computationType: SalaryComputationType.FIXED, rate: 0.0, amount: professionalTax, sortOrder: 9 }
    ];

    // Invariant check: total earnings must equal wage exactly
    const totalEarnings = components
      .filter((c) => c.category === SalaryCategory.EARNING)
      .reduce((sum, c) => SalaryCalculator.round2(sum + c.amount), 0);

    if (totalEarnings !== wage) {
      throw new BusinessRuleError(`Salary invariant violated: total earnings (${totalEarnings}) does not equal wage (${wage})`);
    }

    return components;
  }
}
