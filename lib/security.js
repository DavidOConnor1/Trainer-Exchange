// lib/security.js
import sanitizeHtml from 'sanitize-html';
/**
 * Security Utilities - Singleton Pattern
 * Prevents re-render loops and ensures single instance
 */

class SecurityService {
  constructor() {
    if (SecurityService.instance) {
      return SecurityService.instance;
    }
    
    // Initialize rate limiters
    this.rateLimiters = new Map();
    SecurityService.instance = this;
  }

  /**
   * Get or create a rate limiter
   */
  getRateLimiter(action, limit = 5, windowMs = 60000) {
    if (!this.rateLimiters.has(action)) {
      this.rateLimiters.set(action, new Map());
    }
    
    const attempts = this.rateLimiters.get(action);
    
    return {
      canProceed: (identifier) => {
        if (!identifier) return true;
        
        const now = Date.now();
        const userAttempts = attempts.get(identifier) || [];
        const recentAttempts = userAttempts.filter(time => now - time < windowMs);
        
        if (recentAttempts.length >= limit) {
          return false;
        }
        
        recentAttempts.push(now);
        attempts.set(identifier, recentAttempts);
        return true;
      },
      
      clear: (identifier) => {
        if (identifier) {
          attempts.delete(identifier);
        }
      }
    };
  }

