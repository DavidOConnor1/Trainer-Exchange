// test/unit/validationHelpers.test.js
import { validateEmail, validatePassword } from '../../lib-supa/v1/validation';

describe('Validation Helpers', () => {
  describe('Email Validation', () => {
    test('valid emails return true', () => {
      const validEmails = [
        'user@example.com',
        'user.name@domain.co.uk',
        'user+label@gmail.com'
      ];
      
      validEmails.forEach(email => {
        expect(validateEmail(email)).toBe(true);
      });
    });

    test('invalid emails return false', () => {
      const invalidEmails = [
        'invalid',
        'missing@domain',
        '@missing.com',
        '',
        null,
        undefined
      ];
      
      invalidEmails.forEach(email => {
        expect(validateEmail(email)).toBe(false);
      });
    });
  });

  describe('Password Validation', () => {
    test('passwords 6+ chars return true', () => {
      expect(validatePassword('123456')).toBe(true);
      expect(validatePassword('password123')).toBe(true);
    });

    test('passwords under 6 chars return false', () => {
      expect(validatePassword('12345')).toBe(false);
      expect(validatePassword('')).toBe(false);
    });
  });
});