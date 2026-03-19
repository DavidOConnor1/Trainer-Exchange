import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Auth } from '../../hooks/v1/signUser';

const emailInput = screen.getByPlaceholderText('example@email.com');
const passwordInput = screen.getByPlaceholderText('Minimum of 6 Characters is Required');
 const submitButton = screen.getByRole('button', { name: /sign in/i });

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

//A mock console methods to keep our test outputs clean

const originalConsole = { ...console };
beforeEach(() => {
  console.log = jest.fn();
  console.error = jest.fn();
})

afterEach(() => {
  jest.clearAllMocks();
});

afterAll(() => {
  console.log = originalConsole.log;
  console.error = originalConsole.error;
});

describe('Auth Component - Validation Test', () => {
  describe('Form Rendering', () => {
    test('renders sign in form by default', () => {
      render(<Auth />);

      expect(screen.getByText('Sign In')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('example@email.com')).toBeInTheDocument();
      expect(screen.queryByPlaceholderText('ChooseYourUserName')).not.toBeInTheDocument();
      expect(screen.getByPlaceholderText('Minimum of 6 Characters is Required')).toBeInTheDocument();
    }); //end render sign in test

    test('switches to sign up form when the toggle button is clicked', async() => {
      render(<Auth />);

      const toggleButton = screen.getByText('Switch to Sign Up');
      await userEvent.click(toggleButton);

      expect(screen.getByText('Sign Up')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('ChooseYourUsername')).toBeInTheDocument();
      expect(screen.getByText('Switch to Sign In')).toBeInTheDocument();

    }); //end toggle to sign up test
  }); //end describe form rendering

  describe('Email Validation', () => {
    test('show error for empty email', async () => {
      render(<Auth />);

      //fills only password
      
      await userEvent.type(passwordInput, 'password123');

      
      await userEvent.click(submitButton);

      expect(console.log).toHaveBeenCalledWith('email and password are required');
    });//end show error for empty email

    test('shows error for invalid  email format', async() => {
      render(<Auth />);

     
      

      await userEvent.type(emailInput, 'notAemail');
      await userEvent.type(passwordInput, 'password123');
      await userEvent.click(submitButton);
     

      expect(console.log).toHaveBeenCalledWith('Please enter a valid email');
    });//end show error for invalid email address

    test('accepts valid email formats', async() => {
      const {supabase} = require('../../lib-supa/v1/api.js');
      supabase.auth.signInWithPassword.mockResolvedValueOnce({
        data: {user: {email: 'valid@email.com'}},
        error: null
      });

      render(<Auth />);

      await userEvent.type(emailInput, 'valid@email.com');
      await userEvent.type(passwordInput, 'password123');
      await userEvent.click(submitButton);

      //should not log an email validation error
      expect(console.log).not.toHaveBeenCalledWith('Please enter a valid email');

      //it will actually attempt to sign in
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'valid@email.com',
        password: 'password123'
      }); //end expect
    });//end test to accept valid email addresses
  
    test('email regex correctly validates', ()=> {
      //testing the regex pattern directly
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      const validEmails = [
        'test@example.com',
        'pokeball@gmail.com',
        'iAmAnEmail@yahoo.com',
        'domain@domain.ie'
      ];

      const invalidEmails = [
        'noEmailHere',
        'whatDomain@domain',
        'space @ email.co.uk',
        '',
        'blank@.com'
      ];

      validEmails.forEach(email => {
        expect(emailRegex.test(email)).toBe(true);
      });

      invalidEmails.forEach(email => {
        expect(emailRegex.test(email)).toBe(false);
      });
    });
  });

  describe()

})

