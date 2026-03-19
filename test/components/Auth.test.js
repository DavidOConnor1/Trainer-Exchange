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

