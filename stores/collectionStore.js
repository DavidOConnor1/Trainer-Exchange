"use client"; // runs on client side server

import { create } from "zustand"; //will allow the page to be transported as a singleton instance
import { persist } from "zustand/middleware";
import { supabase } from "../lib/supabase/api";
import securityService from "../lib/security";

const useCollectionStore = create(
  // Add persistence to localStorage
  persist(
    (set, get) => ({
      // State
      collections: [],
      loading: false,
      error: null,
      initialized: false,
      lastFetched: null,

      // Fetch all collections for current user
      fetchCollections: async (userId, force = false) => {
        // Don't fetch if no user
        if (!userId) {
          set({ collections: [], loading: false, initialized: true });
          return;
        }

        // Prevent multiple simultaneous fetches
        if (get().loading && !force) {
          console.log("Fetch already in progress, skipping...");
          return;
        }

        // Don't refetch if we have data and it's less than 30 seconds old
        const lastFetched = get().lastFetched;
        if (
          !force &&
          lastFetched &&
          Date.now() - lastFetched < 30000 &&
          get().collections.length > 0
        ) {
          console.log("Using cached collections (less than 30s old)");
          return;
        }

        set({ loading: true, error: null });

        try {
          const { data, error } = await supabase
            .from("collections")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false });

          if (error) throw error;

          set({
            collections: data || [],
            loading: false,
            initialized: true,
            error: null,
            lastFetched: Date.now(),
          });
        } catch (err) {
          console.error("Error fetching collections:", err);
          set({
            error: err.message,
            loading: false,
            initialized: true,
          });
        }
      },

      // Create a new collection with sanitization
      createCollection: async (userId, name, description = "") => {
        if (!userId) throw new Error("User not authenticated");

        // Sanitize inputs
        const sanitizedName = securityService.sanitizeText(name, 100);
        const sanitizedDescription = description
          ? securityService.sanitizeDescription(description, 500)
          : null;

        // Validate after sanitization
        if (!sanitizedName || sanitizedName.trim() === "") {
          throw new Error("Collection name is required");
        }

        // Check for suspicious patterns
        if (securityService.containsSuspiciousPatterns(sanitizedName)) {
          throw new Error("Collection name contains invalid characters");
        }

        if (
          sanitizedDescription &&
          securityService.containsSuspiciousPatterns(sanitizedDescription)
        ) {
          throw new Error("Description contains invalid characters");
        }

        // Make database safe (additional layer)
        const dbSafeName = securityService.makeDBSafe(sanitizedName);
        const dbSafeDescription = sanitizedDescription
          ? securityService.makeDBSafe(sanitizedDescription)
          : null;

        // Optimistically update UI
        const tempId = `temp-${Date.now()}`;
        const optimisticCollection = {
          id: tempId,
          user_id: userId,
          name: dbSafeName,
          description: dbSafeDescription,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          isTemp: true, // Mark as temporary
        };

        set((state) => ({
          collections: [optimisticCollection, ...state.collections],
        }));

        try {
          const { data, error } = await supabase
            .from("collections")
            .insert([
              {
                user_id: userId,
                name: dbSafeName,
                description: dbSafeDescription,
              },
            ])
            .select()
            .single();

          if (error) throw error;

          // Replace temporary collection with real one
          set((state) => ({
            collections: state.collections.map((c) =>
              c.id === tempId ? data : c,
            ),
          }));

          return data;
        } catch (err) {
          // Remove the optimistic collection on error
          set((state) => ({
            collections: state.collections.filter((c) => c.id !== tempId),
            error: err.message,
          }));
          throw err;
        }
      },

      // Update a collection with sanitization
      updateCollection: async (collectionId, updates, userId) => {
        if (!userId) throw new Error("User not authenticated");

        // Sanitize updates if they contain name or description
        const sanitizedUpdates = { ...updates };

        if (updates.name !== undefined) {
          const sanitizedName = securityService.sanitizeText(updates.name, 100);
          if (!sanitizedName || sanitizedName.trim() === "") {
            throw new Error("Collection name cannot be empty");
          }
          if (securityService.containsSuspiciousPatterns(sanitizedName)) {
            throw new Error("Collection name contains invalid characters");
          }
          sanitizedUpdates.name = securityService.makeDBSafe(sanitizedName);
        }

        if (updates.description !== undefined) {
          const sanitizedDescription = updates.description
            ? securityService.sanitizeDescription(updates.description, 500)
            : null;
          if (
            sanitizedDescription &&
            securityService.containsSuspiciousPatterns(sanitizedDescription)
          ) {
            throw new Error("Description contains invalid characters");
          }
          sanitizedUpdates.description = sanitizedDescription
            ? securityService.makeDBSafe(sanitizedDescription)
            : null;
        }

        // Store original state for rollback
        const originalCollections = get().collections;

        // Optimistically update UI
        set((state) => ({
          collections: state.collections.map((c) =>
            c.id === collectionId
              ? { ...c, ...sanitizedUpdates, isUpdating: true }
              : c,
          ),
        }));

        try {
          const { data, error } = await supabase
            .from("collections")
            .update({
              ...sanitizedUpdates,
              updated_at: new Date().toISOString(),
            })
            .eq("id", collectionId)
            .eq("user_id", userId)
            .select()
            .single();

          if (error) throw error;

          // Update with real data
          set((state) => ({
            collections: state.collections.map((c) =>
              c.id === collectionId ? { ...data, isUpdating: false } : c,
            ),
          }));

          return data;
        } catch (err) {
          // Rollback on error
          set({ collections: originalCollections, error: err.message });
          throw err;
        }
      },

      // Delete a collection
      deleteCollection: async (collectionId, userId) => {
        if (!userId) throw new Error("User not authenticated");

        // Store the collection being deleted for potential rollback
        const deletedCollection = get().collections.find(
          (c) => c.id === collectionId,
        );

        // Optimistically remove from UI
        set((state) => ({
          collections: state.collections.filter((c) => c.id !== collectionId),
        }));

        try {
          // First delete all cards in the collection
          const { error: cardsError } = await supabase
            .from("cards")
            .delete()
            .eq("collection_id", collectionId);

          if (cardsError) throw cardsError;

          // Then delete the collection
          const { error } = await supabase
            .from("collections")
            .delete()
            .eq("id", collectionId)
            .eq("user_id", userId);

          if (error) throw error;

          // Success - no further action needed
        } catch (err) {
          // Rollback on error
          if (deletedCollection) {
            set((state) => ({
              collections: [deletedCollection, ...state.collections],
              error: err.message,
            }));
          }
          throw err;
        }
      },

      // Get a single collection by ID
      getCollectionById: (collectionId) => {
        return get().collections.find((c) => c.id === collectionId);
      },

      // Clear all collections (useful on logout)
      clearCollections: () => {
        set({
          collections: [],
          loading: false,
          error: null,
          initialized: false,
          lastFetched: null,
        });
      },

      // Reset store (for testing or full logout)
      reset: () => {
        set({
          collections: [],
          loading: false,
          error: null,
          initialized: false,
          lastFetched: null,
        });
      },
    }),
    {
      name: "collection-storage", // unique name for localStorage
      partialize: (state) => ({
        // Only persist these fields (exclude loading, error, etc.)
        collections: state.collections.filter(
          (c) => !c.isTemp && !c.isUpdating,
        ),
        lastFetched: state.lastFetched,
      }),
    },
  ),
);

export default useCollectionStore;
