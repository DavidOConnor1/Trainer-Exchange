"use client";
import { supabase } from "../../../../lib/supabase/api";
import { useState, useEffect, useRef, useCallback } from "react";

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [needsMfa, setNeedsMfa] = useState(false);
  const [mfaFactorId, setMfaFactorId] = useState(null);
  const inactivityTimerRef = useRef(null);
  const fetchingRef = useRef(false); // prevent overlapping fetches
  const mountedRef = useRef(true); // ignore state updates after unmount

  // Derived: user is only considered fully authenticated when MFA is NOT required
  const isAuthenticated = !!user && !needsMfa;

  // Fetch current session and check MFA status
  const fetchSession = useCallback(async () => {
    if (fetchingRef.current) return; // already in progress
    fetchingRef.current = true;

    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) throw error;

      if (session) {
        // Session exists – now check if MFA is required
        const { data: aalData } =
          await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

        if (
          aalData?.nextLevel === "aal2" &&
          aalData.currentLevel !== aalData.nextLevel
        ) {
          const { data: factors } = await supabase.auth.mfa.listFactors();
          const totpFactor = factors?.totp?.[0];
          if (totpFactor && mountedRef.current) {
            setUser(session.user);
            setNeedsMfa(true);
            setMfaFactorId(totpFactor.id);
            setLoading(false);
            return;
          }
        }

        // No MFA required
        if (mountedRef.current) {
          setUser(session.user);
          setNeedsMfa(false);
          setMfaFactorId(null);
          setLoading(false);
        }
      } else {
        if (mountedRef.current) {
          setUser(null);
          setNeedsMfa(false);
          setMfaFactorId(null);
          setLoading(false);
        }
      }
    } catch (error) {
      console.error("Error fetching session:", error);
      if (mountedRef.current) {
        setUser(null);
        setNeedsMfa(false);
        setMfaFactorId(null);
        setLoading(false);
      }
    } finally {
      fetchingRef.current = false;
    }
  }, []);

  // Flush session on inactivity
  const flushSession = async () => {
    try {
      await supabase.auth.signOut();
      if (mountedRef.current) {
        setUser(null);
        setNeedsMfa(false);
        setMfaFactorId(null);
      }
    } catch (error) {
      console.error("Error flushing session:", error);
    }
  };

  // Reset inactivity timer
  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    if (user) {
      inactivityTimerRef.current = setTimeout(
        () => {
          flushSession();
        },
        15 * 60 * 1000,
      );
    }
  }, [user]);

  // Run once on mount, and listen for auth state changes
  useEffect(() => {
    mountedRef.current = true;
    fetchSession(); // initial fetch

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      // Whenever auth state changes (e.g., after MFA verification), re‑fetch
      if (mountedRef.current) {
        fetchSession();
      }
    });

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    };
  }, [fetchSession]); // only depends on fetchSession (stable)

  // Activity listeners for inactivity timeout (unchanged)
  useEffect(() => {
    const events = ["mousedown", "keydown", "scroll", "touchstart", "click"];
    const handleUserActivity = () => {
      if (user) resetInactivityTimer();
    };
    events.forEach((event) =>
      window.addEventListener(event, handleUserActivity),
    );
    return () => {
      events.forEach((event) =>
        window.removeEventListener(event, handleUserActivity),
      );
    };
  }, [user, resetInactivityTimer]);

  // Sign out
  const signOut = async () => {
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    await supabase.auth.signOut();
    if (mountedRef.current) {
      setUser(null);
      setNeedsMfa(false);
      setMfaFactorId(null);
    }
  };

  // Complete MFA challenge
  const completeMfaChallenge = async (code) => {
    if (!mfaFactorId || !code) return false;
    try {
      const { data: challengeData, error: challengeError } =
        await supabase.auth.mfa.challenge({ factorId: mfaFactorId });
      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: mfaFactorId,
        challengeId: challengeData.id,
        code,
      });
      if (verifyError) throw verifyError;

      await supabase.auth.refreshSession();
      // onAuthStateChange will trigger fetchSession automatically,
      // which will update the state.
      return true;
    } catch (error) {
      console.error("MFA verification failed:", error);
      return false;
    }
  };

  const cancelMfa = () => {
    signOut();
  };

  return {
    user,
    loading,
    isAuthenticated,
    needsMfa,
    mfaFactorId,
    completeMfaChallenge,
    cancelMfa,
    signOut,
  };
}
