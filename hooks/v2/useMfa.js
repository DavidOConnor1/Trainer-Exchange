// hooks/useMfa.js
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../../lib/supabase/api";

export function useMfa(user) {
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [showEnrollment, setShowEnrollment] = useState(false);
  const mountedRef = useRef(true);
  const userChangedRef = useRef(false);

  // Mark unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Only run MFA check when user first becomes available
  useEffect(() => {
    if (!user || userChangedRef.current) return;
    userChangedRef.current = true;

    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase.auth.mfa.listFactors();
        if (!cancelled && mountedRef.current) {
          setMfaEnabled(!!data?.totp?.length);
        }
      } catch (error) {
        // Silently ignore – user may not have MFA permissions yet
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const disableMfa = useCallback(async () => {
    if (!confirm("Disable two-factor authentication?")) return;
    const { data } = await supabase.auth.mfa.listFactors();
    const factor = data?.totp?.[0];
    if (!factor) return;
    const { error } = await supabase.auth.mfa.unenroll({ factorId: factor.id });
    if (!error && mountedRef.current) {
      setMfaEnabled(false);
    }
  }, []);

  const onEnrollmentComplete = useCallback(() => {
    if (mountedRef.current) {
      setShowEnrollment(false);
      setMfaEnabled(true);
    }
  }, []);

  return {
    mfaEnabled,
    showEnrollment,
    setShowEnrollment,
    disableMfa,
    onEnrollmentComplete,
  };
}
