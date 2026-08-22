import { describe, it, expect } from "vitest";
import { LoginIdGenerator } from "../src/utils/LoginIdGenerator.js";

describe("LoginIdGenerator", () => {
  it("should derive company code correctly", () => {
    expect(LoginIdGenerator.deriveCompanyCode("Odoo India")).toBe("OI");
    expect(LoginIdGenerator.deriveCompanyCode("Tata Consultancy Services")).toBe("TC");
    expect(LoginIdGenerator.deriveCompanyCode("Google")).toBe("GO");
  });

  it("should format standardized login ID", () => {
    const loginId = LoginIdGenerator.format("OI", "John", "Doe", 2022, 1);
    expect(loginId).toBe("OIJODO20220001");

    const loginId2 = LoginIdGenerator.format("OI", "Amit", "Sharma", 2024, 42);
    expect(loginId2).toBe("OIAMSH20240042");
  });
});
