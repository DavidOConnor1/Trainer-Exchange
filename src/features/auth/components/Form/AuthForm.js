"use client";

import { useAuthLogic } from "../../hooks/useAuthLogic";
import {
  validateEmail,
  validatePassword,
  validateName,
  getPasswordStrengthIndicator,
} from "./FormValidation";

import MfaChallenge from "../MFA/MfaChallenge";

export const Auth = ({
  needsMfa,
  mfaFactorId,
  onCompleteMfa,
  onCancelMfa,
  user,
}) => {
  const {
    isSignUp,
    name,
    email,
    password,
    loading,
    errorMessage,
    verificationSent,
    setName,
    setEmail,
    setPassword,
    handleSubmit,
    toggleMode,
  } = useAuthLogic();

  // Real-time validation
  const emailError = validateEmail(email);
  const passwordError = validatePassword(password);
  const nameError = isSignUp ? validateName(name, false) : null;
  const passwordStrength = getPasswordStrengthIndicator(password);

  const isFormValid = () => {
    if (!email || !password) return false;
    if (emailError || passwordError) return false;
    if (isSignUp && nameError) return false;
    return true;
  };

  // If MFA is required, show the challenge screen immediately
  if (needsMfa) {
    return (
      <MfaChallenge
        factorId={mfaFactorId}
        onVerify={onCompleteMfa}
        onCancel={onCancelMfa}
        error=""
        loading={false}
      />
    );
  }

  // Regular auth form (sign in / sign up)
  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-gray-900 to-gray-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-gray-950 p-10 rounded-2xl shadow-2xl border border-gray-800">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-white">
            {isSignUp ? "Sign Up" : "Sign In"}
          </h2>
        </div>

        {/* Error Message Display */}
        {errorMessage && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/50 p-4">
            <p className="text-sm text-red-400">{errorMessage}</p>
          </div>
        )}

        {/* Only show form if not waiting for verification */}
        {!verificationSent && (
          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div className="space-y-4">
              {isSignUp && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Username
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg
                        className="h-5 w-5 text-gray-500"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <input
                      type="text"
                      placeholder="Choose your username"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={loading}
                      maxLength="50"
                      className={`appearance-none block w-full pl-10 pr-3 py-3 bg-gray-900 border rounded-lg placeholder-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 sm:text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                        nameError ? "border-red-500" : "border-gray-700"
                      }`}
                    />
                  </div>
                  {nameError && (
                    <p className="text-xs text-red-500 mt-1">{nameError}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Letters, numbers, spaces, hyphens, and periods only
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg
                      className="h-5 w-5 text-gray-500"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                  </div>
                  <input
                    type="email"
                    placeholder="example@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    maxLength="254"
                    className={`appearance-none block w-full pl-10 pr-3 py-3 bg-gray-900 border rounded-lg placeholder-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 sm:text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                      emailError ? "border-red-500" : "border-gray-700"
                    }`}
                  />
                </div>
                {emailError && (
                  <p className="text-xs text-red-500 mt-1">{emailError}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg
                      className="h-5 w-5 text-gray-500"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <input
                    type="password"
                    placeholder="Minimum of 8 characters required"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    maxLength="128"
                    className={`appearance-none block w-full pl-10 pr-3 py-3 bg-gray-900 border rounded-lg placeholder-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 sm:text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                      passwordError ? "border-red-500" : "border-gray-700"
                    }`}
                  />
                </div>
                {passwordError && (
                  <p className="text-xs text-red-500 mt-1">{passwordError}</p>
                )}
                {password && !passwordError && passwordStrength && (
                  <div className="mt-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">Strength:</span>
                      <span
                        className={`text-xs font-medium text-${passwordStrength.color}-500`}
                      >
                        {passwordStrength.text}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading || !isFormValid()}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-gray-950 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>{isSignUp ? "Signing up..." : "Signing in..."}</span>
                  </div>
                ) : (
                  <span>{isSignUp ? "Sign Up" : "Sign In"}</span>
                )}
              </button>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={toggleMode}
                disabled={loading}
                className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors duration-200 disabled:opacity-50"
              >
                Switch to {isSignUp ? "Sign In" : "Sign Up"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
