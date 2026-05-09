"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../features/auth/hooks/useAuth";
import { useUserData } from "../../features/user/hooks/useUserData";
import { useProfileUpdate } from "../../features/user/hooks/useProfileUpdate";
import { useMfa } from "../../features/auth/hooks/useMfa";
import securityService from "../../../lib/security";
import MfaEnrollment from "../../../auth/components/MfaEnrollment";
import SecuritySection from "../../features/auth/components/SecuritySection";
import {
  ArrowLeft,
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  LogOut,
  User,
  Mail,
  Lock,
  Shield,
} from "lucide-react";

export default function UsersSettingsPage() {
  const router = useRouter();
  const { user, loading: authLoading, signOut } = useAuth();

  // ---- Data hooks ----
  const {
    name,
    setName,
    email,
    setEmail,
    loading: userLoading,
    resetForm,
  } = useUserData(user ?? undefined);

  // ---- MFA hook ----

  const {
    mfaEnabled,
    showEnrollment,
    setShowEnrollment,
    disableMfa,
    onEnrollmentComplete,
    checkMfaStatus,
    checkingMfa,
    mfaChecked,
    mfaMessage,
    verifyDisableMfa,
    showDisableChallenge,
    setShowDisableChallenge,
  } = useMfa(user ?? undefined);

  // ---- Profile update hook ----
  const handleSuccess = () => resetForm();
  const handleEmailChanged = () => {
    signOut();
    router.push("/");
  };
  const { updateProfile, updating, message, setMessage } = useProfileUpdate(
    user ?? undefined,
    name,
    email,
    handleSuccess,
    handleEmailChanged,
  );

  // ---- Password fields (local to page) ----
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const passwordStrength = securityService.checkPasswordStrength(password);

  const handleSignOut = useCallback(async () => {
    await signOut();
    router.push("/");
  }, [signOut, router]);

  // ---- Render ----
  if (authLoading || userLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <p className="text-gray-400">Please sign in to view settings.</p>
      </div>
    );
  }

  if (showEnrollment) {
    return (
      <MfaEnrollment
        onComplete={onEnrollmentComplete}
        onCancel={() => setShowEnrollment(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 py-4 px-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="mb-4 flex items-center justify-center gap-2 text-xs text-gray-400">
          <Shield className="w-3 h-3" />
          <span>All data is encrypted and sanitized</span>
        </div>
        <button
          onClick={() => router.back()}
          className="mb-4 flex items-center gap-2 text-gray-300 hover:text-white transition-colors py-3 px-4 active:bg-gray-800 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-base">Back to Dashboard</span>
        </button>

        <div className="bg-gray-950 rounded-2xl shadow-xl overflow-hidden border border-gray-800">
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 px-6 py-8">
            <h1 className="text-3xl font-bold text-white text-center">
              ⚙️ Profile Settings
            </h1>
            <p className="text-gray-400 text-center mt-2">
              Update your account information
            </p>
          </div>

          <form
            onSubmit={(e) => updateProfile(e, password, confirmPassword)}
            className="p-6 space-y-6"
          >
            {/* Message banner */}
            {message.text && (
              <div
                className={`p-4 rounded-lg flex items-start gap-3 ${
                  message.type === "success"
                    ? "bg-green-900/50 text-green-400 border border-green-700"
                    : message.type === "error"
                      ? "bg-red-900/50 text-red-400 border border-red-700"
                      : "bg-blue-900/50 text-blue-400 border border-blue-700"
                }`}
              >
                {message.type === "success" ? (
                  <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                ) : null}
                {message.type === "error" ? (
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                ) : null}
                <span>{message.text}</span>
              </div>
            )}

            {/* Security section */}
            <SecuritySection
              mfaEnabled={mfaEnabled}
              mfaChecked={mfaChecked}
              checkingMfa={checkingMfa}
              onCheckMfa={checkMfaStatus}
              onEnable={() => setShowEnrollment(true)}
              onDisable={disableMfa}
              mfaMessage={mfaMessage}
              showDisableChallenge={showDisableChallenge}
              onVerifyDisable={verifyDisableMfa}
              onCancelDisable={() => setShowDisableChallenge(false)}
            />

            {/* Name */}
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Display Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  maxLength={50}
                  className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all text-base"
                  disabled={updating}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1 ml-1">
                Letters, numbers, spaces, hyphens, and periods only (max 50
                chars)
              </p>
            </div>

            {/* Email */}
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  maxLength={254}
                  className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all text-base"
                  disabled={updating}
                  required
                />
              </div>
              {email !== user.email && (
                <p className="text-xs text-yellow-500 mt-1 ml-1">
                  ⚠️ Changing your email will require you to sign in again
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new password"
                  maxLength={128}
                  className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all text-base"
                  disabled={updating}
                />
              </div>
              {password && (
                <div className="mt-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">Strength:</span>
                    <span className="text-xs font-medium text-blue-400">
                      {passwordStrength.text}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  maxLength={128}
                  className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all text-base"
                  disabled={updating}
                />
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-red-400 mt-1 ml-1">
                  Passwords do not match
                </p>
              )}
            </div>

            {/* Buttons */}
            <div className="pt-6 space-y-4">
              <button
                type="submit"
                disabled={updating}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-950 transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {updating ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" /> Updating...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" /> Update Profile
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={resetForm}
                disabled={updating}
                className="w-full bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold py-3 px-6 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-600 focus:ring-offset-2 focus:ring-offset-gray-950 transition-all duration-200 disabled:opacity-50"
              >
                Reset Changes
              </button>

              <button
                type="button"
                onClick={handleSignOut}
                className="w-full bg-red-900/30 hover:bg-red-900/50 text-red-400 font-semibold py-3 px-6 rounded-lg border border-red-800 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 focus:ring-offset-gray-950 transition-all duration-200 flex items-center justify-center gap-2"
              >
                <LogOut className="w-5 h-5" /> Sign Out
              </button>
            </div>
          </form>

          <div className="bg-gray-900 border-t border-gray-800 px-6 py-5">
            <p className="text-gray-500 text-sm text-center">
              Your information is secure and encrypted
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
