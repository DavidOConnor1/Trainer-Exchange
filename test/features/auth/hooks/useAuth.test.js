import { renderHook, act, waitFor } from "@testing-library/react";
import { useAuth } from "../../../../src/features/auth/hooks/useAuth";

// Mock the Supabase module with the correct path
jest.mock("../../../../lib/supabase/api", () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      mfa: {
        getAuthenticatorAssuranceLevel: jest.fn(),
        listFactors: jest.fn(),
        challenge: jest.fn(),
        verify: jest.fn(),
      },
      onAuthStateChange: jest.fn().mockReturnValue({
        data: { subscription: { unsubscribe: jest.fn() } },
      }),
      signOut: jest.fn(),
      refreshSession: jest.fn(),
    },
  },
}));

const { supabase } = require("../../../../lib/supabase/api");

describe("useAuth", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should set loading false and user null when no session", async () => {
    supabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });
    const { result } = renderHook(() => useAuth());

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.needsMfa).toBe(false);
  });

  it("should set user when session exists without MFA", async () => {
    const mockUser = { id: "user-1", email: "test@test.com" };
    supabase.auth.getSession.mockResolvedValue({
      data: { session: { user: mockUser } },
      error: null,
    });
    supabase.auth.mfa.getAuthenticatorAssuranceLevel.mockResolvedValue({
      data: { currentLevel: "aal1", nextLevel: "aal1" },
      error: null,
    });

    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.needsMfa).toBe(false);
  });

  it("should require MFA when session exists and nextLevel is aal2", async () => {
    const mockUser = { id: "user-1" };
    supabase.auth.getSession.mockResolvedValue({
      data: { session: { user: mockUser } },
      error: null,
    });
    supabase.auth.mfa.getAuthenticatorAssuranceLevel.mockResolvedValue({
      data: { currentLevel: "aal1", nextLevel: "aal2" },
      error: null,
    });
    supabase.auth.mfa.listFactors.mockResolvedValue({
      data: { totp: [{ id: "factor-1" }] },
      error: null,
    });

    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.needsMfa).toBe(true);
    expect(result.current.mfaFactorId).toBe("factor-1");
  });

  it("should sign out and clear state", async () => {
    supabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });
    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.signOut();
    });
    expect(supabase.auth.signOut).toHaveBeenCalled();
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it("should complete MFA challenge and return true", async () => {
    supabase.auth.getSession.mockResolvedValueOnce({
      data: { session: { user: { id: "u" } } },
      error: null,
    });
    supabase.auth.mfa.getAuthenticatorAssuranceLevel.mockResolvedValueOnce({
      data: { currentLevel: "aal1", nextLevel: "aal2" },
      error: null,
    });
    supabase.auth.mfa.listFactors.mockResolvedValueOnce({
      data: { totp: [{ id: "f1" }] },
      error: null,
    });
    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.mfaFactorId).toBe("f1"));

    supabase.auth.mfa.challenge.mockResolvedValueOnce({
      data: { id: "ch1" },
      error: null,
    });
    supabase.auth.mfa.verify.mockResolvedValueOnce({ error: null });
    supabase.auth.refreshSession.mockResolvedValueOnce({ error: null });

    let success;
    await act(async () => {
      success = await result.current.completeMfaChallenge("123456");
    });

    expect(success).toBe(true);
    expect(supabase.auth.mfa.challenge).toHaveBeenCalledWith({
      factorId: "f1",
    });
    expect(supabase.auth.mfa.verify).toHaveBeenCalledWith({
      factorId: "f1",
      challengeId: "ch1",
      code: "123456",
    });
    expect(supabase.auth.refreshSession).toHaveBeenCalled();
  });
});
