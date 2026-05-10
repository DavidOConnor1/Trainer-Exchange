import { renderHook, act } from "@testing-library/react";
import { useMfa } from "../../../../src/features/auth/hooks/useMfa";

jest.mock("../../../../lib/supabase/api", () => ({
  supabase: {
    auth: {
      mfa: {
        listFactors: jest.fn(),
        challenge: jest.fn(),
        verify: jest.fn(),
        unenroll: jest.fn(),
      },
    },
  },
}));

const { supabase } = require("../../../../lib/supabase/api");

describe("useMfa", () => {
  const user = { id: "user-1" };

  beforeEach(() => {
    jest.clearAllMocks();
    window.confirm = jest.fn(() => true);
  });

  it("should check MFA status and set enabled true when factors exist", async () => {
    supabase.auth.mfa.listFactors.mockResolvedValue({
      data: { totp: [{ id: "f1" }] },
      error: null,
    });

    const { result } = renderHook(() => useMfa(user));

    await act(async () => {
      await result.current.checkMfaStatus();
    });

    expect(result.current.mfaEnabled).toBe(true);
    expect(result.current.mfaChecked).toBe(true);
  });

  it("should start disable flow and verify code to disable MFA", async () => {
    supabase.auth.mfa.listFactors.mockResolvedValue({
      data: { totp: [{ id: "f1" }] },
      error: null,
    });
    supabase.auth.mfa.challenge.mockResolvedValue({
      data: { id: "ch1" },
      error: null,
    });
    supabase.auth.mfa.verify.mockResolvedValue({
      error: null,
    });
    supabase.auth.mfa.unenroll.mockResolvedValue({
      error: null,
    });

    const { result } = renderHook(() => useMfa(user));

    await act(async () => {
      await result.current.disableMfa();
    });
    expect(result.current.showDisableChallenge).toBe(true);

    let success;
    await act(async () => {
      success = await result.current.verifyDisableMfa("123456");
    });
    expect(success).toBe(true);
    expect(result.current.mfaEnabled).toBe(false);
  });
});
