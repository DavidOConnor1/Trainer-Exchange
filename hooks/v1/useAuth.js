"use client";
import { supabase } from "../../lib-supa/v1/api";
import { useState, useEffect } from "react";

export function useAuth() {
  //start useAuth

  
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  //fetches the current session
  const fetchSession = async () => {
   supabase.auth.getSession().then(({data: {session}}) => {
    setUser(session?.user?? null);
    setLoading(false);
   });
  }; //end fetch session

  useEffect(() => {//start use effect
    fetchSession();
  
  //listen for changes
   const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []); //end useEffect

  //signout option
  const signOut = supabase.auth.signOut();

  return {user, loading, signOut};
} //end use auth
