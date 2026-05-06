"use client";

import { useCallback, useEffect } from "react";
import useTradeStore from "../../stores/tradeStore";
import { useAuth } from "../../auth/hooks/useAuth";
import securityService from "../../lib/security";

export function useTrades() {
  const { user } = useAuth();
  const userId = user?.id;

  const {
    events,
    loading,
    error,
    initialized,
    fetchEvents,
    createEvent,
    updateEventName,
    deleteEvent,
    findOrCreateLatestEvent,

    sessions,
    sessionsLoading,
    sessionsError,
    fetchSessions,
    createSession,
    deleteSession,
    createTradeSession,
    clearSessions,

    updateTradeItem,
    deleteTradeItem,
    convertEventToCollection,
  } = useTradeStore();

  // Load events when user changes
  useEffect(() => {
    if (userId) {
      fetchEvents(userId);
    }
  }, [userId, fetchEvents]);

  // wrappers
  // ----- Events -----
  //Allow user to create event
  const handleCreateEvent = useCallback(
    async (name, eventDate) => {
      if (!userId) throw new Error("Not authenticated");
      const sanitizedName = securityService.sanitizeText(name, 100);
      if (!sanitizedName || sanitizedName.trim() === "") {
        throw new Error("Event name is required");
      }
      return createEvent(userId, sanitizedName, eventDate);
    },
    [userId, createEvent],
  );

  //will find or create a new event list after a trade session is complete
  const handleFindOrCreateEvent = useCallback(async () => {
    if (!userId) throw new Error("Not authenticated");
    return findOrCreateLatestEvent(userId);
  }, [userId, findOrCreateLatestEvent]);

  //allow user to update event name
  const handleUpdateEventName = useCallback(
    async (eventId, newName) => {
      return updateEventName(eventId, newName);
    },
    [updateEventName],
  );

  const handleFetchEvents = useCallback(
    async (includeExpired = false) => {
      // Always call the store function – it handles the null-user case internally
      await fetchEvents(userId, includeExpired);
    },
    [userId, fetchEvents],
  );

  //allow user to delete events
  const handleDeleteEvent = useCallback(
    async (eventId) => {
      await deleteEvent(eventId);
    },
    [deleteEvent],
  );

  // ----- Sessions -----

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

  const handleDeleteSession = useCallback(
    async (eventId, sessionId) => {
      return deleteSession(eventId, sessionId);
    },
    [deleteSession],
  );

  const handleCreateTradeSession = useCallback(
    async (eventId, sessionName, items) => {
      return createTradeSession(eventId, sessionName, items);
    },
    [createTradeSession],
  );

  // ----- Trade Items -----

  const handleUpdateTradeItem = useCallback(
    async (sessionId, itemId, updates) => {
      return updateTradeItem(sessionId, itemId, updates);
    },
    [updateTradeItem],
  );

  const handleDeleteTradeItem = useCallback(
    async (sessionId, itemId) => {
      return deleteTradeItem(sessionId, itemId);
    },
    [deleteTradeItem],
  );

  // ----- Converting Events to Collections  -----

  const handleConvertToCollection = useCallback(
    async (eventId, collectionName) => {
      if (!userId) throw new Error("Not authenticated");
      return convertEventToCollection(eventId, collectionName, userId);
    },
    [userId, convertEventToCollection],
  );

  return {
    events,
    loading,
    error,
    initialized,
    createEvent: handleCreateEvent,
    updateEventName: handleUpdateEventName,
    deleteEvent: handleDeleteEvent,
    fetchEvents: handleFetchEvents,

    sessions,
    sessionsLoading,
    sessionsError,
    fetchSessions: handleFetchSessions,
    createSession: handleCreateSession,
    clearSessions,

    findOrCreateEvent: handleFindOrCreateEvent,
    createTradeSession: handleCreateTradeSession,
    deleteSession: handleDeleteSession,

    updateTradeItem: handleUpdateTradeItem,
    deleteTradeItem: handleDeleteTradeItem,

    convertToCollection: handleConvertToCollection,
  };
}
