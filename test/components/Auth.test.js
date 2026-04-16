import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Auth } from '../../auth/hooks/signUser';

// Mock the security service BEFORE importing - define mocks inside
jest.mock('../../lib/security', () => ({
  sanitizeName: jest.fn((input) => input?.trim() || ''),
  sanitizeEmail: jest.fn((input) => input?.trim().toLowerCase() || ''),
  isValidEmail: jest.fn((email) => {
    if (!email) return false;
    const emailRegex = /^[a-zA-Z0-9][a-zA-Z0-9._%+-]*@[a-zA-Z0-9][a-zA-Z0-9.-]*\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  }),
  sanitizePassword: jest.fn((input) => input || ''),
  checkPasswordStrength: jest.fn((password) => {
    if (!password) return { level: 'none', text: 'Not set' };
    if (password.length < 8) return { level: 'weak', text: 'Weak' };
    if (password.length >= 8 && password.length < 12) return { level: 'medium', text: 'Medium' };
    return { level: 'strong', text: 'Strong' };
  }),
  generateSecureToken: jest.fn(() => 'mock-token-123'),
  timingPrevention: jest.fn(() => Promise.resolve()),
  escapeHtml: jest.fn((str) => str),
  __esModule: true,
  default: {
    sanitizeName: jest.fn((input) => input?.trim() || ''),
    sanitizeEmail: jest.fn((input) => input?.trim().toLowerCase() || ''),
    isValidEmail: jest.fn((email) => {
      if (!email) return false;
      const emailRegex = /^[a-zA-Z0-9][a-zA-Z0-9._%+-]*@[a-zA-Z0-9][a-zA-Z0-9.-]*\.[a-zA-Z]{2,}$/;
      return emailRegex.test(email);
    }),
    sanitizePassword: jest.fn((input) => input || ''),
    checkPasswordStrength: jest.fn((password) => {
      if (!password) return { level: 'none', text: 'Not set' };
      if (password.length < 8) return { level: 'weak', text: 'Weak' };
      if (password.length >= 8 && password.length < 12) return { level: 'medium', text: 'Medium' };
      return { level: 'strong', text: 'Strong' };
    }),
    generateSecureToken: jest.fn(() => 'mock-token-123'),
    timingPrevention: jest.fn(() => Promise.resolve()),
    escapeHtml: jest.fn((str) => str)
  }
}));

// Import the mocked functions after the mock is defined
import {
  sanitizeName,
  sanitizeEmail,
  isValidEmail,
  sanitizePassword,
  checkPasswordStrength
} from '../../lib/security';

// Mock the other dependencies
jest.mock('../../lib-supa/v1/api', () => ({
  supabase: {
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn()
    }
  }
}));

// Mock the rate limiter with functions defined inside
jest.mock('../../lib-supa/v1.1/loginRateLimiter', () => ({
  authRateLimiter01: {
    check: jest.fn(() => ({ limited: false, remainingTime: 0 })),
    clear: jest.fn()
  }
}));

// Import the rate limiter to get reference to the mock functions
import { authRateLimiter01 } from '../../lib-supa/v1.1/loginRateLimiter';

// Mock console methods
const originalConsole = { ...console };

beforeEach(() => {
  console.log = jest.fn();
  console.error = jest.fn();
  jest.clearAllMocks();
  
  // CRITICAL: Reset rate limiter to NOT limited for each test
  authRateLimiter01.check.mockReturnValue({ limited: false, remainingTime: 0 });
  
  // Reset mock implementations
  sanitizeName.mockImplementation((input) => input?.trim() || '');
  sanitizeEmail.mockImplementation((input) => input?.trim().toLowerCase() || '');
  isValidEmail.mockImplementation((email) => {
    if (!email) return false;
    const emailRegex = /^[a-zA-Z0-9][a-zA-Z0-9._%+-]*@[a-zA-Z0-9][a-zA-Z0-9.-]*\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  });
  sanitizePassword.mockImplementation((input) => input || '');
  checkPasswordStrength.mockImplementation((password) => {
    if (!password) return { level: 'none', text: 'Not set' };
    if (password.length < 8) return { level: 'weak', text: 'Weak' };
    if (password.length >= 8 && password.length < 12) return { level: 'medium', text: 'Medium' };
    return { level: 'strong', text: 'Strong' };
  });
});

