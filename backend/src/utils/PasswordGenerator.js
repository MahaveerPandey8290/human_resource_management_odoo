import crypto from "crypto";

/**
 * Generates secure temporary passwords.
 */
export class PasswordGenerator {
  /**
   * Generates a 12-character password containing uppercase, lowercase, numbers, and symbols.
   * @param {number} [length=12]
   * @returns {string}
   */
  static generate(length = 12) {
    const uppers = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    const lowers = "abcdefghijkmnopqrstuvwxyz";
    const digits = "23456789";
    const specials = "@#$%&*!";
    const all = uppers + lowers + digits + specials;

    // Ensure at least one from each class
    const password = [
      uppers[crypto.randomInt(uppers.length)],
      lowers[crypto.randomInt(lowers.length)],
      digits[crypto.randomInt(digits.length)],
      specials[crypto.randomInt(specials.length)]
    ];

    for (let i = password.length; i < length; i++) {
      password.push(all[crypto.randomInt(all.length)]);
    }

    // Shuffle
    for (let i = password.length - 1; i > 0; i--) {
      const j = crypto.randomInt(i + 1);
      [password[i], password[j]] = [password[j], password[i]];
    }

    return password.join("");
  }
}
