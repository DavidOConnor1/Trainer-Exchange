// hooks/v2/useTrades.js
"use client";

import { useCallback, useEffect } from "react";
import useTradeStore from "../../stores/tradeStore";
import { useAuth } from "../../auth/hooks/useAuth";

export function useTrades() {
  const { user } = useAuth();
  const userId = user?.id;

  const {
    // Events
    events,
    loading,
    error,
    initialized,
    fetchEvents,
    createEvent,
    deleteEvent,
    findOrCreateLatestEvent,

    // Sessions
    sessions,
    sessionsLoading,
    sessionsError,
    fetchSessions,
    createSession,
    createTradeSession,
    clearSessions,
  } = useTradeStore();

  // Load events when user changes
  useEffect(() => {
    if (userId) {
      fetchEvents(userId);
    }
  }, [userId, fetchEvents]);

  // Wrappers
  const handleCreateEvent = useCallback(
    async (name, eventDate) => {
      if (!userId) throw new Error("Not authenticated");
      return createEvent(userId, name, eventDate);
    },
    [userId, createEvent],
  );

  const handleDeleteEvent = useCallback(
    async (eventId) => {
      await deleteEvent(eventId);
    },
    [deleteEvent],
  );

  const handleFetchSessions = useCallback(
    async (eventId) => {
      await fetchSessions(eventId);
    },
    [fetchSessions],
  );

  const handleCreateSession = useCallback(
    async (eventId, name) => {
      if (!userId) throw new Error("Not authenticated");
      return createSession(eventId, name);
    },
    [userId, createSession],
  );

  const handleFindOrCreateEvent = useCallback(async () => {
    if (!userId) throw new Error("Not authenticated");
    return findOrCreateLatestEvent(userId);
  }, [userId, findOrCreateLatestEvent]);

  const handleCreateTradeSession = useCallback(
    async (eventId, sessionName, items) => {
      return createTradeSession(eventId, sessionName, items);
    },
    [createTradeSession],
  );

  return {
    events,
    loading,
    error,
    initialized,
    createEvent: handleCreateEvent,
    deleteEvent: handleDeleteEvent,
    sessions,
    sessionsLoading,
    sessionsError,
    fetchSessions: handleFetchSessions,
    createSession: handleCreateSession,
    clearSessions,
    findOrCreateEvent: handleFindOrCreateEvent,
    createTradeSession: handleCreateTradeSession,
  };
}
