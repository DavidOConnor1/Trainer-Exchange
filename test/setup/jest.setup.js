// test/setup/jest.setup.js
require("@testing-library/jest-dom");

process.env.API_BASE_URL = "https://test-api.example.com";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
  }),
  usePathname: () => "/",
}));

// Global mock for Supabase – prevents the real client from being created
jest.mock("@/lib/supabase/api", () => ({
  __esModule: true,
  supabase: {
    from: jest.fn(),
    auth: {
      getSession: jest.fn(),
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      refreshSession: jest.fn(),
      getUser: jest.fn(),
      onAuthStateChange: jest.fn().mockReturnValue({
        data: { subscription: { unsubscribe: jest.fn() } },
      }),
      mfa: {
        getAuthenticatorAssuranceLevel: jest.fn(),
        listFactors: jest.fn(),
        challenge: jest.fn(),
        verify: jest.fn(),
        enroll: jest.fn(),
        unenroll: jest.fn(),
      },
    },
  },
}));

// Set required environment variables for Supabase (optional, but safe)
process.env.NEXT_PUBLIC_SUPASUPA = "https://test.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";

// Mock localStorage (keep as is)
class LocalStorageMock {
  constructor() {
    this.store = {};
  }
  clear() {
    this.store = {};
  }
  getItem(key) {
    return this.store[key] || null;
  }
  setItem(key, value) {
    this.store[key] = String(value);
  }
  removeItem(key) {
    delete this.store[key];
  }
}
global.localStorage = new LocalStorageMock();