  /**
   * Sanitize name input
   */
  sanitizeName(input, maxLength = 50) {
    if (!input || typeof input !== 'string') return '';
    
    let sanitized = input
      .replace(/<[^>]*>/g, '')
      .replace(/[<>'"]/g, '')
      .replace(/&[^;]+;/g, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+=/gi, '')
      .trim();
    
    sanitized = sanitized.slice(0, maxLength);
    sanitized = sanitized.replace(/[^a-zA-Z0-9\s\-'\.]/g, '');
    
    return sanitized;
  }

  /**
   * Sanitize email
   */
  sanitizeEmail(input, maxLength = 254) {
    if (!input || typeof input !== 'string') return '';
    
    let sanitized = input
      .replace(/['";()=*]/g, '')
      .replace(/--/g, '')
      .replace(/\b(OR|AND|SELECT|INSERT|UPDATE|DELETE|DROP|UNION|EXEC|SCRIPT|ALERT|CREATE|ALTER|TRUNCATE)\b/gi, '')
      .replace(/javascript:/gi, '')
      .trim()
      .toLowerCase();
    
    sanitized = sanitized.slice(0, maxLength);
    
    return sanitized;
  }

  /**
   * Validate email format
   */
  isValidEmail(email) {
    if (!email) return false;
    const emailRegex = /^[a-zA-Z0-9][a-zA-Z0-9._%+-]*@[a-zA-Z0-9][a-zA-Z0-9.-]*\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  }

  /**
   * Sanitize password
   */
  sanitizePassword(input, maxLength = 128) {
    if (!input || typeof input !== 'string') return '';
    
    let sanitized = input.replace(/[\x00-\x1F\x7F]/g, '');
    sanitized = sanitized.replace(/['";()=*]/g, '');
    sanitized = sanitized.slice(0, maxLength);
    
    return sanitized;
  }

  /**
   * Check password strength
   */
  checkPasswordStrength(password) {
    if (!password) return { level: 'none', color: 'gray', text: 'Not set', requirements: [] };
    
    const requirements = {
      minLength: password.length >= 8,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumbers: /\d/.test(password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };
    
    const metCount = Object.values(requirements).filter(Boolean).length;
    
    let level, color, text;
    if (metCount <= 2) {
      level = 'weak';
      color = 'red';
      text = 'Weak';
    } else if (metCount <= 4) {
      level = 'medium';
      color = 'yellow';
      text = 'Medium';
    } else {
      level = 'strong';
      color = 'green';
      text = 'Strong';
    }
    
    return { level, color, text, requirements, metCount };
  }

  /**
   * Escape HTML
   */
  escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Validate profile update
   */
  validateProfileUpdate(data) {
    const errors = {};
    const sanitizedData = {};
    
    if (data.name !== undefined && data.name !== '') {
      const sanitizedName = this.sanitizeName(data.name);
      if (sanitizedName.length < 2) {
        errors.name = 'Name must be at least 2 characters';
      } else {
        sanitizedData.name = sanitizedName;
      }
    }
    
    if (data.email !== undefined && data.email !== '') {
      const sanitizedEmail = this.sanitizeEmail(data.email);
      if (!this.isValidEmail(sanitizedEmail)) {
        errors.email = 'Please enter a valid email address';
      } else {
        sanitizedData.email = sanitizedEmail;
      }
    }
    
    if (data.password !== undefined && data.password !== '') {
      const sanitizedPassword = this.sanitizePassword(data.password);
      if (sanitizedPassword.length < 8) {
        errors.password = 'Password must be at least 8 characters';
      } else if (sanitizedPassword.length > 128) {
        errors.password = 'Password is too long (max 128 characters)';
      } else {
        const strength = this.checkPasswordStrength(sanitizedPassword);
        if (strength.level === 'weak') {
          errors.password = 'Password is too weak. Please use a stronger password.';
        } else {
          sanitizedData.password = sanitizedPassword;
        }
      }
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      sanitizedData
    };
  }
  /**
   * NEW: General text sanitization for any user input
   * Use this for search queries, descriptions, notes, comments, etc.
   * @param {string} input - The text to sanitize
   * @param {number} maxLength - Maximum allowed length (default: 500)
   * @param {boolean} allowHtml - Whether to allow basic HTML (default: false)
   * @returns {string} - Sanitized text safe for display and storage
   */
  sanitizeText(input, maxLength = 500, allowHtml = false) {
    if (!input || typeof input !== 'string') return '';
    
    let sanitized = input;
    
    if (!allowHtml) {
      // Remove all HTML tags
      sanitized = sanitized.replace(/<[^>]*>/g, '');
      
      // Remove HTML entities
      sanitized = sanitized.replace(/&[^;]+;/g, '');
      
      // Remove dangerous protocols
      sanitized = sanitized.replace(/(javascript|data|vbscript):/gi, '');
      
      // Remove event handlers
      sanitized = sanitized.replace(/on\w+=/gi, '');
      
      // Remove dangerous characters
      sanitized = sanitized.replace(/[<>'"]/g, '');
    }
    
    // Remove SQL injection patterns
    sanitized = sanitized
      .replace(/['";()=*]/g, '')
      .replace(/--/g, '')
      .replace(/\b(OR|AND|SELECT|INSERT|UPDATE|DELETE|DROP|UNION|EXEC|SCRIPT|ALTER|CREATE|TRUNCATE|MERGE|REPLACE)\b/gi, '');
    
    // Remove control characters
    sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');
    
    // Trim whitespace
    sanitized = sanitized.trim();
    
    // Limit length
    sanitized = sanitized.slice(0, maxLength);
    
    return sanitized;
  }

  /**
   * NEW: Sanitize search queries specifically
   * More permissive for search but still safe
   * @param {string} query - The search query
   * @param {number} maxLength - Maximum length (default: 100)
   * @returns {string} - Sanitized search query
   */
  sanitizeSearchQuery(query, maxLength = 100) {
    if (!query || typeof query !== 'string') return '';
    
    let sanitized = query
      // Remove HTML tags
      .replace(/<[^>]*>/g, '')
      // Remove dangerous characters but keep search operators
      .replace(/[<>'"]/g, '')
      // Remove SQL injection patterns
      .replace(/['";()=*]/g, '')
      .replace(/--/g, '')
      .replace(/\b(OR|AND|SELECT|INSERT|UPDATE|DELETE|DROP|UNION|EXEC|SCRIPT|ALTER|CREATE|TRUNCATE)\b/gi, '')
      // Remove dangerous protocols
      .replace(/(javascript|data|vbscript):/gi, '')
      // Remove event handlers
      .replace(/on\w+=/gi, '')
      .trim();
    
    // Limit length
    sanitized = sanitized.slice(0, maxLength);
    
    return sanitized;
  }

  /**
   * NEW: Sanitize collection description
   * Allows slightly more characters but still secure
   * @param {string} description - The collection description
   * @param {number} maxLength - Maximum length (default: 500)
   * @returns {string} - Sanitized description
   */
  sanitizeDescription(description, maxLength = 500) {
    if (!description || typeof description !== 'string') return '';
    
    let sanitized = sanitizeHtml(description, {
      allowedTags: [],
      allowedAttributes: {}
    })
      // Remove HTML entities
      .replace(/&[^;]+;/g, '')
      // Remove executable URL protocols
      .replace(/(?:javascript|data|vbscript):/gi, '')
      // Remove event handlers
      .replace(/on\w+=/gi, '')
      // Remove SQL injection patterns
      .replace(/['";()=*]/g, '')
      .replace(/--/g, '')
      .replace(/\b(OR|AND|SELECT|INSERT|UPDATE|DELETE|DROP|UNION|EXEC|SCRIPT|ALTER|CREATE|TRUNCATE)\b/gi, '')
      // Remove angle brackets completely
      .replace(/[<>]/g, '')
      .trim();

    // Re-apply event handler removal until stable to avoid incomplete multi-character sanitization
    let previous;
    do {
      previous = sanitized;
      sanitized = sanitized.replace(/on\w+=/gi, '');
    } while (sanitized !== previous);
    
    // Limit length
    sanitized = sanitized.slice(0, maxLength);
    
    return sanitized;
  }

  /**
   * NEW: Validate and sanitize card notes or comments
   * @param {string} note - The card note/comment
   * @param {number} maxLength - Maximum length (default: 1000)
   * @returns {string} - Sanitized note
   */
  sanitizeNote(note, maxLength = 1000) {
    if (!note || typeof note !== 'string') return '';
    
    let sanitized = note
      // Remove all HTML tags
      .replace(/<[^>]*>/g, '')
      // Remove HTML entities
      .replace(/&[^;]+;/g, '')
      // Remove javascript protocol
      .replace(/javascript:/gi, '')
      // Remove SQL injection patterns
      .replace(/['";()=*]/g, '')
      .replace(/--/g, '')
      .replace(/\b(OR|AND|SELECT|INSERT|UPDATE|DELETE|DROP|UNION|EXEC|SCRIPT|ALTER|CREATE|TRUNCATE)\b/gi, '')
      // Remove control characters
      .replace(/[\x00-\x1F\x7F]/g, '');

    // Remove event handlers repeatedly to avoid incomplete multi-character sanitization
    let previous;
    do {
      previous = sanitized;
      sanitized = sanitized.replace(/on\w+=/gi, '');
    } while (sanitized !== previous);

    sanitized = sanitized.trim();
    
    // Limit length
    sanitized = sanitized.slice(0, maxLength);
    
    return sanitized;
  }

  /**
   * NEW: Safe string for database queries (additional layer)
   * @param {string} input - The input to make safe for database
   * @returns {string} - Database-safe string
   */
  makeDBSafe(input) {
    if (!input || typeof input !== 'string') return '';
    
    return input
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "''")
      .replace(/\0/g, '\\0');
  }

  /**
   * NEW: Check if text contains suspicious patterns
   * @param {string} input - The text to check
   * @returns {boolean} - True if suspicious patterns found
   */
  containsSuspiciousPatterns(input) {
    if (!input || typeof input !== 'string') return false;
    
    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /onload=/i,
      /onclick=/i,
      /onerror=/i,
      /eval\(/i,
      /document\./i,
      /window\./i,
      /alert\(/i,
      /confirm\(/i,
      /prompt\(/i,
      /--/,
      /;.*--/,
      /'.*OR.*'.*=/i,
      /'.*AND.*'.*=/i,
      /\/\*/,
      /\*\//,
      /@@/,
      /0x[0-9a-f]+/i
    ];
    
    return suspiciousPatterns.some(pattern => pattern.test(input));
  }

  /**
   * NEW: Get text preview with ellipsis (safe for display)
   * @param {string} text - The text to preview
   * @param {number} length - Maximum preview length (default: 100)
   * @returns {string} - Safe text preview
   */
  getSafePreview(text, length = 100) {
    if (!text || typeof text !== 'string') return '';
    
    const sanitized = this.sanitizeText(text, length + 3);
    if (sanitized.length > length) {
      return sanitized.slice(0, length) + '...';
    }
    return sanitized;
  }
}//end instance

// Create and export singleton instance
const securityService = new SecurityService();
export default securityService;

// Export all functions for convenience
export const sanitizeText = (input, maxLength, allowHtml) => securityService.sanitizeText(input, maxLength, allowHtml);
export const sanitizeSearchQuery = (query, maxLength) => securityService.sanitizeSearchQuery(query, maxLength);
export const sanitizeDescription = (description, maxLength) => securityService.sanitizeDescription(description, maxLength);
export const sanitizeNote = (note, maxLength) => securityService.sanitizeNote(note, maxLength);
export const makeDBSafe = (input) => securityService.makeDBSafe(input);
export const containsSuspiciousPatterns = (input) => securityService.containsSuspiciousPatterns(input);
export const getSafePreview = (text, length) => securityService.getSafePreview(text, length);

// Export individual functions for convenience
export const sanitizeName = (input, maxLength) => securityService.sanitizeName(input, maxLength);
export const sanitizeEmail = (input, maxLength) => securityService.sanitizeEmail(input, maxLength);
export const isValidEmail = (email) => securityService.isValidEmail(email);
export const sanitizePassword = (input, maxLength) => securityService.sanitizePassword(input, maxLength);
export const checkPasswordStrength = (password) => securityService.checkPasswordStrength(password);
export const escapeHtml = (str) => securityService.escapeHtml(str);
export const validateProfileUpdate = (data) => securityService.validateProfileUpdate(data);
export const getRateLimiter = (action, limit, windowMs) => securityService.getRateLimiter(action, limit, windowMs);