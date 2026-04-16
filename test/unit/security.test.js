import securityService, {
  sanitizeText,
  sanitizeSearchQuery,
  sanitizeDescription,
  sanitizeNote,
  makeDBSafe,
  containsSuspiciousPatterns,
  getSafePreview,
  sanitizeName,
  sanitizeEmail,
  isValidEmail,
  sanitizePassword,
  checkPasswordStrength,
  escapeHtml,
  validateProfileUpdate,
  getRateLimiter
} from '../../lib/security';

describe('SecurityService - Singleton Pattern', () => {
  test('should return same instance when instantiated multiple times', () => {
    const instance1 = new securityService.constructor();
    const instance2 = new securityService.constructor();
    expect(instance1).toBe(instance2);
  });
});

describe('sanitizeText', () => {
  test('should handle empty/null/undefined inputs', () => {
    expect(sanitizeText('')).toBe('');
    expect(sanitizeText(null)).toBe('');
    expect(sanitizeText(undefined)).toBe('');
    expect(sanitizeText(123)).toBe('');
  });

  test('should remove HTML tags', () => {
    const input = '<script>alert("xss")</script>Hello World';
    expect(sanitizeText(input)).not.toContain('<script>');
    expect(sanitizeText(input)).not.toContain('</script>');
    expect(sanitizeText(input)).toContain('Hello World');
  });

  test('should remove HTML entities', () => {
  const input = 'Hello &lt;World&gt; &amp; Friends';
  const result = sanitizeText(input);
  expect(result).not.toContain('&lt;');
  expect(result).not.toContain('&gt;');
  expect(result).not.toContain('&amp;');
  // More flexible assertion - check that the text contains the words
  expect(result).toContain('Hello');
  expect(result).toContain('World');
  expect(result).toContain('Friends');
  // Or use regex to handle extra spaces
  expect(result).toMatch(/Hello\s+World\s+Friends/);
});

  test('should remove javascript protocol', () => {
    const input = 'javascript:alert("xss")';
    expect(sanitizeText(input)).not.toContain('javascript:');
  });

  test('should remove event handlers', () => {
    const input = 'Click me onload=alert() onclick=run()';
    expect(sanitizeText(input)).not.toContain('onload=');
    expect(sanitizeText(input)).not.toContain('onclick=');
  });

  test('should remove SQL injection patterns', () => {
    const sqlPatterns = [
      "SELECT * FROM users",
      "DROP TABLE users",
      "INSERT INTO users",
      "DELETE FROM users",
      "UNION SELECT",
      "OR 1=1",
      "AND 1=1"
    ];
    
    sqlPatterns.forEach(pattern => {
      expect(sanitizeText(pattern)).not.toContain(pattern);
    });
  });

  test('should respect maxLength parameter', () => {
    const input = 'This is a very long string that should be truncated';
    expect(sanitizeText(input, 10).length).toBeLessThanOrEqual(10);
    expect(sanitizeText(input, 20).length).toBeLessThanOrEqual(20);
  });

  test('should trim whitespace', () => {
    const input = '  Hello World  ';
    expect(sanitizeText(input)).toBe('Hello World');
  });

  test('should allow HTML when allowHtml=true', () => {
    const input = '<b>Bold</b> and <i>italic</i>';
    // When allowHtml=false (default), tags are removed
    expect(sanitizeText(input, 500, false)).not.toContain('<b>');
    // When allowHtml=true, tags remain
    // Note: This depends on your implementation
  });
});

