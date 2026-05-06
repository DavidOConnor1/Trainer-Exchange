// hooks/v1/useCollections.js
"use client";

import { useCallback, useEffect } from "react";
import useCollectionStore from "../../stores/collectionStore";
import { useAuth } from "../../auth/hooks/useAuth";

export function useCollections() {
  const { user } = useAuth();
  const userId = user?.id;

  const {
    collections,
    loading,
    error,
    initialized,
    fetchCollections,
    createCollection: storeCreateCollection,
    updateCollection: storeUpdateCollection,
    deleteCollection: storeDeleteCollection,
    clearCollections,
  } = useCollectionStore();

  // Fetch collections when user changes
  useEffect(() => {
    if (userId) {
      fetchCollections(userId);
    } else {
      clearCollections();
    }
  }, [userId, fetchCollections, clearCollections]);

  // Create collection wrapper
  const createCollection = useCallback(
    async (name, description = "") => {
      if (!userId) throw new Error("User not authenticated");

      try {
        const result = await storeCreateCollection(userId, name, description);
        return result;
      } catch (error) {
        console.error("Failed to create collection:", error);
        throw error;
      }
    },
    [userId, storeCreateCollection],
  );

  // Update collection wrapper
  const updateCollection = useCallback(
    async (collectionId, updates) => {
      if (!userId) throw new Error("User not authenticated");

      try {
        const result = await storeUpdateCollection(
          collectionId,
          updates,
          userId,
        );
        return result;
      } catch (error) {
        console.error("Failed to update collection:", error);
        throw error;
      }
    },
    [userId, storeUpdateCollection],
  );

  // Delete collection wrapper
  const deleteCollection = useCallback(
    async (collectionId) => {
      if (!userId) throw new Error("User not authenticated");
      if (!confirm("Delete this collection and all cards in it?")) return;

      try {
        await storeDeleteCollection(collectionId, userId);
      } catch (error) {
        console.error("Failed to delete collection:", error);
        throw error;
      }
    },
    [userId, storeDeleteCollection],
  );

  // Get single collection
  const getCollectionById = useCallback(
    (collectionId) => {
      return collections.find((c) => c.id === collectionId);
    },
    [collections],
  );

  return {
    collections,
    loading,
    error,
    initialized,
    createCollection,
    updateCollection,
    deleteCollection,
    getCollectionById,
    refreshCollections: () => userId && fetchCollections(userId, true),
  };
}
