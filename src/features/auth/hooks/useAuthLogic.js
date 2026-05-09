import { useState } from "react";
import { supabase } from "../../../../lib/supabase/api";
import securityService from "../../../../lib/security";
import { useRouter } from "next/navigation";

export const useAuthLogic = () => {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);

  // ----- MFA managed entirely by the hook -----
  const [mfaStep, setMfaStep] = useState("none"); // 'none' | 'challenge'
  const [mfaFactorId, setMfaFactorId] = useState(null);
  const [challengeId, setChallengeId] = useState(null);
  const [mfaError, setMfaError] = useState("");

  const isDev = process.env.NODE_ENV === "development";

  const loginRateLimiter = securityService.getRateLimiter(
    "login",
    isDev ? 100 : 5, // 100 attempts in dev, 5 in production
    isDev ? 5 * 60 * 1000 : 15 * 60 * 1000, // 5 min in dev, 15 min in prod
  );

  const signupRateLimiter = securityService.getRateLimiter(
    "signup",
    isDev ? 50 : 3, // 50 signups in dev, 3 in production
    isDev ? 5 * 60 * 1000 : 60 * 60 * 1000, // 5 min in dev, 1 hour in prod
  );

  const validateAndSanitizeInputs = () => {
    const sanitizedName = securityService.sanitizeName(name, 50);
    const sanitizedEmail = securityService.sanitizeEmail(email, 254);
    const sanitizedPassword = securityService.sanitizePassword(password, 128);

    if (!sanitizedEmail || !sanitizedPassword) {
      setErrorMessage("Email and password are required");
      return null;
    }
    if (!securityService.isValidEmail(sanitizedEmail)) {
      setErrorMessage("Please enter a valid email address");
      return null;
    }
    if (sanitizedPassword.length < 8) {
      setErrorMessage("Password must be at least 8 characters");
      return null;
    }
    return { sanitizedName, sanitizedEmail, sanitizedPassword };
  };

  const handleSignUp = async (
    sanitizedName,
    sanitizedEmail,
    sanitizedPassword,
  ) => {
    const identifier = sanitizedEmail;
    if (!signupRateLimiter.canProceed(identifier)) {
      setErrorMessage("Too many signup attempts. Please try again later.");
      return false;
    }

    const signUpData = {
      email: sanitizedEmail,
      password: sanitizedPassword,
    };
    if (sanitizedName && sanitizedName !== "") {
      signUpData.options = {
        data: {
          name: sanitizedName,
          security_token: securityService.generateSecureToken(32),
          created_at: new Date().toISOString(),
        },
      };
    }

    const { data, error: signUpError } = await supabase.auth.signUp(signUpData);
    if (signUpError) {
      setErrorMessage(securityService.escapeHtml(signUpError.message));
      return false;
    }

    if (data?.user?.identities?.length === 0) {
      signupRateLimiter.clear(identifier);
      setName("");
      setEmail("");
      setPassword("");
      setErrorMessage("");
      // Redirect to verification page instead of just showing a message
      router.push(`/verify-email?email=${encodeURIComponent(sanitizedEmail)}`);
      return false; // prevent any further state changes
    }

    const success = !!data?.user;
    if (success) {
      signupRateLimiter.clear(identifier);
      setName("");
      setEmail("");
      setPassword("");
      setErrorMessage("");
    }
    return success;
  };

  const handleSignIn = async (sanitizedEmail, sanitizedPassword) => {
    await securityService.timingPrevention(attempts);

    const identifier = sanitizedEmail;
    if (!loginRateLimiter.canProceed(identifier)) {
      setErrorMessage("Too many login attempts. Please wait 15 minutes.");
      return false;
    }

    setAttempts((prev) => prev + 1);

    const { data, error: signInError } = await supabase.auth.signInWithPassword(
      {
        email: sanitizedEmail,
        password: sanitizedPassword,
      },
    );

    if (signInError) {
      setErrorMessage("Invalid email or password");
      return false;
    }

    // ----- MFA detection and automatic challenge start -----
    try {
      const { data: aalData, error: aalError } =
        await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

      if (
        !aalError &&
        aalData.nextLevel === "aal2" &&
        aalData.currentLevel !== aalData.nextLevel
      ) {
        const { data: factors } = await supabase.auth.mfa.listFactors();
        const totpFactor = factors?.totp?.[0];
        if (totpFactor) {
          // Start a challenge right away
          const { data: challengeData, error: challengeError } =
            await supabase.auth.mfa.challenge({ factorId: totpFactor.id });

          if (!challengeError) {
            setMfaFactorId(totpFactor.id);
            setChallengeId(challengeData.id);
            setMfaStep("challenge");
            setMfaError("");
            setLoading(false); // stop the spinner
            return { needsMfa: true, factorId: totpFactor.id };
          }
          // If challenge fails, fall through to normal success
        }
      }
    } catch (error) {
      console.error("MFA setup failed:", error);
    }

    // Normal success (no MFA or challenge failed)
    loginRateLimiter.clear(identifier);
    setEmail("");
    setPassword("");
    setAttempts(0);
    setErrorMessage("");
    setMfaStep("none");
    return true;
  };

  // Called from the MfaChallenge component with the 6‑digit code
  const verifyMfaCode = async (code) => {
    if (!code || code.length !== 6 || !mfaFactorId || !challengeId) {
      setMfaError("Invalid verification code.");
      return false;
    }

    setLoading(true);
    setMfaError("");

    try {
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: mfaFactorId,
        challengeId,
        code,
      });

      if (verifyError) throw verifyError;

      // Refresh session to get aal2
      await supabase.auth.refreshSession();

      // Reset MFA state and finish login
      setMfaStep("none");
      setMfaFactorId(null);
      setChallengeId(null);
      setMfaError("");

      loginRateLimiter.clear(email);
      setEmail("");
      setPassword("");
      setAttempts(0);
      setErrorMessage("");
      return true;
    } catch (err) {
      setMfaError(err.message || "Verification failed. Please try again.");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const cancelMfa = () => {
    setMfaStep("none");
    setMfaFactorId(null);
    setChallengeId(null);
    setMfaError("");
    setErrorMessage(""); // optionally clear the main error too
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setVerificationSent(false);
    setLoading(true);

    try {
      const sanitized = validateAndSanitizeInputs();
      if (!sanitized) {
        setLoading(false);
        return;
      }

      const { sanitizedName, sanitizedEmail, sanitizedPassword } = sanitized;

      if (isSignUp) {
        const result = await handleSignUp(
          sanitizedName,
          sanitizedEmail,
          sanitizedPassword,
        );
        if (result?.needsVerification) {
          setVerificationSent(true);
          setErrorMessage("");
        }
        setLoading(false);
        return result;
      } else {
        const result = await handleSignIn(sanitizedEmail, sanitizedPassword);
        if (result?.needsMfa) {
          // MFA challenge has been automatically started; stay in loading? No, we set loading false inside handleSignIn.
          return;
        }
        setLoading(false);
        return result;
      }
    } catch (error) {
      console.error("Auth error:", error);
      setErrorMessage("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setErrorMessage("");
    setAttempts(0);
  };

  return {
    isSignUp,
    name,
    email,
    password,
    loading,
    errorMessage,
    attempts,
    verificationSent,

    // MFA state and actions
    mfaStep, // 'none' | 'challenge'
    mfaFactorId,
    mfaError,
    verifyMfaCode,
    cancelMfa,

    setName,
    setEmail,
    setPassword,
    handleSubmit,
    toggleMode,
  };
};