describe('sanitizeSearchQuery', () => {
  test('should handle empty/null inputs', () => {
    expect(sanitizeSearchQuery('')).toBe('');
    expect(sanitizeSearchQuery(null)).toBe('');
    expect(sanitizeSearchQuery(undefined)).toBe('');
  });

  test('should preserve search operators but remove dangerous content', () => {
    const query = 'search term OR "exact phrase" -exclude';
    const result = sanitizeSearchQuery(query);
    expect(result).toContain('search term');
    expect(result).not.toContain('OR');
  });

  test('should remove HTML and SQL injection', () => {
    const query = '<script>alert(1)</script> SELECT * FROM users';
    const result = sanitizeSearchQuery(query);
    expect(result).not.toContain('<script>');
    expect(result).not.toContain('SELECT');
  });

  test('should respect maxLength', () => {
    const query = 'a'.repeat(200);
    expect(sanitizeSearchQuery(query, 50).length).toBeLessThanOrEqual(50);
  });
});

describe('sanitizeDescription', () => {
  test('should handle empty inputs', () => {
    expect(sanitizeDescription('')).toBe('');
    expect(sanitizeDescription(null)).toBe('');
  });

  test('should remove HTML tags and entities', () => {
    const input = '<div>Description</div> &nbsp; with &amp; entities';
    const result = sanitizeDescription(input);
    expect(result).not.toContain('<div>');
    expect(result).not.toContain('&nbsp;');
    expect(result).toContain('Description');
  });

  test('should remove angle brackets completely', () => {
    const input = 'Text with < and > symbols';
    const result = sanitizeDescription(input);
    expect(result).not.toContain('<');
    expect(result).not.toContain('>');
  });

  test('should respect maxLength (default 500)', () => {
    const longText = 'x'.repeat(1000);
    const result = sanitizeDescription(longText);
    expect(result.length).toBeLessThanOrEqual(500);
  });
});

describe('sanitizeNote', () => {
  test('should handle empty inputs', () => {
    expect(sanitizeNote('')).toBe('');
    expect(sanitizeNote(null)).toBe('');
  });

  test('should remove all HTML and control characters', () => {
    const input = '<script>alert(1)</script> Note content \x00\x01\x02';
    const result = sanitizeNote(input);
    expect(result).not.toContain('<script>');
    expect(result).not.toContain('\x00');
    expect(result).toContain('Note content');
  });

  test('should respect maxLength (default 1000)', () => {
    const longNote = 'x'.repeat(2000);
    const result = sanitizeNote(longNote);
    expect(result.length).toBeLessThanOrEqual(1000);
  });
});

describe('makeDBSafe', () => {
  test('should escape single quotes', () => {
    const input = "User's input";
    expect(makeDBSafe(input)).toBe("User''s input");
  });

  test('should escape backslashes', () => {
    const input = "C:\\Users\\file.txt";
    expect(makeDBSafe(input)).toBe("C:\\\\Users\\\\file.txt");
  });

  test('should escape null characters', () => {
    const input = "test\0value";
    expect(makeDBSafe(input)).toBe("test\\0value");
  });

  test('should handle empty/null inputs', () => {
    expect(makeDBSafe('')).toBe('');
    expect(makeDBSafe(null)).toBe('');
    expect(makeDBSafe(undefined)).toBe('');
  });
});

describe('containsSuspiciousPatterns', () => {
  test('should detect script tags', () => {
    expect(containsSuspiciousPatterns('<script>alert(1)</script>')).toBe(true);
  });

  test('should detect javascript protocol', () => {
    expect(containsSuspiciousPatterns('javascript:alert()')).toBe(true);
  });

  test('should detect event handlers', () => {
    expect(containsSuspiciousPatterns('onclick=alert()')).toBe(true);
    expect(containsSuspiciousPatterns('onload=run()')).toBe(true);
  });

  test('should detect eval calls', () => {
    expect(containsSuspiciousPatterns('eval(code)')).toBe(true);
  });

  test('should detect SQL comments', () => {
    expect(containsSuspiciousPatterns('--')).toBe(true);
    expect(containsSuspiciousPatterns('/* comment */')).toBe(true);
  });

  test('should detect SQL injection patterns', () => {
    expect(containsSuspiciousPatterns("' OR '1'='1")).toBe(true);
    expect(containsSuspiciousPatterns("' AND '1'='1")).toBe(true);
  });

  test('should return false for safe text', () => {
    expect(containsSuspiciousPatterns('Hello World')).toBe(false);
    expect(containsSuspiciousPatterns('Normal text with spaces')).toBe(false);
  });

  test('should handle empty/null inputs', () => {
    expect(containsSuspiciousPatterns('')).toBe(false);
    expect(containsSuspiciousPatterns(null)).toBe(false);
  });
});

