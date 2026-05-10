import { renderHook, act } from "@testing-library/react";
import { useProfileUpdate } from "../../../../src/features/user/hooks/useProfileUpdate";
import { supabase } from "../../../../lib/supabase/api";
import securityService from "../../../../lib/security";

// Mock supabase
jest.mock("../../../../lib/supabase/api", () => ({
  supabase: {
    auth: {
      updateUser: jest.fn(),
    },
  },
}));

// Mock securityService completely
jest.mock("../../../../lib/security", () => ({
  getRateLimiter: jest.fn(),
  validateProfileUpdate: jest.fn(),
  escapeHtml: jest.fn((msg) => msg),
}));

describe("useProfileUpdate", () => {
  const user = {
    id: "user-1",
    user_metadata: { name: "John" },
    email: "john@example.com",
  };

  const onSuccess = jest.fn();
  const onEmailChanged = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    securityService.getRateLimiter.mockReturnValue({
      canProceed: jest.fn(() => true),
      clear: jest.fn(),
    });
    securityService.validateProfileUpdate.mockReturnValue({
      isValid: true,
      errors: {},
      sanitizedData: {
        name: "Jane",
        email: "jane@example.com",
        password: "newpassword",
      },
    });
  });

  it("should update profile successfully", async () => {
    supabase.auth.updateUser.mockResolvedValue({ data: {}, error: null });

    const { result } = renderHook(() =>
      useProfileUpdate(
        user,
        "Jane",
        "jane@example.com",
        onSuccess,
        onEmailChanged,
      ),
    );

    const fakeEvent = { preventDefault: jest.fn() };

    await act(async () => {
      await result.current.updateProfile(
        fakeEvent,
        "newpassword",
        "newpassword",
      );
    });

    expect(securityService.validateProfileUpdate).toHaveBeenCalledWith({
      name: "Jane",
      email: "jane@example.com",
      password: "newpassword",
    });

    expect(supabase.auth.updateUser).toHaveBeenCalledWith({
      data: { ...user.user_metadata, name: "Jane" },
      email: "jane@example.com",
      password: "newpassword",
    });

    expect(onEmailChanged).toHaveBeenCalled(); // because email changed
    expect(result.current.updating).toBe(false);
  });

  it("should call onSuccess if email unchanged", async () => {
    supabase.auth.updateUser.mockResolvedValue({ data: {}, error: null });

    // Simulate same email
    securityService.validateProfileUpdate.mockReturnValue({
      isValid: true,
      sanitizedData: {
        name: "Jane",
        email: "john@example.com",
        password: "newpassword",
      },
    });

    const { result } = renderHook(() =>
      useProfileUpdate(
        user,
        "Jane",
        "john@example.com",
        onSuccess,
        onEmailChanged,
      ),
    );

    const fakeEvent = { preventDefault: jest.fn() };
    await act(async () => {
      await result.current.updateProfile(
        fakeEvent,
        "newpassword",
        "newpassword",
      );
    });

    expect(onSuccess).toHaveBeenCalled();
    expect(onEmailChanged).not.toHaveBeenCalled();
  });

  it("should display error when validation fails", async () => {
    securityService.validateProfileUpdate.mockReturnValue({
      isValid: false,
      errors: { name: "Name too short" },
      sanitizedData: {},
    });

    const { result } = renderHook(() =>
      useProfileUpdate(user, "", "john@example.com", onSuccess, onEmailChanged),
    );

    const fakeEvent = { preventDefault: jest.fn() };
    await act(async () => {
      await result.current.updateProfile(fakeEvent, "pw", "pw");
    });

    expect(result.current.message).toEqual({
      text: "Name too short",
      type: "error",
    });
    expect(supabase.auth.updateUser).not.toHaveBeenCalled();
  });

  it("should display error when passwords do not match", async () => {
    securityService.validateProfileUpdate.mockReturnValue({
      isValid: true,
      sanitizedData: { password: "pw" },
    });

    const { result } = renderHook(() =>
      useProfileUpdate(
        user,
        "Jane",
        "john@example.com",
        onSuccess,
        onEmailChanged,
      ),
    );

    const fakeEvent = { preventDefault: jest.fn() };
    await act(async () => {
      await result.current.updateProfile(fakeEvent, "pw", "different");
    });

    expect(result.current.message).toEqual({
      text: "Passwords do not match",
      type: "error",
    });
    expect(supabase.auth.updateUser).not.toHaveBeenCalled();
  });

  it("should handle rate limiting", async () => {
    securityService.getRateLimiter.mockReturnValue({
      canProceed: jest.fn(() => false),
      clear: jest.fn(),
    });

    const { result } = renderHook(() =>
      useProfileUpdate(
        user,
        "Jane",
        "john@example.com",
        onSuccess,
        onEmailChanged,
      ),
    );

    const fakeEvent = { preventDefault: jest.fn() };
    await act(async () => {
      await result.current.updateProfile(fakeEvent, "pw", "pw");
    });

    expect(result.current.message).toEqual({
      text: "Too many update attempts. Please wait a moment.",
      type: "error",
    });
    expect(supabase.auth.updateUser).not.toHaveBeenCalled();
  });

  it("should handle updateUser error", async () => {
    supabase.auth.updateUser.mockResolvedValue({
      error: { message: "Server error" },
    });

    const { result } = renderHook(() =>
      useProfileUpdate(
        user,
        "Jane",
        "jane@example.com",
        onSuccess,
        onEmailChanged,
      ),
    );

    const fakeEvent = { preventDefault: jest.fn() };
    await act(async () => {
      await result.current.updateProfile(fakeEvent, "pw", "pw");
    });

    expect(result.current.message).toEqual({
      text: "Server error",
      type: "error",
    });
  });

  it("should show info when no changes are needed", async () => {
    securityService.validateProfileUpdate.mockReturnValue({
      isValid: true,
      sanitizedData: {}, // no fields changed
    });

    const { result } = renderHook(() =>
      useProfileUpdate(
        user,
        "John",
        "john@example.com",
        onSuccess,
        onEmailChanged,
      ),
    );

    const fakeEvent = { preventDefault: jest.fn() };
    await act(async () => {
      await result.current.updateProfile(fakeEvent, "", "");
    });

    expect(result.current.message).toEqual({
      text: "No changes to update",
      type: "info",
    });
    expect(supabase.auth.updateUser).not.toHaveBeenCalled();
  });
});
