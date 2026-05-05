// stores/tradeStore.js
"use client";

import { create } from "zustand";
import { supabase } from "../lib/supabase/api";

const useTradeStore = create((set, get) => ({
  // ----- Events -----
  events: [],
  loading: false,
  error: null,
  initialized: false,

  fetchEvents: async (userId, includeExpired = false) => {
    if (!userId) {
      set({ loading: false, initialized: true });
      return;
    }
    set({ loading: true, error: null });
    try {
      let query = supabase
        .from("trade_events")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (!includeExpired) {
        query = query.gte("expires_at", new Date().toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;
      set({ events: data || [], loading: false, initialized: true });
    } catch (err) {
      set({ error: err.message, loading: false, initialized: true });
    }
  },

  createEvent: async (userId, name, eventDate) => {
    if (!userId) throw new Error("User not authenticated");

    const expiresAt = new Date(
      Date.now() + 60 * 24 * 60 * 60 * 1000,
    ).toISOString();

    const { data, error } = await supabase
      .from("trade_events")
      .insert({
        user_id: userId,
        name,
        event_date: eventDate,
        expires_at: expiresAt,
      })
      .select()
      .single();

    if (error) throw error;
    set((state) => ({ events: [data, ...state.events] }));
    return data;
  },

  // Find the most recent active trade event for the user, or create one
  findOrCreateLatestEvent: async (userId) => {
    // Try to find the latest active event
    const { data: latest, error } = await supabase
      .from("trade_events")
      .select("*")
      .eq("user_id", userId)
      .gte("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (latest) return latest;

    // No active event – create a new one with a default name and today's date
    const today = new Date().toISOString().split("T")[0];
    const expiresAt = new Date(
      Date.now() + 60 * 24 * 60 * 60 * 1000,
    ).toISOString();

    const { data: newEvent, error: createError } = await supabase
      .from("trade_events")
      .insert({
        user_id: userId,
        name: "Trading Session",
        event_date: today,
        expires_at: expiresAt,
      })
      .select()
      .single();

    if (createError) throw createError;
    return newEvent;
  },

  // Create a session in a given event and add all trade items
  createTradeSession: async (eventId, sessionName, items) => {
    // Insert session
    const { data: session, error: sessionError } = await supabase
      .from("trade_sessions")
      .insert({
        event_id: eventId,
        name: sessionName || `Trade @ ${new Date().toLocaleTimeString()}`,
      })
      .select()
      .single();

    if (sessionError) throw sessionError;

    // Insert all items attached to the session
    const itemsWithSession = items.map((item) => ({
      ...item,
      session_id: session.id,
    }));

    const { error: itemsError } = await supabase
      .from("trade_items")
      .insert(itemsWithSession);

    if (itemsError) throw itemsError;

    // Optionally update local sessions list
    return session;
  },

  deleteEvent: async (eventId) => {
    const { error } = await supabase
      .from("trade_events")
      .delete()
      .eq("id", eventId);

    if (error) throw error;
    set((state) => ({
      events: state.events.filter((e) => e.id !== eventId),
    }));
  },

  // ----- Trade Items -----

  deleteTradeItem: async (sessionId, itemId) => {
    const { error } = await supabase
      .from("trade_items")
      .delete()
      .eq("id", itemId);

    if (error) throw error;

    set((state) => ({
      sessions: state.sessions.map((session) =>
        session.id === sessionId
          ? {
              ...session,
              trade_items: (session.trade_items || []).filter(
                (item) => item.id !== itemId,
              ),
            }
          : session,
      ),
    }));
  },

  updateTradeItem: async (sessionId, itemId, updates) => {
    const { data, error } = await supabase
      .from("trade_items")
      .update(updates)
      .eq("id", itemId)
      .select()
      .single();

    if (error) throw error;

    set((state) => ({
      sessions: state.sessions.map((session) =>
        session.id === sessionId
          ? {
              ...session,
              trade_items: (session.trade_items || []).map((item) =>
                item.id === itemId ? { ...item, ...data } : item,
              ),
            }
          : session,
      ),
    }));

    return data;
  },

  // ----- Sessions -----
  sessions: [],
  sessionsLoading: false,
  sessionsError: null,
  currentEventId: null,

  fetchSessions: async (eventId) => {
    set({
      sessionsLoading: true,
      sessionsError: null,
      currentEventId: eventId,
    });
    try {
      const { data: sessions, error } = await supabase
        .from("trade_sessions")
        .select("*, trade_items(*)")
        .eq("event_id", eventId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      set({ sessions: sessions || [], sessionsLoading: false });
    } catch (err) {
      set({ sessionsError: err.message, sessionsLoading: false });
    }
  },

  createSession: async (eventId, name) => {
    const { data, error } = await supabase
      .from("trade_sessions")
      .insert({ event_id: eventId, name })
      .select("*, trade_items(*)")
      .single();

    if (error) throw error;
    set((state) => ({ sessions: [...state.sessions, data] }));
    return data;
  },

  clearSessions: () =>
    set({ sessions: [], currentEventId: null, sessionsError: null }),
}));

export default useTradeStore;
