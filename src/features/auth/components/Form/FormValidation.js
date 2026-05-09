import securityService from "../../../../../lib/security";

export const validateEmail = (email) => {
  if (!email) return "Email is required";
  const sanitized = securityService.sanitizeEmail(email, 254);
  if (!securityService.isValidEmail(sanitized)) {
    return "Please enter a valid email address";
  }
  return null;
};

export const validatePassword = (password) => {
  if (!password) return "Password is required";
  if (password.length < 8) {
    return "Password must be at least 8 characters";
  }
  if (password.length > 128) {
    return "Password is too long (max 128 characters)";
  }
  return null;
};

export const validateName = (name, isRequired = false) => {
  if (!name && !isRequired) return null;
  if (!name && isRequired) return "Name is required";

  const sanitized = securityService.sanitizeName(name, 50);
  if (sanitized.length < 2 && isRequired) {
    return "Name must be at least 2 characters";
  }
  return null;
};

export const getPasswordStrengthIndicator = (password) => {
  if (!password) return null;
  const strength = securityService.checkPasswordStrength(password);
  return strength;
};
