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
      
      // Use heading instead of button text to avoid multiple elements
      expect(screen.getByRole('heading', { name: 'Sign In' })).toBeInTheDocument();
      expect(screen.getByPlaceholderText('example@email.com')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Minimum of 6 Characters is Required')).toBeInTheDocument();
      expect(screen.queryByPlaceholderText('ChooseYourUserName')).not.toBeInTheDocument();
    });

    test('switches to sign up form when toggle button clicked', async () => {
      render(<Auth />);
      
      const toggleButton = screen.getByText(/Switch to Sign Up/i);
      await userEvent.click(toggleButton);
      
      // Use heading instead of button text
      expect(screen.getByRole('heading', { name: 'Sign Up' })).toBeInTheDocument();
      expect(screen.getByPlaceholderText('ChooseYourUserName')).toBeInTheDocument();
      expect(screen.getByText(/Switch to Sign In/i)).toBeInTheDocument();
    });
  });

  describe('Email Validation', () => {
    test('shows error for empty email', async () => {
      render(<Auth />);
      
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
      const { supabase } = require('../../lib-supa/v1/api');
      supabase.auth.signInWithPassword.mockResolvedValue({
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
      
      await waitFor(() => {
        expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
          email: 'valid@email.com',
          password: 'password123'
        });
      });
    });

    test('email regex correctly validates', () => {
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
      await userEvent.type(passwordInput, '12345');
      
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await userEvent.click(submitButton);
      
      expect(console.log).toHaveBeenCalledWith('Password must be at least 6 characters');
    });

    test('accepts password with exactly 6 characters', async () => {
      const { supabase } = require('../../lib-supa/v1/api');
      supabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: { email: 'test@email.com' } },
        error: null
      });

      render(<Auth />);
      
      const emailInput = screen.getByPlaceholderText('example@email.com');
      const passwordInput = screen.getByPlaceholderText('Minimum of 6 Characters is Required');
      
      await userEvent.type(emailInput, 'test@email.com');
      await userEvent.type(passwordInput, 'pass12');
      
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await userEvent.click(submitButton);
      
      await waitFor(() => {
        expect(supabase.auth.signInWithPassword).toHaveBeenCalled();
      });
    });

    test('accepts password with more than 6 characters', async () => {
      const { supabase } = require('../../lib-supa/v1/api');
      supabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: { email: 'test@email.com' } },
        error: null
      });

      render(<Auth />);
      
      const emailInput = screen.getByPlaceholderText('example@email.com');
      const passwordInput = screen.getByPlaceholderText('Minimum of 6 Characters is Required');
      
      await userEvent.type(emailInput, 'test@email.com');
      await userEvent.type(passwordInput, 'verylongpassword123');
      
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await userEvent.click(submitButton);
      
      await waitFor(() => {
        expect(supabase.auth.signInWithPassword).toHaveBeenCalled();
      });
    });
  });

  describe('Username Validation (Sign Up Only)', () => {
    beforeEach(async () => {
      render(<Auth />);
      const toggleButton = screen.getByText(/Switch to Sign Up/i);
      await userEvent.click(toggleButton);
    });

    test('allows empty username in sign up', async () => {
      const { supabase } = require('../../lib-supa/v1/api');
      supabase.auth.signUp.mockResolvedValue({
        data: { user: { email: 'test@email.com' } },
        error: null
      });

      const usernameInput = screen.getByPlaceholderText('ChooseYourUserName');
      const emailInput = screen.getByPlaceholderText('example@email.com');
      const passwordInput = screen.getByPlaceholderText('Minimum of 6 Characters is Required');
      
      // Don't type anything in username - leave it empty
      await userEvent.type(emailInput, 'test@email.com');
      await userEvent.type(passwordInput, 'password123');
      
      const submitButton = screen.getByRole('button', { name: /sign up/i });
      await userEvent.click(submitButton);
      
      await waitFor(() => {
        expect(supabase.auth.signUp).toHaveBeenCalled();
      });
    });

    test('includes username in signUp data when provided', async () => {
      const { supabase } = require('../../lib-supa/v1/api');
      supabase.auth.signUp.mockResolvedValue({
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
      
      await waitFor(() => {
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
  });

  describe('Rate Limiting', () => {
    const { authRateLimiter01 } = require('../../lib-supa/v1.1/loginRateLimiter');

    test('rate limiter is called on submit', async () => {
      const { supabase } = require('../../lib-supa/v1/api');
      supabase.auth.signInWithPassword.mockResolvedValue({
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
      
      await waitFor(() => {
        expect(authRateLimiter01.check).toHaveBeenCalledWith('test@email.com', 5, 15*60*1000);
      });
    });

    test('shows error when rate limited', async () => {
      authRateLimiter01.check.mockReturnValue({ 
        limited: true, 
        remainingTime: 5 * 60 * 1000
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
      
      sanitizeInput.mockClear();
      
      await userEvent.type(emailInput, 'test@email.com');
      await userEvent.type(passwordInput, 'password123');
      
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await userEvent.click(submitButton);
      
      expect(sanitizeInput).toHaveBeenCalledWith('test@email.com');
      expect(sanitizeInput).toHaveBeenCalledWith('password123');
    });

    test('sanitizeInput trims whitespace', () => {
      const { sanitizeInput } = require('../../lib-supa/v1/security');
      
      expect(sanitizeInput('  test@email.com  ')).toBe('test@email.com');
      expect(sanitizeInput('  password123  ')).toBe('password123');
    });
  });

  describe('Form Reset', () => {
    test('clears form after successful sign in', async () => {
      const { supabase } = require('../../lib-supa/v1/api');
      
      supabase.auth.signInWithPassword.mockResolvedValue({
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
      
      // Wait for form to clear - give it more time
      await waitFor(() => {
        expect(emailInput).toHaveValue('');
        expect(passwordInput).toHaveValue('');
      }, { timeout: 2000 });
    });

    test('clears form after successful sign up', async () => {
      render(<Auth />);
      const toggleButton = screen.getByText(/Switch to Sign Up/i);
      await userEvent.click(toggleButton);
      
      const { supabase } = require('../../lib-supa/v1/api');
      
      supabase.auth.signUp.mockResolvedValue({
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
      
      await waitFor(() => {
        expect(usernameInput).toHaveValue('');
        expect(emailInput).toHaveValue('');
        expect(passwordInput).toHaveValue('');
      });
    });
  });

  describe('Error Handling', () => {
    test('handles sign in error from Supabase', async () => {
      const { supabase } = require('../../lib-supa/v1/api');
      
      supabase.auth.signInWithPassword.mockResolvedValue({
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
      
      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith(
          'Sign in error: ',
          'Invalid login credentials'
        );
      });
    });

    test('handles sign up error from Supabase', async () => {
      render(<Auth />);
      const toggleButton = screen.getByText(/Switch to Sign Up/i);
      await userEvent.click(toggleButton);
      
      const { supabase } = require('../../lib-supa/v1/api');
      
      supabase.auth.signUp.mockResolvedValue({
        data: null,
        error: { message: 'User already registered' }
      });

      const emailInput = screen.getByPlaceholderText('example@email.com');
      const passwordInput = screen.getByPlaceholderText('Minimum of 6 Characters is Required');
      
      await userEvent.type(emailInput, 'existing@email.com');
      await userEvent.type(passwordInput, 'password123');
      
      const submitButton = screen.getByRole('button', { name: /sign up/i });
      await userEvent.click(submitButton);
      
      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith(
          'Sign up error: ',
          'User already registered'
        );
      });
    });
  });
});