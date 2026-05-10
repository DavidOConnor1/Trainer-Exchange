import { renderHook, act } from "@testing-library/react";
import { useUserData } from "../../../../src/features/user/hooks/useUserData";
import { supabase } from "../../../../lib/supabase/api";

// Mock supabase
jest.mock("../../../../lib/supabase/api", () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
    },
  },
}));

describe("useUserData", () => {
  const mockUser = { id: "user-1" };
  const authUser = {
    user_metadata: { name: "  John  " },
    email: "  JOHN@EXAMPLE.COM  ",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should fetch user data and sanitize name/email", async () => {
    supabase.auth.getUser.mockResolvedValue({
      data: { user: authUser },
      error: null,
    });

    const { result } = renderHook(() => useUserData(mockUser));

    // Initial loading state
    expect(result.current.loading).toBe(true);
    expect(result.current.name).toBe("");
    expect(result.current.email).toBe("");

    // Wait for the fetch to complete
    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.loading).toBe(false);
    // The sanitizeName and sanitizeEmail are called internally; we assume they trim and lowercase
    expect(result.current.name).toBe("John"); // trimmed and sanitized
    expect(result.current.email).toBe("john@example.com"); // lowercased and sanitized
  });

  it("should not refetch if data already loaded", async () => {
    supabase.auth.getUser.mockResolvedValue({
      data: { user: authUser },
      error: null,
    });

    const { result, rerender } = renderHook(
      (props) => useUserData(props.user),
      { initialProps: { user: mockUser } },
    );

    await act(async () => {
      await Promise.resolve();
    });

    // Rerender with same user – should not call getUser again
    rerender({ user: mockUser });
    expect(supabase.auth.getUser).toHaveBeenCalledTimes(1);
  });

  it("should reset and refetch when resetForm is called", async () => {
    supabase.auth.getUser.mockResolvedValue({
      data: { user: authUser },
      error: null,
    });

    const { result } = renderHook(() => useUserData(mockUser));
    await act(async () => {
      await Promise.resolve();
    });

    // Clear previous calls
    supabase.auth.getUser.mockClear();

    // Call resetForm
    act(() => {
      result.current.resetForm();
    });

    // It should trigger a new fetch
    await act(async () => {
      await Promise.resolve();
    });

    expect(supabase.auth.getUser).toHaveBeenCalledTimes(1);
  });

  it("should handle error gracefully", async () => {
    supabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: "Network error" },
    });

    const { result } = renderHook(() => useUserData(mockUser));
    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.loading).toBe(false);
    // Name and email should remain empty on error
    expect(result.current.name).toBe("");
    expect(result.current.email).toBe("");
  });

  it("should not fetch if user is null", async () => {
    const { result } = renderHook(() => useUserData(null));
    expect(result.current.loading).toBe(true);
    expect(supabase.auth.getUser).not.toHaveBeenCalled();
  });
});
