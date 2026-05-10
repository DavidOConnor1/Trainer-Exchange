import {
  validateEmail,
  validatePassword,
  validateName,
  getPasswordStrengthIndicator,
} from "../../../../src/features/auth/components/Form/FormValidation";

// We don't need to mock securityService because its methods are pure functions;
// the tests will call the real validation logic.

describe("FormValidation", () => {
  describe("validateEmail", () => {
    it("should return error for empty email", () => {
      expect(validateEmail("")).toBe("Email is required");
      expect(validateEmail(null)).toBe("Email is required");
    });

    it("should return error for invalid email", () => {
      expect(validateEmail("notanemail")).toBe(
        "Please enter a valid email address",
      );
      expect(validateEmail("missing@domain")).toBe(
        "Please enter a valid email address",
      );
    });

    it("should return null for valid email", () => {
      expect(validateEmail("test@example.com")).toBeNull();
      expect(validateEmail("user.name+tag@domain.co")).toBeNull();
    });
  });

  describe("validatePassword", () => {
    it("should return error for empty password", () => {
      expect(validatePassword("")).toBe("Password is required");
      expect(validatePassword(null)).toBe("Password is required");
    });

    it("should return error for short password", () => {
      expect(validatePassword("Abc123")).toBe(
        "Password must be at least 8 characters",
      );
    });

    it("should return error for too long password", () => {
      const longPassword = "a".repeat(129);
      expect(validatePassword(longPassword)).toBe(
        "Password is too long (max 128 characters)",
      );
    });

    it("should return null for valid password", () => {
      expect(validatePassword("ValidPass1")).toBeNull();
    });
  });

  describe("validateName", () => {
    it("should return null when not required and empty", () => {
      expect(validateName("", false)).toBeNull();
    });

    it("should return error when required and empty", () => {
      expect(validateName("", true)).toBe("Name is required");
    });

    it("should return error when required and too short after sanitization", () => {
      // sanitizeName might remove all chars, resulting in length < 2
      expect(validateName("a", true)).toBe(
        "Name must be at least 2 characters",
      );
    });

    it("should return null for valid name", () => {
      expect(validateName("John", true)).toBeNull();
      expect(validateName("John", false)).toBeNull();
    });
  });

  describe("getPasswordStrengthIndicator", () => {
    it("should return null for empty password", () => {
      expect(getPasswordStrengthIndicator("")).toBeNull();
    });

    it("should return a strength object for a password", () => {
      const result = getPasswordStrengthIndicator("StrongP@ss1");
      expect(result).toHaveProperty("level");
      expect(result).toHaveProperty("color");
      expect(result).toHaveProperty("text");
      expect(result).toHaveProperty("requirements");
      expect(result).toHaveProperty("metCount");
    });
  });
});