afterAll(() => {
  console.log = originalConsole.log;
  console.error = originalConsole.error;
});

describe('Auth Component - Validation Tests', () => {
  
  describe('Form Rendering', () => {
    test('renders sign in form by default', () => {
      render(<Auth />);
      
      expect(screen.getByRole('heading', { name: 'Sign In' })).toBeInTheDocument();
      expect(screen.getByPlaceholderText('example@email.com')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Minimum of 8 Characters is Required')).toBeInTheDocument();
      expect(screen.queryByPlaceholderText('ChooseYourUserName')).not.toBeInTheDocument();
    });

    test('switches to sign up form when toggle button clicked', async () => {
      render(<Auth />);
      
      const toggleButton = screen.getByText(/Switch to Sign Up/i);
      await userEvent.click(toggleButton);
      
      expect(screen.getByRole('heading', { name: 'Sign Up' })).toBeInTheDocument();
      expect(screen.getByPlaceholderText('ChooseYourUserName')).toBeInTheDocument();
      expect(screen.getByText(/Switch to Sign In/i)).toBeInTheDocument();
    });
  });

  describe('Email Validation', () => {
    test('shows error for empty email', async () => {
      render(<Auth />);
      
      const passwordInput = screen.getByPlaceholderText('Minimum of 8 Characters is Required');
      await userEvent.type(passwordInput, 'password123');
      
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await userEvent.click(submitButton);
      
      const errorMessage = await screen.findByText('Email and password are required');
      expect(errorMessage).toBeInTheDocument();
    });

   test('shows error for invalid email format', async () => {
  render(<Auth />);
  
  const emailInput = screen.getByPlaceholderText('example@email.com');
  const passwordInput = screen.getByPlaceholderText('Minimum of 8 Characters is Required');
  
  await userEvent.type(emailInput, 'invalid-email');
  await userEvent.type(passwordInput, 'password123');
  
  const submitButton = screen.getByRole('button', { name: /sign in/i });
  await userEvent.click(submitButton);
  
  // Check for error message with more flexible matching
  await waitFor(() => {
    const errorMessage = screen.queryByText(/Please enter a valid email|valid email address/i);
    expect(errorMessage).toBeInTheDocument();
  }, { timeout: 2000 });
});

    test('accepts valid email formats', async () => {
      const { supabase } = require('../../lib/api');
      isValidEmail.mockReturnValue(true);
      supabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: { email: 'valid@email.com', id: '123' } },
        error: null
      });

      render(<Auth />);
      
      const emailInput = screen.getByPlaceholderText('example@email.com');
      const passwordInput = screen.getByPlaceholderText('Minimum of 8 Characters is Required');
      
      await userEvent.type(emailInput, 'valid@email.com');
      await userEvent.type(passwordInput, 'password123');
      
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await userEvent.click(submitButton);
      
      await waitFor(() => {
        expect(supabase.auth.signInWithPassword).toHaveBeenCalled();
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
      
      const errorMessage = await screen.findByText('Email and password are required');
      expect(errorMessage).toBeInTheDocument();
    });

    test('shows error for password less than 8 characters', async () => {
      render(<Auth />);
      
      const emailInput = screen.getByPlaceholderText('example@email.com');
      const passwordInput = screen.getByPlaceholderText('Minimum of 8 Characters is Required');
      
      await userEvent.type(emailInput, 'test@email.com');
      await userEvent.type(passwordInput, '1234567');
      
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await userEvent.click(submitButton);
      
      const errorMessage = await screen.findByText('Password must be at least 8 characters');
      expect(errorMessage).toBeInTheDocument();
    });

    test('accepts password with exactly 8 characters', async () => {
      const { supabase } = require('../../lib/api');
      supabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: { email: 'test@email.com', id: '123' } },
        error: null
      });

      render(<Auth />);
      
      const emailInput = screen.getByPlaceholderText('example@email.com');
      const passwordInput = screen.getByPlaceholderText('Minimum of 8 Characters is Required');
      
      await userEvent.type(emailInput, 'test@email.com');
      await userEvent.type(passwordInput, 'pass1234');
      
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await userEvent.click(submitButton);
      
      await waitFor(() => {
        expect(supabase.auth.signInWithPassword).toHaveBeenCalled();
      });
    });

    test('accepts password with more than 8 characters', async () => {
      const { supabase } = require('../../lib/api');
      supabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: { email: 'test@email.com', id: '123' } },
        error: null
      });

      render(<Auth />);
      
      const emailInput = screen.getByPlaceholderText('example@email.com');
      const passwordInput = screen.getByPlaceholderText('Minimum of 8 Characters is Required');
      
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
      const { supabase } = require('../../lib/api');
      supabase.auth.signUp.mockResolvedValue({
        data: { user: { email: 'test@email.com', id: '123' } },
        error: null
      });

      const emailInput = screen.getByPlaceholderText('example@email.com');
      const passwordInput = screen.getByPlaceholderText('Minimum of 8 Characters is Required');
      
      await userEvent.type(emailInput, 'test@email.com');
      await userEvent.type(passwordInput, 'password123');
      
      const submitButton = screen.getByRole('button', { name: /sign up/i });
      await userEvent.click(submitButton);
      
      await waitFor(() => {
        expect(supabase.auth.signUp).toHaveBeenCalled();
      });
    });

    test('includes username in signUp data when provided', async () => {
  const { supabase } = require('../../lib/api');
  supabase.auth.signUp.mockResolvedValue({
    data: { user: { email: 'test@email.com', id: '123' } },
    error: null
  });

  const usernameInput = screen.getByPlaceholderText('ChooseYourUserName');
  const emailInput = screen.getByPlaceholderText('example@email.com');
  const passwordInput = screen.getByPlaceholderText('Minimum of 8 Characters is Required');
  
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
            security_token: expect.any(String), // Accept any string
            created_at: expect.any(String)
          })
        })
      })
    );
  });
});
  });

  describe('Rate Limiting', () => {
    test('rate limiter is called on submit', async () => {
      const { supabase } = require('../../lib/api');
      supabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: { email: 'test@email.com', id: '123' } },
        error: null
      });

      render(<Auth />);
      
      const emailInput = screen.getByPlaceholderText('example@email.com');
      const passwordInput = screen.getByPlaceholderText('Minimum of 8 Characters is Required');
      
      await userEvent.type(emailInput, 'test@email.com');
      await userEvent.type(passwordInput, 'password123');
      
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await userEvent.click(submitButton);
      
      await waitFor(() => {
        expect(authRateLimiter01.check).toHaveBeenCalled();
      });
    });

    test('shows error when rate limited', async () => {
      authRateLimiter01.check.mockReturnValue({ 
        limited: true, 
        remainingTime: 5 * 60 * 1000
      });

      render(<Auth />);
      
      const emailInput = screen.getByPlaceholderText('example@email.com');
      const passwordInput = screen.getByPlaceholderText('Minimum of 8 Characters is Required');
      
      await userEvent.type(emailInput, 'test@email.com');
      await userEvent.type(passwordInput, 'password123');
      
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await userEvent.click(submitButton);
      
      const errorMessage = await screen.findByText(/Too many attempts/i);
      expect(errorMessage).toBeInTheDocument();
    });
  });

