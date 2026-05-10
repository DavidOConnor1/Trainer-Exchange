// test/features/auth/hooks/useAuthLogic.test.js
import { renderHook, act } from "@testing-library/react";
import { useAuthLogic } from "../../../../src/features/auth/hooks/useAuthLogic";
import { useRouter } from "next/navigation";
import { supabase } from "../../../../lib/supabase/api";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

// Mock securityService to avoid real rate limiters
jest.mock("../../../../lib/security", () => ({
  __esModule: true,
  default: {
    getRateLimiter: jest.fn(() => ({
      canProceed: () => true,
      clear: jest.fn(),
    })),
    timingPrevention: jest.fn().mockResolvedValue(undefined),
    escapeHtml: jest.fn((str) => str),
    sanitizeEmail: jest.fn((e) => e),
    sanitizePassword: jest.fn((p) => p),
    sanitizeName: jest.fn((n) => n),
    isValidEmail: jest.fn(() => true),
    generateSecureToken: jest.fn(() => "token"),
    checkPasswordStrength: jest.fn(() => ({
      level: "strong",
      color: "green",
      text: "Strong",
    })),
  },
}));

describe("useAuthLogic", () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useRouter.mockReturnValue({ push: mockPush });
  });

  it("should initialise with default values", () => {
    const { result } = renderHook(() => useAuthLogic());
    expect(result.current.isSignUp).toBe(false);
    expect(result.current.name).toBe("");
    expect(result.current.email).toBe("");
    expect(result.current.password).toBe("");
    expect(result.current.loading).toBe(false);
    expect(result.current.errorMessage).toBe("");
  });

  it("should toggle sign up/sign in mode", () => {
    const { result } = renderHook(() => useAuthLogic());
    act(() => result.current.toggleMode());
    expect(result.current.isSignUp).toBe(true);
    act(() => result.current.toggleMode());
    expect(result.current.isSignUp).toBe(false);
  });

  it("should handle sign up successfully and redirect to verification page", async () => {
    supabase.auth.signUp.mockResolvedValue({
      data: { user: { identities: [] } },
      error: null,
    });

    const { result } = renderHook(() => useAuthLogic());

    // Switch to sign‑up mode
    act(() => {
      result.current.toggleMode();
    });
    expect(result.current.isSignUp).toBe(true);

    // Fill in the form
    act(() => {
      result.current.setEmail("test@example.com");
      result.current.setPassword("password123");
    });

    // Submit
    await act(async () => {
      result.current.handleSubmit(new Event("submit"));
    });

    expect(supabase.auth.signUp).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining("/verify-email?email=test%40example.com"),
    );
  });

  it("should handle sign in successfully", async () => {
    const mockUser = { id: "u1" };
    supabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: mockUser, session: { access_token: "token" } },
      error: null,
    });
    supabase.auth.mfa.getAuthenticatorAssuranceLevel.mockResolvedValue({
      data: { currentLevel: "aal1", nextLevel: "aal1" },
      error: null,
    });

    const { result } = renderHook(() => useAuthLogic());
    act(() => {
      result.current.setEmail("test@example.com");
      result.current.setPassword("password123");
    });

    await act(async () => {
      await result.current.handleSubmit(new Event("submit"));
    });

    expect(supabase.auth.signInWithPassword).toHaveBeenCalled();
    expect(result.current.email).toBe("");
    expect(result.current.password).toBe("");
  });

  it("should detect MFA requirement during sign in", async () => {
    supabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: { id: "u1" }, session: null },
      error: null,
    });
    supabase.auth.mfa.getAuthenticatorAssuranceLevel.mockResolvedValue({
      data: { currentLevel: "aal1", nextLevel: "aal2" },
      error: null,
    });
    supabase.auth.mfa.listFactors.mockResolvedValue({
      data: { totp: [{ id: "f1" }] },
      error: null,
    });
    supabase.auth.mfa.challenge.mockResolvedValue({
      data: { id: "ch1" },
      error: null,
    });

    const { result } = renderHook(() => useAuthLogic());
    act(() => {
      result.current.setEmail("test@example.com");
      result.current.setPassword("password123");
    });

    await act(async () => {
      result.current.handleSubmit(new Event("submit"));
    });

    expect(result.current.mfaStep).toBe("challenge");
    expect(result.current.mfaFactorId).toBe("f1");
  });
});