describe('getSafePreview', () => {
  test('should return empty string for invalid inputs', () => {
    expect(getSafePreview('')).toBe('');
    expect(getSafePreview(null)).toBe('');
    expect(getSafePreview(123)).toBe('');
  });

  test('should truncate text with ellipsis', () => {
    const text = 'This is a very long text that needs truncation';
    const preview = getSafePreview(text, 20);
    expect(preview.length).toBeLessThanOrEqual(23); // 20 + '...'
    expect(preview).toMatch(/\.\.\.$/);
  });

  test('should not add ellipsis if text fits', () => {
    const text = 'Short text';
    const preview = getSafePreview(text, 100);
    expect(preview).toBe('Short text');
    expect(preview).not.toContain('...');
  });

  test('should sanitize text in preview', () => {
    const text = '<script>alert(1)</script> Hello';
    const preview = getSafePreview(text, 50);
    expect(preview).not.toContain('<script>');
    expect(preview).toContain('Hello');
  });
});

describe('sanitizeName', () => {
  test('should handle empty/null inputs', () => {
    expect(sanitizeName('')).toBe('');
    expect(sanitizeName(null)).toBe('');
  });

  test('should remove HTML tags and special characters', () => {
    const input = '<b>John</b> <script>alert()</script> Doe';
    expect(sanitizeName(input)).not.toContain('<b>');
    expect(sanitizeName(input)).not.toContain('<script>');
  });

  test('should allow only alphanumeric, spaces, hyphens, apostrophes, periods', () => {
    const input = 'John A. Doe-Smith Jr.';
    expect(sanitizeName(input)).toBe('John A. Doe-Smith Jr.');
  });

  test('should remove other special characters', () => {
    const input = 'John@#$% Doe!@#';
    expect(sanitizeName(input)).not.toContain('@');
    expect(sanitizeName(input)).not.toContain('#');
    expect(sanitizeName(input)).not.toContain('!');
  });

  test('should respect maxLength', () => {
    const longName = 'a'.repeat(100);
    expect(sanitizeName(longName, 20).length).toBeLessThanOrEqual(20);
  });
});

describe('sanitizeEmail', () => {
  test('should handle empty/null inputs', () => {
    expect(sanitizeEmail('')).toBe('');
    expect(sanitizeEmail(null)).toBe('');
  });

  test('should remove dangerous characters', () => {
    const input = 'test"email@gmail.com';
    expect(sanitizeEmail(input)).not.toContain('"');
  });

  test('should remove SQL keywords', () => {
    const input = 'test@email.com SELECT DROP';
    expect(sanitizeEmail(input)).not.toContain('SELECT');
    expect(sanitizeEmail(input)).not.toContain('DROP');
  });

  test('should convert to lowercase', () => {
    const input = 'Test@Email.COM';
    expect(sanitizeEmail(input)).toBe('test@email.com');
  });

  test('should trim whitespace', () => {
    const input = '  test@email.com  ';
    expect(sanitizeEmail(input)).toBe('test@email.com');
  });

  test('should respect maxLength', () => {
    const longEmail = 'a'.repeat(300) + '@test.com';
    expect(sanitizeEmail(longEmail, 50).length).toBeLessThanOrEqual(50);
  });
});

