"use client";
import { supabase } from "../../lib-supa/v1/api";
import { useState, useEffect, useRef } from "react";

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const inactivityTimerRef = useRef(null);

  // Fetch current session
  const fetchSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) throw error;
      
      // Check if session exists and isn't expired
      if (session && session.expires_at) {
        const isExpired = session.expires_at * 1000 < Date.now();
        if (isExpired) {
          await supabase.auth.signOut();
          setUser(null);
        } else {
          setUser(session.user);
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Error fetching session:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Flush session on inactivity
  const flushSession = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      console.log("Session flushed due to inactivity");
    } catch (error) {
      console.error("Error flushing session:", error);
    }
  };

  // Reset inactivity timer
  const resetInactivityTimer = () => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    
    if (user) {
      inactivityTimerRef.current = setTimeout(() => {
        flushSession();
      }, 15 * 60 * 1000); // 15 minutes
    }
  };

  useEffect(() => {
    fetchSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        resetInactivityTimer();
      } else if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    });

    // Set up activity listeners for inactivity timeout
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    const handleUserActivity = () => {
      if (user) resetInactivityTimer();
    };
    
    events.forEach(event => window.addEventListener(event, handleUserActivity));
    
    // Start timer if user is logged in
    if (user) resetInactivityTimer();

    // Cleanup
    return () => {
      subscription.unsubscribe();
      events.forEach(event => window.removeEventListener(event, handleUserActivity));
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, [user]); // Re-run when user changes

  const signOut = async () => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    await supabase.auth.signOut();
    setUser(null);
  };

  return { user, loading, signOut };
}//end useAuth