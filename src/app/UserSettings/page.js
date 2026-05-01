"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase/api";
import { useAuth } from "../../../auth/hooks/useAuth";
import securityService from "../../../lib/security";
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

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updating, setUpdating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: "", type: "" });

  // Refs to prevent multiple fetches
  const hasFetchedRef = useRef(false);
  const rateLimiterRef = useRef(null);

  // Initialize rate limiter once
  useEffect(() => {
    rateLimiterRef.current = securityService.getRateLimiter(
      "profile-update",
      5,
      60000,
    );
  }, []);

  // Fetch user data - wrapped in useCallback to prevent recreation
  const fetchUserData = useCallback(async () => {
    if (!user || hasFetchedRef.current) return;

    try {
      setLoading(true);

      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;

      const sanitizedName = securityService.sanitizeName(
        authUser.user_metadata?.name || "",
      );
      const sanitizedEmail = securityService.sanitizeEmail(
        authUser.email || "",
      );

      setName(sanitizedName);
      setEmail(sanitizedEmail);
      hasFetchedRef.current = true;
    } catch (error) {
      console.error("Error fetching user data:", error);
      setMessage({ text: "Failed to load user data", type: "error" });
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Update profile
  const updateProfile = useCallback(
    async (e) => {
      e.preventDefault();

      if (!user) {
        setMessage({
          text: "You must be logged in to update your profile",
          type: "error",
        });
        return;
      }

      // Rate limiting check
      if (
        rateLimiterRef.current &&
        !rateLimiterRef.current.canProceed(user.id)
      ) {
        setMessage({
          text: "Too many update attempts. Please wait a moment before trying again.",
          type: "error",
        });
        return;
      }

      setUpdating(true);
      setMessage({ text: "", type: "" });

      try {
        const validation = securityService.validateProfileUpdate({
          name: name,
          email: email,
          password: password,
        });

        if (!validation.isValid) {
          const errorMessage = Object.values(validation.errors)[0];
          setMessage({ text: errorMessage, type: "error" });
          setUpdating(false);
          return;
        }

        const authUpdates = {};

        if (
          validation.sanitizedData.name &&
          validation.sanitizedData.name !== user.user_metadata?.name
        ) {
          authUpdates.data = {
            ...user.user_metadata,
            name: validation.sanitizedData.name,
          };
        }

        if (
          validation.sanitizedData.email &&
          validation.sanitizedData.email !== user.email
        ) {
          authUpdates.email = validation.sanitizedData.email;
        }

        if (validation.sanitizedData.password) {
          if (password !== confirmPassword) {
            setMessage({ text: "Passwords do not match", type: "error" });
            setUpdating(false);
            return;
          }
          authUpdates.password = validation.sanitizedData.password;
        }

        if (Object.keys(authUpdates).length > 0) {
          const { error: updateError } =
            await supabase.auth.updateUser(authUpdates);

          if (updateError) throw updateError;

          setMessage({
            text: "Profile updated successfully!",
            type: "success",
          });

          setPassword("");
          setConfirmPassword("");

          if (authUpdates.email) {
            setMessage({
              text: "Email updated. Please sign in again with your new email.",
              type: "success",
            });
            setTimeout(() => {
              signOut();
              router.push("/");
            }, 3000);
            return;
          }

          // Refresh user data after update
          hasFetchedRef.current = false;
          await fetchUserData();
        } else {
          setMessage({ text: "No changes to update", type: "info" });
        }
      } catch (error) {
        console.error("Error updating profile:", error);
        setMessage({
          text: securityService.escapeHtml(
            error.message || "Failed to update profile",
          ),
          type: "error",
        });
      } finally {
        setUpdating(false);
      }
    },
    [
      user,
      name,
      email,
      password,
      confirmPassword,
      signOut,
      router,
      fetchUserData,
    ],
  );

  const handleSignOut = useCallback(async () => {
    await signOut();
    router.push("/");
  }, [signOut, router]);

  const resetForm = useCallback(() => {
    hasFetchedRef.current = false;
    fetchUserData();
    setPassword("");
    setConfirmPassword("");
    setMessage({ text: "", type: "" });
  }, [fetchUserData]);

  const passwordStrength = securityService.checkPasswordStrength(password);

  // Single useEffect for initial load
  useEffect(() => {
    if (user && !hasFetchedRef.current) {
      fetchUserData();
    }
  }, [user, fetchUserData]);

  // Handle auth loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  // Redirect if no user
  if (!user) {
    router.push("/");
    return null;
  }

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-4 px-4">
      <div className="max-w-md mx-auto">
        <div className="mb-4 flex items-center justify-center gap-2 text-xs text-gray-500">
          <Shield className="w-3 h-3" />
          <span>All data is encrypted and sanitized</span>
        </div>

        <button
          onClick={() => router.back()}
          className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors py-3 px-4 active:bg-gray-200 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-base">Back to Dashboard</span>
        </button>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-6 py-8">
            <h1 className="text-3xl font-bold text-white text-center">
              ⚙️ Profile Settings
            </h1>
            <p className="text-gray-300 text-center mt-2">
              Update your account information
            </p>
          </div>

          <form onSubmit={updateProfile} className="p-6 space-y-6">
            {message.text && (
              <div
                className={`p-4 rounded-lg flex items-start gap-3 ${
                  message.type === "success"
                    ? "bg-green-100 text-green-800 border border-green-200"
                    : message.type === "error"
                      ? "bg-red-100 text-red-800 border border-red-200"
                      : "bg-blue-100 text-blue-800 border border-blue-200"
                }`}
              >
                {message.type === "success" ? (
                  <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                ) : message.type === "error" ? (
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                ) : null}
                <span>{message.text}</span>
              </div>
            )}

            <div className="space-y-5">
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
                Personal Information
              </h3>

              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Display Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    maxLength="50"
                    className="w-full pl-10 pr-4 py-4 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent transition-all text-base"
                    disabled={updating}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1 ml-1">
                  Letters, numbers, spaces, hyphens, and periods only (max 50
                  chars)
                </p>
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    maxLength="254"
                    className="w-full pl-10 pr-4 py-4 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent transition-all text-base"
                    disabled={updating}
                    required
                  />
                </div>
                {email !== user?.email && (
                  <p className="text-xs text-yellow-600 mt-1 ml-1">
                    ⚠️ Changing your email will require you to sign in again
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-5 pt-2">
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
                Change Password
              </h3>
              <p className="text-gray-600 text-sm">
                Leave blank to keep current password
              </p>

              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter new password"
                    maxLength="128"
                    className="w-full pl-10 pr-4 py-4 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent transition-all text-base"
                    disabled={updating}
                  />
                </div>
                {password && (
                  <div className="mt-2">
                    <div className="flex items-center gap-2">
                      <div className="text-xs text-gray-600">Strength:</div>
                      <div
                        className={`text-xs font-medium text-${passwordStrength.color}-600`}
                      >
                        {passwordStrength.text}
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Password must contain: 8+ chars, uppercase, lowercase,
                      number, and special character
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    maxLength="128"
                    className="w-full pl-10 pr-4 py-4 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent transition-all text-base"
                    disabled={updating}
                  />
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-xs text-red-600 mt-1 ml-1">
                    Passwords do not match
                  </p>
                )}
              </div>
            </div>

            <div className="pt-6 space-y-4">
              <button
                type="submit"
                disabled={updating}
                className="w-full bg-gray-800 hover:bg-gray-900 text-white font-semibold py-4 px-6 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md flex items-center justify-center gap-2 text-base"
              >
                {updating ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Update Profile
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={resetForm}
                disabled={updating}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-4 px-6 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-base"
              >
                Reset Changes
              </button>

              <button
                type="button"
                onClick={handleSignOut}
                className="w-full bg-red-50 hover:bg-red-100 text-red-700 font-semibold py-4 px-6 rounded-lg border border-red-200 focus:outline-none focus:ring-2 focus:ring-red-300 focus:ring-offset-2 transition-all duration-200 flex items-center justify-center gap-2 text-base"
              >
                <LogOut className="w-5 h-5" />
                Sign Out
              </button>
            </div>
          </form>

          <div className="bg-gray-50 border-t border-gray-200 px-6 py-5">
            <p className="text-gray-600 text-sm text-center">
              Your information is secure and encrypted
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
