import "@testing-library/jest-dom"; // <-- ADD THIS
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import MfaChallenge from "@/features/auth/components/MFA/MfaChallenge";

describe("MfaChallenge", () => {
  const mockOnVerify = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render the component", () => {
    render(
      <MfaChallenge
        factorId="test-factor"
        onVerify={mockOnVerify}
        onCancel={mockOnCancel}
        error=""
        loading={false}
      />,
    );
    expect(screen.getByText("Two-Factor Authentication")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("000000")).toBeInTheDocument();
  });

  it("should call onVerify with the entered code when Verify is clicked", async () => {
    mockOnVerify.mockResolvedValue(true);
    render(
      <MfaChallenge
        factorId="test-factor"
        onVerify={mockOnVerify}
        onCancel={mockOnCancel}
        error=""
        loading={false}
      />,
    );

    const input = screen.getByPlaceholderText("000000");
    fireEvent.change(input, { target: { value: "123456" } });
    expect(input.value).toBe("123456");

    fireEvent.click(screen.getByText("Verify"));
    expect(mockOnVerify).toHaveBeenCalledWith("123456");
  });

  it("should disable Verify button when loading", () => {
    render(
      <MfaChallenge
        factorId="test-factor"
        onVerify={mockOnVerify}
        onCancel={mockOnCancel}
        error=""
        loading={true}
      />,
    );
    expect(screen.getByText("Verifying...")).toBeDisabled();
  });

  it("should disable Verify button when code length is not 6", () => {
    render(
      <MfaChallenge
        factorId="test-factor"
        onVerify={mockOnVerify}
        onCancel={mockOnCancel}
        error=""
        loading={false}
      />,
    );
    const button = screen.getByText("Verify");
    expect(button).toBeDisabled();

    fireEvent.change(screen.getByPlaceholderText("000000"), {
      target: { value: "12345" },
    });
    expect(button).toBeDisabled();

    fireEvent.change(screen.getByPlaceholderText("000000"), {
      target: { value: "123456" },
    });
    expect(button).not.toBeDisabled();
  });

  it("should display external error", () => {
    render(
      <MfaChallenge
        factorId="test-factor"
        onVerify={mockOnVerify}
        onCancel={mockOnCancel}
        error="Invalid code"
        loading={false}
      />,
    );
    expect(screen.getByText("Invalid code")).toBeInTheDocument();
  });

  it("should call onCancel when Cancel is clicked", () => {
    render(
      <MfaChallenge
        factorId="test-factor"
        onVerify={mockOnVerify}
        onCancel={mockOnCancel}
        error=""
        loading={false}
      />,
    );
    fireEvent.click(screen.getByText("Cancel"));
    expect(mockOnCancel).toHaveBeenCalled();
  });
});
