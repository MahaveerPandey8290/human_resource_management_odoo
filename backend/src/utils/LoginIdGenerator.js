/**
 * Utility for generating standardized HRMS Login IDs.
 */
export class LoginIdGenerator {
  /**
   * Derives a 2-character company code from company name.
   * "Odoo India" -> "OI", "Google" -> "GO"
   * @param {string} companyName
   * @returns {string}
   */
  static deriveCompanyCode(companyName) {
    if (!companyName || typeof companyName !== "string") {
      return "CO";
    }
    const words = companyName.trim().split(/\s+/).filter(Boolean);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return companyName.replace(/[^a-zA-Z]/g, "").slice(0, 2).toUpperCase().padEnd(2, "X");
  }

  /**
   * Formats full Login ID: {companyCode}{first2(firstName)}{first2(lastName)}{year}{serial:4}
   * @param {string} companyCode
   * @param {string} firstName
   * @param {string} lastName
   * @param {number|string} joiningYear
   * @param {number} serial
   * @returns {string}
   */
  static format(companyCode, firstName, lastName, joiningYear, serial) {
    const cleanFirst = (firstName || "XX").replace(/[^a-zA-Z]/g, "").slice(0, 2).toUpperCase().padEnd(2, "X");
    const cleanLast = (lastName || "XX").replace(/[^a-zA-Z]/g, "").slice(0, 2).toUpperCase().padEnd(2, "X");
    const yearStr = String(joiningYear);
    const serialStr = String(serial).padStart(4, "0");
    return `${companyCode.toUpperCase()}${cleanFirst}${cleanLast}${yearStr}${serialStr}`;
  }
}
