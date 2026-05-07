// hooks/useProfileUpdate.js
"use client";

import { useState, useCallback, useRef } from "react";
import { supabase } from "../../lib/supabase/api";
import securityService from "../../lib/security";

export function useProfileUpdate(user, name, email, onSuccess, onEmailChanged) {
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const rateLimiterRef = useRef(null);

  // Initialise rate limiter once
  if (!rateLimiterRef.current) {
    rateLimiterRef.current = securityService.getRateLimiter(
      "profile-update",
      5,
      60000,
    );
  }

  const updateProfile = useCallback(
    async (e, password, confirmPassword) => {
      e.preventDefault();

      if (!user) {
        setMessage({
          text: "You must be logged in to update your profile",
          type: "error",
        });
        return;
      }
      if (!rateLimiterRef.current.canProceed(user.id)) {
        setMessage({
          text: "Too many update attempts. Please wait a moment.",
          type: "error",
        });
        return;
      }

      setUpdating(true);
      setMessage({ text: "", type: "" });

      try {
        const validation = securityService.validateProfileUpdate({
          name,
          email,
          password,
        });
        if (!validation.isValid) {
          setMessage({
            text: Object.values(validation.errors)[0],
            type: "error",
          });
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

        if (Object.keys(authUpdates).length === 0) {
          setMessage({ text: "No changes to update", type: "info" });
          return;
        }

        const { error: updateError } =
          await supabase.auth.updateUser(authUpdates);
        if (updateError) throw updateError;

        setMessage({ text: "Profile updated successfully!", type: "success" });

        if (authUpdates.email) {
          if (onEmailChanged) onEmailChanged();
          return;
        }

        if (onSuccess) onSuccess();
      } catch (error) {
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
    [user, name, email, onSuccess, onEmailChanged],
  );

  return { updateProfile, updating, message, setMessage };
}