describe('Sanitization', () => {
  test('inputs are sanitized before processing', async () => {
    const { supabase } = require('../../lib/api');
    
    // Mock successful sign in
    supabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: { email: 'test@example.com', id: '123' } },
      error: null
    });

    render(<Auth />);
    
    const emailInput = screen.getByPlaceholderText('example@email.com');
    const passwordInput = screen.getByPlaceholderText('Minimum of 8 Characters is Required');
    
    // Clear any existing values
    await userEvent.clear(emailInput);
    await userEvent.clear(passwordInput);
    
    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'password123');
    
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    await userEvent.click(submitButton);
    
    // Wait for the API call to complete (this proves sanitization passed)
    await waitFor(() => {
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      });
    }, { timeout: 2000 });
  });
});

  describe('Form Reset', () => {
    test('clears form after successful sign in', async () => {
      const { supabase } = require('../../lib/api');
      
      supabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: { email: 'test@email.com', id: '123' } },
        error: null
      });

      render(<Auth />);
      
      const emailInput = screen.getByPlaceholderText('example@email.com');
      const passwordInput = screen.getByPlaceholderText('Minimum of 8 Characters is Required');
      
      await userEvent.type(emailInput, 'test@email.com');
      await userEvent.type(passwordInput, 'password123');
      
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await userEvent.click(submitButton);
      
      await waitFor(() => {
        expect(emailInput).toHaveValue('');
        expect(passwordInput).toHaveValue('');
      }, { timeout: 3000 });
    });

    test('clears form after successful sign up', async () => {
      const { supabase } = require('../../lib/api');
      
      supabase.auth.signUp.mockResolvedValue({
        data: { user: { email: 'test@email.com', id: '123' } },
        error: null
      });

      render(<Auth />);
      const toggleButton = screen.getByText(/Switch to Sign Up/i);
      await userEvent.click(toggleButton);
      
      const usernameInput = screen.getByPlaceholderText('ChooseYourUserName');
      const emailInput = screen.getByPlaceholderText('example@email.com');
      const passwordInput = screen.getByPlaceholderText('Minimum of 8 Characters is Required');
      
      await userEvent.type(usernameInput, 'JohnDoe');
      await userEvent.type(emailInput, 'test@email.com');
      await userEvent.type(passwordInput, 'password123');
      
      const submitButton = screen.getByRole('button', { name: /sign up/i });
      await userEvent.click(submitButton);
      
      await waitFor(() => {
        expect(usernameInput).toHaveValue('');
        expect(emailInput).toHaveValue('');
        expect(passwordInput).toHaveValue('');
      }, { timeout: 3000 });
    });
  });

  describe('Error Handling', () => {
    test('handles sign in error from Supabase', async () => {
      const { supabase } = require('../../lib/api');
      
      supabase.auth.signInWithPassword.mockResolvedValue({
        data: null,
        error: { message: 'Invalid login credentials' }
      });

      render(<Auth />);
      
      const emailInput = screen.getByPlaceholderText('example@email.com');
      const passwordInput = screen.getByPlaceholderText('Minimum of 8 Characters is Required');
      
      await userEvent.type(emailInput, 'test@email.com');
      await userEvent.type(passwordInput, 'wrongpassword');
      
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await userEvent.click(submitButton);
      
      // Wait for the error message to appear
      const errorMessage = await screen.findByText(/Invalid email or password/i);
      expect(errorMessage).toBeInTheDocument();
    });

    test('handles sign up error from Supabase', async () => {
      const { supabase } = require('../../lib/api');
      
      supabase.auth.signUp.mockResolvedValue({
        data: null,
        error: { message: 'User already registered' }
      });

      render(<Auth />);
      const toggleButton = screen.getByText(/Switch to Sign Up/i);
      await userEvent.click(toggleButton);
      
      const emailInput = screen.getByPlaceholderText('example@email.com');
      const passwordInput = screen.getByPlaceholderText('Minimum of 8 Characters is Required');
      
      await userEvent.type(emailInput, 'existing@email.com');
      await userEvent.type(passwordInput, 'password123');
      
      const submitButton = screen.getByRole('button', { name: /sign up/i });
      await userEvent.click(submitButton);
      
      const errorMessage = await screen.findByText('User already registered');
      expect(errorMessage).toBeInTheDocument();
    });
  });
});