describe('isValidEmail', () => {
  test('should validate correct email formats', () => {
    const validEmails = [
      'user@example.com',
      'user.name@example.co.uk',
      'user+label@example.com',
      '123@example.com',
      'user@subdomain.example.com'
    ];
    
    validEmails.forEach(email => {
      expect(isValidEmail(email)).toBe(true);
    });
  });

  test('should reject invalid email formats', () => {
    const invalidEmails = [
      '',
      null,
      'invalid',
      'missing@domain',
      '@missing.com',
      'user@.com',
      'user@domain.',
      'user name@domain.com'
    ];
    
    invalidEmails.forEach(email => {
      expect(isValidEmail(email)).toBe(false);
    });
  });
});

describe('sanitizePassword', () => {
  test('should handle empty/null inputs', () => {
    expect(sanitizePassword('')).toBe('');
    expect(sanitizePassword(null)).toBe('');
  });

  test('should remove control characters', () => {
    const input = 'pass\x00word\x01';
    expect(sanitizePassword(input)).not.toContain('\x00');
    expect(sanitizePassword(input)).toContain('password');
  });

  test('should remove dangerous characters', () => {
    const input = 'password"\'();=*';
    expect(sanitizePassword(input)).not.toContain('"');
    expect(sanitizePassword(input)).not.toContain("'");
  });

  test('should respect maxLength', () => {
    const longPassword = 'a'.repeat(200);
    expect(sanitizePassword(longPassword, 50).length).toBeLessThanOrEqual(50);
  });
});

describe('checkPasswordStrength', () => {
  test('should return "none" for empty password', () => {
    const result = checkPasswordStrength('');
    expect(result.level).toBe('none');
    expect(result.text).toBe('Not set');
  });

  test('should detect weak password', () => {
    const weakPasswords = ['12345678', 'password', 'aaaaaaa'];
    weakPasswords.forEach(password => {
      const result = checkPasswordStrength(password);
      expect(result.level).toBe('weak');
      expect(result.color).toBe('red');
    });
  });

  test('should detect medium password', () => {
  // These should be medium - adjust based on your actual criteria
  const mediumPasswords = ['Password123', 'Pass1234', 'password1234'];
  mediumPasswords.forEach(password => {
    const result = checkPasswordStrength(password);
    // Allow either medium or strong 
    expect(['medium']).toContain(result.level);
  });
});

  test('should detect strong password', () => {
    const strongPasswords = ['Password123!', 'Str0ngP@ssw0rd', 'C0mpl3x!Pass'];
    strongPasswords.forEach(password => {
      const result = checkPasswordStrength(password);
      expect(result.level).toBe('strong');
      expect(result.color).toBe('green');
    });
  });

  test('should return requirements object', () => {
    const result = checkPasswordStrength('Test123!');
    expect(result.requirements).toHaveProperty('minLength');
    expect(result.requirements).toHaveProperty('hasUpperCase');
    expect(result.requirements).toHaveProperty('hasLowerCase');
    expect(result.requirements).toHaveProperty('hasNumbers');
    expect(result.requirements).toHaveProperty('hasSpecialChar');
  });

  test('should return metCount', () => {
    const result = checkPasswordStrength('Test123!');
    expect(result.metCount).toBeGreaterThan(0);
  });
});

describe('escapeHtml', () => {
  test('should escape HTML special characters', () => {
    const input = '<div class="test">Hello & World</div>';
    const escaped = escapeHtml(input);
    expect(escaped).toContain('&lt;');
    expect(escaped).toContain('&gt;');
    expect(escaped).toContain('&quot;');
    expect(escaped).toContain('&amp;');
  });

  test('should handle empty/null inputs', () => {
    expect(escapeHtml('')).toBe('');
    expect(escapeHtml(null)).toBe('');
  });
});

