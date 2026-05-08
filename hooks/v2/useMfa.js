// hooks/v2/useMfa.js
"use client";

import { useState, useCallback } from "react";
import { supabase } from "../../lib/supabase/api";

export function useMfa(user) {
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [showEnrollment, setShowEnrollment] = useState(false);
  const [checkingMfa, setCheckingMfa] = useState(false);
  const [mfaChecked, setMfaChecked] = useState(false);
  const [mfaMessage, setMfaMessage] = useState("");

  // For disabling MFA (AAL2 challenge)
  const [showDisableChallenge, setShowDisableChallenge] = useState(false);
  const [challengeId, setChallengeId] = useState(null);

  const checkMfaStatus = useCallback(async () => {
    if (!user) return;
    setCheckingMfa(true);
    setMfaMessage("");
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) throw error;
      const enabled = !!data?.totp?.length;
      setMfaEnabled(enabled);
      setMfaChecked(true);
      if (!enabled) {
        setMfaMessage("Two‑factor authentication is not enabled.");
      }
    } catch (err) {
      console.error("MFA check failed:", err);
      setMfaMessage("Failed to check MFA status. Please try again.");
    } finally {
      setCheckingMfa(false);
    }
  }, [user]);

  // Start the disable process: request an MFA challenge (AAL1 -> AAL2)
  const startDisableMfa = useCallback(async () => {
    if (
      !confirm(
        "Disable two-factor authentication? You'll need to verify your identity.",
      )
    )
      return;
    setMfaMessage("");
    try {
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const factor = factors?.totp?.[0];
      if (!factor) {
        setMfaMessage("No MFA factor found. It may already be disabled.");
        setMfaEnabled(false);
        return;
      }

      // Create a challenge for that factor
      const { data, error } = await supabase.auth.mfa.challenge({
        factorId: factor.id,
      });
      if (error) throw error;
      setChallengeId(data.id);
      setShowDisableChallenge(true);
    } catch (err) {
      console.error("MFA disable challenge failed:", err);
      setMfaMessage("Failed to start MFA verification. Please try again.");
    }
  }, []);

  // Verify the challenge code and unenroll
  const verifyDisableMfa = useCallback(
    async (code) => {
      if (!code || code.length !== 6) return false;
      setMfaMessage("");
      try {
        const { data: factors } = await supabase.auth.mfa.listFactors();
        const factor = factors?.totp?.[0];
        if (!factor || !challengeId) return false;

        const { error: verifyError } = await supabase.auth.mfa.verify({
          factorId: factor.id,
          challengeId,
          code,
        });
        if (verifyError) throw verifyError;

        // Now unenroll
        const { error: unenrollError } = await supabase.auth.mfa.unenroll({
          factorId: factor.id,
        });
        if (unenrollError) throw unenrollError;

        setMfaEnabled(false);
        setShowDisableChallenge(false);
        setChallengeId(null);
        setMfaMessage("Two‑factor authentication has been disabled.");
        return true;
      } catch (err) {
        console.error("MFA verify/unenroll failed:", err);
        setMfaMessage(
          err.message || "Failed to verify or disable MFA. Please try again.",
        );
        return false;
      }
    },
    [challengeId],
  );

  const onEnrollmentComplete = useCallback(() => {
    setShowEnrollment(false);
    setMfaEnabled(true);
    setMfaMessage("");
  }, []);

  return {
    mfaEnabled,
    showEnrollment,
    setShowEnrollment,
    disableMfa: startDisableMfa, // changed: now starts the challenge
    verifyDisableMfa,
    showDisableChallenge,
    setShowDisableChallenge,
    onEnrollmentComplete,
    checkMfaStatus,
    checkingMfa,
    mfaChecked,
    mfaMessage,
  };
}
