// hooks/useCollectionStore.js
"use client";

import useCollectionStore from '../../stores/collectionStore';
import { useAuth } from '../../auth/hooks/useAuth';
import { useEffect, useRef } from 'react';

export function useCollections() {
  const { user } = useAuth();
  const userId = user?.id;
  
  // Get store actions and state
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
    getCollectionById
  } = useCollectionStore();
  
  const hasFetchedRef = useRef(false);
  
  // Auto-fetch collections when user logs in
  useEffect(() => {
    if (userId && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchCollections(userId);
    } else if (!userId && collections.length > 0) {
      // Clear collections when user logs out
      clearCollections();
      hasFetchedRef.current = false;
    }
  }, [userId, fetchCollections, clearCollections, collections.length]);
  
  // Wrapper functions with automatic userId injection
  const createCollection = async (name, description) => {
    if (!userId) throw new Error('User not authenticated');
    return storeCreateCollection(userId, name, description);
  };
  
  const updateCollection = async (collectionId, updates) => {
    if (!userId) throw new Error('User not authenticated');
    return storeUpdateCollection(collectionId, updates, userId);
  };
  
  const deleteCollection = async (collectionId) => {
    if (!userId) throw new Error('User not authenticated');
    return storeDeleteCollection(collectionId, userId);
  };
  
  const refreshCollections = () => {
    if (userId) {
      fetchCollections(userId, true); // Force refresh
    }
  };
  
  return {
    collections,
    loading: loading || (!initialized && !!userId),
    error,
    createCollection,
    updateCollection,
    deleteCollection,
    refreshCollections,
    getCollectionById,
    hasCollections: collections.length > 0
  };
}