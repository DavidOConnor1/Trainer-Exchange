import "@testing-library/jest-dom";
import React from "react";

import "@testing-library/jest-dom";
import React from "react";

jest.mock("../../../../lib/supabase/api", () => ({
  supabase: {
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      mfa: {
        enroll: jest.fn(),
        challenge: jest.fn(),
        verify: jest.fn(),
        listFactors: jest.fn(),
        getAuthenticatorAssuranceLevel: jest.fn(),
        unenroll: jest.fn(),
      },
      refreshSession: jest.fn(),
      getSession: jest.fn(),
      onAuthStateChange: jest.fn().mockReturnValue({
        data: { subscription: { unsubscribe: jest.fn() } },
      }),
      signOut: jest.fn(),
      getUser: jest.fn(),
    },
  },
}));

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Auth } from "@/features/auth/components/Form/AuthForm";
import { useAuthLogic } from "@/features/auth/hooks/useAuthLogic";
import { useAuth } from "@/features/auth/hooks/useAuth";

jest.mock("../../../../src/features/auth/hooks/useAuthLogic.js");
jest.mock("../../../../src/features/auth/hooks/useAuth.js", () => ({
  useAuth: jest.fn(),
}));

describe("AuthForm", () => {
  const mockUseAuthLogic = useAuthLogic;
  const mockUseAuth = useAuth;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render MFA challenge when needsMfa is true", () => {
    mockUseAuthLogic.mockReturnValue({
      isSignUp: false,
      name: "",
      email: "",
      password: "",
      loading: false,
      errorMessage: "",
      verificationSent: false,
      setName: jest.fn(),
      setEmail: jest.fn(),
      setPassword: jest.fn(),
      handleSubmit: jest.fn(),
      toggleMode: jest.fn(),
    });

    render(
      <Auth
        needsMfa={true}
        mfaFactorId="f1"
        onCompleteMfa={jest.fn()}
        onCancelMfa={jest.fn()}
      />,
    );
    expect(screen.getByText("Two-Factor Authentication")).toBeInTheDocument();
  });

  it("should render sign in form by default", () => {
    useAuthLogic.mockReturnValue({
      isSignUp: false,
      name: "",
      email: "test@test.com",
      password: "",
      loading: false,
      errorMessage: "",
      verificationSent: false,
      setName: jest.fn(),
      setEmail: jest.fn(),
      setPassword: jest.fn(),
      handleSubmit: jest.fn(),
      toggleMode: jest.fn(),
    });

    render(<Auth needsMfa={false} />);

    // Use getByRole to target specific elements
    expect(
      screen.getByRole("heading", { name: "Sign In" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign In" })).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("example@email.com"),
    ).toBeInTheDocument();
  });

  it("should show name field when isSignUp is true", () => {
    mockUseAuthLogic.mockReturnValue({
      isSignUp: true,
      name: "",
      email: "",
      password: "",
      loading: false,
      errorMessage: "",
      verificationSent: false,
      setName: jest.fn(),
      setEmail: jest.fn(),
      setPassword: jest.fn(),
      handleSubmit: jest.fn(),
      toggleMode: jest.fn(),
    });

    render(<Auth needsMfa={false} />);
    expect(
      screen.getByPlaceholderText("Choose your username"),
    ).toBeInTheDocument();
  });
});