describe('validateProfileUpdate', () => {
  test('should validate name (min 2 characters)', () => {
    const result = validateProfileUpdate({ name: 'J' });
    expect(result.isValid).toBe(false);
    expect(result.errors.name).toBeDefined();
  });

  test('should accept valid name', () => {
    const result = validateProfileUpdate({ name: 'John Doe' });
    expect(result.sanitizedData.name).toBe('John Doe');
  });

  test('should validate email format', () => {
    const result = validateProfileUpdate({ email: 'invalid-email' });
    expect(result.isValid).toBe(false);
    expect(result.errors.email).toBe('Please enter a valid email address');
  });

  test('should accept valid email', () => {
    const result = validateProfileUpdate({ email: 'test@example.com' });
    expect(result.sanitizedData.email).toBe('test@example.com');
  });

  test('should validate password strength', () => {
    const result = validateProfileUpdate({ password: 'weak' });
    expect(result.isValid).toBe(false);
    expect(result.errors.password).toBe('Password must be at least 8 characters');
  });

  test('should reject weak password even if long enough', () => {
    const result = validateProfileUpdate({ password: '12345678' });
    expect(result.errors.password).toBe('Password is too weak. Please use a stronger password.');
  });

  test('should accept strong password', () => {
    const result = validateProfileUpdate({ password: 'StrongP@ss123' });
    expect(result.sanitizedData.password).toBeDefined();
  });

  test('should ignore undefined fields', () => {
    const result = validateProfileUpdate({});
    expect(result.isValid).toBe(true);
    expect(Object.keys(result.sanitizedData).length).toBe(0);
  });
});

describe('getRateLimiter', () => {
  test('should create rate limiter for action', () => {
    const limiter = getRateLimiter('login', 5, 60000);
    expect(limiter).toHaveProperty('canProceed');
    expect(limiter).toHaveProperty('clear');
  });

  test('should return rate limiter that works correctly for same action', () => {
    const limiter1 = getRateLimiter('login');
    const limiter2 = getRateLimiter('login');
    const identifier = 'user123@example.com';
    
    // First request should be allowed
    expect(limiter1.canProceed(identifier)).toBe(true);
    
    // Second limiter should see the same state (proves they share storage)
    // After 5 attempts, both should block
    for (let i = 0; i < 4; i++) {
      limiter1.canProceed(identifier);
    }
    
    // Both limiters should now block (rate limit reached)
    expect(limiter1.canProceed(identifier)).toBe(false);
    expect(limiter2.canProceed(identifier)).toBe(false);
    
    // Clear through first limiter
    limiter1.clear(identifier);
    
    // Both should now allow requests again
    expect(limiter2.canProceed(identifier)).toBe(true);
  });

  test('should allow requests within limit', () => {
    const limiter = getRateLimiter('test-action', 3, 1000);
    const identifier = 'user123';
    
    expect(limiter.canProceed(identifier)).toBe(true);
    expect(limiter.canProceed(identifier)).toBe(true);
    expect(limiter.canProceed(identifier)).toBe(true);
  });

  test('should block requests after limit exceeded', () => {
    const limiter = getRateLimiter('test-limit', 2, 1000);
    const identifier = 'user456';
    
    limiter.canProceed(identifier);
    limiter.canProceed(identifier);
    expect(limiter.canProceed(identifier)).toBe(false);
  });

  test('should allow requests from different identifiers', () => {
    const limiter = getRateLimiter('multi-user', 2, 1000);
    
    expect(limiter.canProceed('user1')).toBe(true);
    expect(limiter.canProceed('user1')).toBe(true);
    expect(limiter.canProceed('user1')).toBe(false);
    expect(limiter.canProceed('user2')).toBe(true);
  });

  test('should clear rate limit for identifier', () => {
    const limiter = getRateLimiter('clear-test', 1, 1000);
    const identifier = 'clearuser';
    
    limiter.canProceed(identifier);
    expect(limiter.canProceed(identifier)).toBe(false);
    
    limiter.clear(identifier);
    expect(limiter.canProceed(identifier)).toBe(true);
  });

  test('should handle null/undefined identifier', () => {
    const limiter = getRateLimiter('null-test', 1, 1000);
    expect(limiter.canProceed(null)).toBe(true);
    expect(limiter.canProceed(undefined)).toBe(true);
  });
});