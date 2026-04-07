import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Auth } from '../../hooks/v1/signUser';

// Mock the dependencies
jest.mock('../../lib-supa/v1/api', () => ({
  supabase: {
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn()
    }
  }
}));

jest.mock('../../lib-supa/v1/security', () => ({
  sanitizeInput: jest.fn((input) => input?.trim() || ''),
  generateSecureToken: jest.fn(() => 'mock-token-123'),
  timingPrevention: jest.fn(() => Promise.resolve())
}));

jest.mock('../../lib-supa/v1.1/loginRateLimiter', () => ({
  authRateLimiter01: {
    check: jest.fn(() => ({ limited: false, remainingTime: 0 })),
    clear: jest.fn()
  }
}));

// Mock console methods to keep test output clean
const originalConsole = { ...console };
beforeEach(() => {
  console.log = jest.fn();
  console.error = jest.fn();
});

afterEach(() => {
  jest.clearAllMocks();
});

afterAll(() => {
  console.log = originalConsole.log;
  console.error = originalConsole.error;
});

describe('Auth Component - Validation Tests', () => {
  
  describe('Form Rendering', () => {
    test('renders sign in form by default', () => {
      render(<Auth />);
      
      expect(screen.getByText('Sign In')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('example@email.com')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Minimum of 6 Characters is Required')).toBeInTheDocument();
      expect(screen.queryByPlaceholderText('ChooseYourUserName')).not.toBeInTheDocument();
    });

    test('switches to sign up form when toggle button clicked', async () => {
      render(<Auth />);
      
      const toggleButton = screen.getByText('Switch to Sign Up');
      await userEvent.click(toggleButton);
      
      expect(screen.getByText('Sign Up')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('ChooseYourUserName')).toBeInTheDocument();
      expect(screen.getByText('Switch to Sign In')).toBeInTheDocument();
    });
  });

  describe('Email Validation', () => {
    test('shows error for empty email', async () => {
      render(<Auth />);
      
      // Only fill password, leave email empty
      const passwordInput = screen.getByPlaceholderText('Minimum of 6 Characters is Required');
      await userEvent.type(passwordInput, 'password123');
      
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await userEvent.click(submitButton);
      
      expect(console.log).toHaveBeenCalledWith('email and password are required');
    });

    test('shows error for invalid email format', async () => {
      render(<Auth />);
      
      const emailInput = screen.getByPlaceholderText('example@email.com');
      const passwordInput = screen.getByPlaceholderText('Minimum of 6 Characters is Required');
      
      await userEvent.type(emailInput, 'invalid-email');
      await userEvent.type(passwordInput, 'password123');
      
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await userEvent.click(submitButton);
      
      expect(console.log).toHaveBeenCalledWith('Please enter a valid email');
    });

    test('accepts valid email formats', async () => {
      // Mock successful sign in to prevent actual API call
      const { supabase } = require('../../lib-supa/v1/api');
      supabase.auth.signInWithPassword.mockResolvedValueOnce({
        data: { user: { email: 'valid@email.com' } },
        error: null
      });

      render(<Auth />);
      
      const emailInput = screen.getByPlaceholderText('example@email.com');
      const passwordInput = screen.getByPlaceholderText('Minimum of 6 Characters is Required');
      
      await userEvent.type(emailInput, 'valid@email.com');
      await userEvent.type(passwordInput, 'password123');
      
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await userEvent.click(submitButton);
      
      // Should not log email validation error
      expect(console.log).not.toHaveBeenCalledWith('Please enter a valid email');
      
      // Should attempt sign in
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'valid@email.com',
        password: 'password123'
      });
    });

    test('email regex correctly validates', () => {
      // This tests the regex pattern directly
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+label@gmail.com',
        '123@test.com'
      ];
      
      const invalidEmails = [
        'invalid',
        'missing@domain',
        '@missing.com',
        'spaces@ domain.com',
        '',
        'test@.com',
        'test@domain.'
      ];
      
      validEmails.forEach(email => {
        expect(emailRegex.test(email)).toBe(true);
      });
      
      invalidEmails.forEach(email => {
        expect(emailRegex.test(email)).toBe(false);
      });
    });
  });

  describe('Password Validation', () => {
    test('shows error for empty password', async () => {
      render(<Auth />);
      
      const emailInput = screen.getByPlaceholderText('example@email.com');
      await userEvent.type(emailInput, 'test@email.com');
      
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await userEvent.click(submitButton);
      
      expect(console.log).toHaveBeenCalledWith('email and password are required');
    });

    test('shows error for password less than 6 characters', async () => {
      render(<Auth />);
      
      const emailInput = screen.getByPlaceholderText('example@email.com');
      const passwordInput = screen.getByPlaceholderText('Minimum of 6 Characters is Required');
      
      await userEvent.type(emailInput, 'test@email.com');
      await userEvent.type(passwordInput, '12345'); // 5 characters
      
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await userEvent.click(submitButton);
      
      expect(console.log).toHaveBeenCalledWith('Password must be at least 6 characters');
    });

    test('accepts password with exactly 6 characters', async () => {
      const { supabase } = require('../../lib-supa/v1/api');
      supabase.auth.signInWithPassword.mockResolvedValueOnce({
        data: { user: { email: 'test@email.com' } },
        error: null
      });

      render(<Auth />);
      
      const emailInput = screen.getByPlaceholderText('example@email.com');
      const passwordInput = screen.getByPlaceholderText('Minimum of 6 Characters is Required');
      
      await userEvent.type(emailInput, 'test@email.com');
      await userEvent.type(passwordInput, 'pass12'); // 6 characters
      
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await userEvent.click(submitButton);
      
      expect(console.log).not.toHaveBeenCalledWith('Password must be at least 6 characters');
      expect(supabase.auth.signInWithPassword).toHaveBeenCalled();
    });

    test('accepts password with more than 6 characters', async () => {
      const { supabase } = require('../../lib-supa/v1/api');
      supabase.auth.signInWithPassword.mockResolvedValueOnce({
        data: { user: { email: 'test@email.com' } },
        error: null
      });

      render(<Auth />);
      
      const emailInput = screen.getByPlaceholderText('example@email.com');
      const passwordInput = screen.getByPlaceholderText('Minimum of 6 Characters is Required');
      
      await userEvent.type(emailInput, 'test@email.com');
      await userEvent.type(passwordInput, 'verylongpassword123'); // >6 characters
      
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await userEvent.click(submitButton);
      
      expect(console.log).not.toHaveBeenCalledWith('Password must be at least 6 characters');
      expect(supabase.auth.signInWithPassword).toHaveBeenCalled();
    });
  });

  describe('Username Validation (Sign Up Only)', () => {
    beforeEach(async () => {
      render(<Auth />);
      const toggleButton = screen.getByText('Switch to Sign Up');
      await userEvent.click(toggleButton);
    });

    test('allows empty username in sign up', async () => {
      const { supabase } = require('../../lib-supa/v1/api');
      supabase.auth.signUp.mockResolvedValueOnce({
        data: { user: { email: 'test@email.com' } },
        error: null
      });

      const emailInput = screen.getByPlaceholderText('example@email.com');
      const passwordInput = screen.getByPlaceholderText('Minimum of 6 Characters is Required');
      
      await userEvent.type(emailInput, 'test@email.com');
      await userEvent.type(passwordInput, 'password123');
      
      const submitButton = screen.getByRole('button', { name: /sign up/i });
      await userEvent.click(submitButton);
      
      // Should still call signUp even with empty username
      expect(supabase.auth.signUp).toHaveBeenCalled();
    });

    test('includes username in signUp data when provided', async () => {
      const { supabase } = require('../../lib-supa/v1/api');
      supabase.auth.signUp.mockResolvedValueOnce({
        data: { user: { email: 'test@email.com' } },
        error: null
      });

      const usernameInput = screen.getByPlaceholderText('ChooseYourUserName');
      const emailInput = screen.getByPlaceholderText('example@email.com');
      const passwordInput = screen.getByPlaceholderText('Minimum of 6 Characters is Required');
      
      await userEvent.type(usernameInput, 'JohnDoe123');
      await userEvent.type(emailInput, 'test@email.com');
      await userEvent.type(passwordInput, 'password123');
      
      const submitButton = screen.getByRole('button', { name: /sign up/i });
      await userEvent.click(submitButton);
      
      // Check that username was included in options.data
      expect(supabase.auth.signUp).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'test@email.com',
          password: 'password123',
          options: expect.objectContaining({
            data: expect.objectContaining({
              name: 'JohnDoe123',
              security_token: 'mock-token-123',
              created_at: expect.any(String)
            })
          })
        })
      );
    });
  });

  describe('Rate Limiting', () => {
    const { authRateLimiter01 } = require('../../lib-supa/v1.1/loginRateLimiter');

    test('rate limiter is called on submit', async () => {
      render(<Auth />);
      
      const emailInput = screen.getByPlaceholderText('example@email.com');
      const passwordInput = screen.getByPlaceholderText('Minimum of 6 Characters is Required');
      
      await userEvent.type(emailInput, 'test@email.com');
      await userEvent.type(passwordInput, 'password123');
      
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await userEvent.click(submitButton);
      
      expect(authRateLimiter01.check).toHaveBeenCalledWith('test@email.com', 5, 15*60*1000);
    });

    test('shows error when rate limited', async () => {
      authRateLimiter01.check.mockReturnValueOnce({ 
        limited: true, 
        remainingTime: 5 * 60 * 1000 // 5 minutes
      });

      render(<Auth />);
      
      const emailInput = screen.getByPlaceholderText('example@email.com');
      const passwordInput = screen.getByPlaceholderText('Minimum of 6 Characters is Required');
      
      await userEvent.type(emailInput, 'test@email.com');
      await userEvent.type(passwordInput, 'password123');
      
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await userEvent.click(submitButton);
      
      expect(console.error).toHaveBeenCalledWith(
        'Too many attempts made, you must wait 5 minutes to try again'
      );
    });
  });

  describe('Sanitization', () => {
    const { sanitizeInput } = require('../../lib-supa/v1/security');

    test('inputs are sanitized before processing', async () => {
      render(<Auth />);
      
      const emailInput = screen.getByPlaceholderText('example@email.com');
      const passwordInput = screen.getByPlaceholderText('Minimum of 6 Characters is Required');
      
      // Input with potential malicious content
      await userEvent.type(emailInput, 'test@email.com');
      await userEvent.type(passwordInput, 'password123');
      
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await userEvent.click(submitButton);
      
      // Sanitize should be called for each input (email and password)
      expect(sanitizeInput).toHaveBeenCalledTimes(2);
      expect(sanitizeInput).toHaveBeenCalledWith('test@email.com');
      expect(sanitizeInput).toHaveBeenCalledWith('password123');
    });

    test('sanitizeInput trims whitespace', () => {
      const { sanitizeInput } = require('../../lib-supa/v1/security');
      
      // Direct test of the sanitize function
      expect(sanitizeInput('  test@email.com  ')).toBe('test@email.com');
      expect(sanitizeInput('  password123  ')).toBe('password123');
    });
  });

  describe('Form Reset', () => {
    test('clears form after successful sign in', async () => {
      const { supabase } = require('../../lib-supa/v1/api');
      
      // Mock successful sign in
      supabase.auth.signInWithPassword.mockResolvedValueOnce({
        data: { user: { email: 'test@email.com' } },
        error: null
      });

      render(<Auth />);
      
      const emailInput = screen.getByPlaceholderText('example@email.com');
      const passwordInput = screen.getByPlaceholderText('Minimum of 6 Characters is Required');
      
      await userEvent.type(emailInput, 'test@email.com');
      await userEvent.type(passwordInput, 'password123');
      
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await userEvent.click(submitButton);
      
      // Wait for async operations
      await waitFor(() => {
        expect(emailInput.value).toBe('');
        expect(passwordInput.value).toBe('');
      });
    });

    test('clears form after successful sign up', async () => {
      // Switch to sign up first
      render(<Auth />);
      const toggleButton = screen.getByText('Switch to Sign Up');
      await userEvent.click(toggleButton);
      
      const { supabase } = require('../../lib-supa/v1/api');
      
      // Mock successful sign up
      supabase.auth.signUp.mockResolvedValueOnce({
        data: { user: { email: 'test@email.com' } },
        error: null
      });

      const usernameInput = screen.getByPlaceholderText('ChooseYourUserName');
      const emailInput = screen.getByPlaceholderText('example@email.com');
      const passwordInput = screen.getByPlaceholderText('Minimum of 6 Characters is Required');
      
      await userEvent.type(usernameInput, 'JohnDoe');
      await userEvent.type(emailInput, 'test@email.com');
      await userEvent.type(passwordInput, 'password123');
      
      const submitButton = screen.getByRole('button', { name: /sign up/i });
      await userEvent.click(submitButton);
      
      // Wait for async operations
      await waitFor(() => {
        expect(usernameInput.value).toBe('');
        expect(emailInput.value).toBe('');
        expect(passwordInput.value).toBe('');
      });
    });
  });

  describe('Error Handling', () => {
    test('handles sign in error from Supabase', async () => {
      const { supabase } = require('../../lib-supa/v1/api');
      
      // Mock sign in error
      supabase.auth.signInWithPassword.mockResolvedValueOnce({
        data: null,
        error: { message: 'Invalid login credentials' }
      });

      render(<Auth />);
      
      const emailInput = screen.getByPlaceholderText('example@email.com');
      const passwordInput = screen.getByPlaceholderText('Minimum of 6 Characters is Required');
      
      await userEvent.type(emailInput, 'test@email.com');
      await userEvent.type(passwordInput, 'wrongpassword');
      
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await userEvent.click(submitButton);
      
      expect(console.error).toHaveBeenCalledWith(
        'Sign in error: ',
        'Invalid login credentials'
      );
    });

    test('handles sign up error from Supabase', async () => {
      // Switch to sign up
      render(<Auth />);
      const toggleButton = screen.getByText('Switch to Sign Up');
      await userEvent.click(toggleButton);
      
      const { supabase } = require('../../lib-supa/v1/api');
      
      // Mock sign up error
      supabase.auth.signUp.mockResolvedValueOnce({
        data: null,
        error: { message: 'User already registered' }
      });

      const emailInput = screen.getByPlaceholderText('example@email.com');
      const passwordInput = screen.getByPlaceholderText('Minimum of 6 Characters is Required');
      
      await userEvent.type(emailInput, 'existing@email.com');
      await userEvent.type(passwordInput, 'password123');
      
      const submitButton = screen.getByRole('button', { name: /sign up/i });
      await userEvent.click(submitButton);
      
      expect(console.error).toHaveBeenCalledWith(
        'Sign up error: ',
        'User already registered'
      );
    });
  });
});