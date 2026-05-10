import "@testing-library/jest-dom";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import MfaEnrollment from "@/features/auth/components/MFA/MfaEnrollment";
import { supabase } from "../../../../lib/supabase/api";

jest.mock("../../../../lib/supabase/api", () => ({
  supabase: {
    auth: {
      mfa: {
        enroll: jest.fn(),
        challenge: jest.fn(),
        verify: jest.fn(),
      },
      refreshSession: jest.fn(),
    },
  },
}));

describe("MfaEnrollment", () => {
  const mockOnComplete = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should start enrollment on mount and display QR code", async () => {
    supabase.auth.mfa.enroll.mockResolvedValue({
      data: {
        totp: {
          qr_code: "data:image/svg+xml;base64,PHN2ZyB...",
          secret: "TESTSECRET",
        },
        id: "factor-id",
      },
      error: null,
    });

    render(
      <MfaEnrollment onComplete={mockOnComplete} onCancel={mockOnCancel} />,
    );

    // Wait until the QR code image actually appears (this guarantees the component re-rendered)
    await waitFor(() => {
      expect(screen.getByAltText("MFA QR Code")).toBeInTheDocument();
    });
    // Now the secret should also be visible
    expect(screen.getByText("TESTSECRET")).toBeInTheDocument();

    // Also check that enroll was called
    expect(supabase.auth.mfa.enroll).toHaveBeenCalledWith({
      factorType: "totp",
    });
  });

  it("should display error if enrollment fails", async () => {
    supabase.auth.mfa.enroll.mockResolvedValue({
      data: null,
      error: { message: "Enrollment failed" },
    });

    render(
      <MfaEnrollment onComplete={mockOnComplete} onCancel={mockOnCancel} />,
    );

    await waitFor(() => {
      expect(screen.getByText("Enrollment failed")).toBeInTheDocument();
    });
  });

  it("should call onComplete after successful verification", async () => {
    supabase.auth.mfa.enroll.mockResolvedValue({
      data: {
        totp: {
          qr_code: "data:image/svg+xml;base64,PHN2ZyB...",
          secret: "TESTSECRET",
        },
        id: "factor-id",
      },
      error: null,
    });
    supabase.auth.mfa.challenge.mockResolvedValue({
      data: { id: "challenge-id" },
      error: null,
    });
    supabase.auth.mfa.verify.mockResolvedValue({
      data: {},
      error: null,
    });
    supabase.auth.refreshSession.mockResolvedValue({ data: {}, error: null });

    render(
      <MfaEnrollment onComplete={mockOnComplete} onCancel={mockOnCancel} />,
    );

    // Wait for the input field to appear (means enrollment finished)
    await waitFor(() => {
      expect(screen.getByPlaceholderText("000000")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText("000000"), {
      target: { value: "123456" },
    });
    fireEvent.click(screen.getByText("Verify & Enable"));

    await waitFor(() => {
      expect(supabase.auth.mfa.challenge).toHaveBeenCalledWith({
        factorId: "factor-id",
      });
      expect(supabase.auth.mfa.verify).toHaveBeenCalledWith({
        factorId: "factor-id",
        challengeId: "challenge-id",
        code: "123456",
      });
      expect(supabase.auth.refreshSession).toHaveBeenCalled();
      expect(mockOnComplete).toHaveBeenCalled();
    });
  });

  it("should show error when verification fails", async () => {
    supabase.auth.mfa.enroll.mockResolvedValue({
      data: {
        totp: {
          qr_code: "data:image/svg+xml;base64,PHN2ZyB...",
          secret: "TESTSECRET",
        },
        id: "factor-id",
      },
      error: null,
    });
    supabase.auth.mfa.challenge.mockResolvedValue({
      data: { id: "challenge-id" },
      error: null,
    });
    supabase.auth.mfa.verify.mockResolvedValue({
      data: null,
      error: { message: "Invalid code" },
    });

    render(
      <MfaEnrollment onComplete={mockOnComplete} onCancel={mockOnCancel} />,
    );

    await waitFor(() => {
      expect(screen.getByPlaceholderText("000000")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText("000000"), {
      target: { value: "123456" },
    });
    fireEvent.click(screen.getByText("Verify & Enable"));

    await waitFor(() => {
      expect(screen.getByText("Invalid code")).toBeInTheDocument();
    });
  });

  it("should call onCancel when Skip is clicked", () => {
    supabase.auth.mfa.enroll.mockResolvedValue({
      data: {
        totp: {
          qr_code: "data:image/svg+xml;base64,PHN2ZyB...",
          secret: "TESTSECRET",
        },
        id: "factor-id",
      },
      error: null,
    });

    render(
      <MfaEnrollment onComplete={mockOnComplete} onCancel={mockOnCancel} />,
    );
    fireEvent.click(screen.getByText("Skip"));
    expect(mockOnCancel).toHaveBeenCalled();
  });
});
