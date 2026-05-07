// hooks/v2/useUserData.js
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../../lib/supabase/api";
import securityService from "../../lib/security";

export function useUserData(user) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const hasFetchedRef = useRef(false);

  const fetchUserData = useCallback(async () => {
    if (!user || hasFetchedRef.current) return;
    try {
      setLoading(true);
      const {
        data: { user: authUser },
        error,
      } = await supabase.auth.getUser();
      if (error) throw error;
      setName(securityService.sanitizeName(authUser.user_metadata?.name || ""));
      setEmail(securityService.sanitizeEmail(authUser.email || ""));
      hasFetchedRef.current = true;
    } catch (err) {
      console.error("Failed to fetch user data", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user && !hasFetchedRef.current) fetchUserData();
  }, [user, fetchUserData]);

  const resetForm = useCallback(() => {
    hasFetchedRef.current = false;
    fetchUserData();
  }, [fetchUserData]);

  return { name, setName, email, setEmail, loading, resetForm };
}
