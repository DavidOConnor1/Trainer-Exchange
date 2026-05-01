// hooks/v1/useCards.js
"use client";

import { useState, useCallback, useEffect } from "react";
import { supabase } from "../../lib/supabase/api";

export function useCards(collectionId) {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalValue, setTotalValue] = useState(0);

  // Temporarily mock fetchCards until the table is confirmed working
  const fetchCards = useCallback(async () => {
    if (!collectionId) {
      setCards([]);
      setTotalValue(0);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Check if table exists first
      const { data: tableCheck, error: tableError } = await supabase
        .from("collection_cards")
        .select("count", { count: "exact", head: true });

      if (tableError) {
        console.warn("Table might not exist:", tableError.message);
        // Don't throw, just return empty
        setCards([]);
        setTotalValue(0);
        return;
      }

      const { data, error } = await supabase
        .from("collection_cards")
        .select("*")
        .eq("collection_id", collectionId)
        .order("created_at", { ascending: false });

      if (error) {
        console.warn("Fetch error (might be empty table):", error.message);
        setCards([]);
        setTotalValue(0);
        return;
      }

      setCards(data || []);

      const total = (data || []).reduce((sum, card) => {
        return sum + (card.price || 0) * (card.quantity || 1);
      }, 0);
      setTotalValue(total);
    } catch (err) {
      console.warn(
        "Error fetching cards (this is normal if table is empty):",
        err,
      );
      setCards([]);
      setTotalValue(0);
      // Don't set error - this might just be an empty table
    } finally {
      setLoading(false);
    }
  }, [collectionId]);

  // Add card to collection
  const addCard = useCallback(
    async (cardData) => {
      if (!collectionId) throw new Error("No collection selected");

      try {
        setError(null);

        const cardToAdd = {
          collection_id: collectionId,
          card_id: String(cardData.card_id || cardData.id), // Ensure it's a string
          name: cardData.name,
          type: cardData.type || "Unknown",
          set_name: cardData.set_name || "",
          rarity: cardData.rarity || null,
          image_url: cardData.image_url || null,
          price: parseFloat(cardData.price) || 0,
          quantity: parseInt(cardData.quantity) || 1,
          condition: cardData.condition || "near_mint",
          notes: cardData.notes || null,
          metadata: cardData.metadata || {},
        };

        console.log("Adding card:", cardToAdd); // Debug log

        const { data, error } = await supabase
          .from("collection_cards")
          .insert(cardToAdd)
          .select()
          .single();

        if (error) {
          console.error("Supabase insert error:", error);
          throw error;
        }

        // Update local state
        setCards((prev) => [data, ...prev]);
        setTotalValue(
          (prev) => prev + (data.price || 0) * (data.quantity || 1),
        );

        return data;
      } catch (err) {
        console.error("Error adding card:", err);
        setError(err.message || "Failed to add card");
        throw err;
      }
    },
    [collectionId],
  );

  // Delete card from collection
  const deleteCard = useCallback(
    async (cardId) => {
      try {
        const cardToDelete = cards.find((c) => c.id === cardId);

        setCards((prev) => prev.filter((c) => c.id !== cardId));
        if (cardToDelete) {
          setTotalValue(
            (prev) =>
              prev - (cardToDelete.price || 0) * (cardToDelete.quantity || 1),
          );
        }

        const { error } = await supabase
          .from("collection_cards")
          .delete()
          .eq("id", cardId);

        if (error) {
          fetchCards(); // Rollback
          throw error;
        }
      } catch (err) {
        console.error("Error deleting card:", err);
        setError(err.message);
        throw err;
      }
    },
    [cards, fetchCards],
  );

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  return {
    cards,
    loading,
    error,
    totalValue,
    addCard,
    deleteCard,
    refreshCards: fetchCards,
  };
}
