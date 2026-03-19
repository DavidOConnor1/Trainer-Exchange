import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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

  
})

