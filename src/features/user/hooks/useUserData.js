"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../../../../lib/supabase/api";
import securityService from "../../../../lib/security";

export function useUserData(user) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const hasFetchedRef = useRef(false);

  //Fetches all the users data for the profile settings
  const fetchUserData = useCallback(async () => {
    if (!user || hasFetchedRef.current) return; //no user will not allow user to progress to the settings
    try {
      setLoading(true);
      const {
        data: { user: authUser },
        error,
      } = await supabase.auth.getUser(); //pull user from supabase db
      if (error) throw error;
      setName(securityService.sanitizeName(authUser.user_metadata?.name || "")); //name is sanitized for any attacks and will be set
      setEmail(securityService.sanitizeEmail(authUser.email || "")); //sanitize users email and sets it
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

  //clears all fields in the form
  const resetForm = useCallback(() => {
    hasFetchedRef.current = false;
    fetchUserData();
  }, [fetchUserData]);

  return { name, setName, email, setEmail, loading, resetForm };
}
