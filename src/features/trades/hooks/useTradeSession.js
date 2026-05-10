"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useTrades } from "./useTrades";
import { useCardSearch } from "@/features/search/hooks/useCardSearch";
import { getCardImage } from "../../../../lib/pokemonApi/searchService";
import { supabase } from "../../../../lib/supabase/api";

export function useTradeSession() {
  const { findOrCreateEvent, createTradeSession } = useTrades();
  const { search, cards: searchResults, loading: searching } = useCardSearch();

  const [tradeInItems, setTradeInItems] = useState([]);
  const [tradeOutItems, setTradeOutItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDirection, setSelectedDirection] = useState("in");
  const [completing, setCompleting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [selectedCard, setSelectedCard] = useState(null);
  const [priceLoading, setPriceLoading] = useState(false);
  const priceCache = useRef({});
  const fetchingPrices = useRef(new Set()); // avoid duplicate fetches

  const [showCollectionModal, setShowCollectionModal] = useState(false);

  const openCollectionModal = () => setShowCollectionModal(true);
  const closeCollectionModal = () => setShowCollectionModal(false);

  // ----- Collection handling -----

  // Add a card from user's collection (trade out only)
  const addCardFromCollection = useCallback((collectionCard) => {
    const newItem = {
      card_id: collectionCard.card_id || collectionCard.id, // TCGdex full ID
      collection_card_id: collectionCard.id, // Supabase UUID of the card in collection
      name: collectionCard.name,
      set_name: collectionCard.set_name,
      image_url: collectionCard.image_url,
      trade_price: Number(collectionCard.price) || 0, // use stored price
      quantity: 1,
    };
    setTradeOutItems((prev) => [...prev, newItem]);
    closeCollectionModal();
  }, []);

  // ----- search handling -----
  const handleSearch = useCallback(
    (e) => {
      const value = e.target.value;
      setSearchTerm(value);
      if (value.length >= 2) {
        search({ name: value, pageSize: 10 }, { debounceMs: 400 });
      }
    },
    [search],
  );

  // ----- pre‑fetch pricing for all search results -----
  const prefetchPrices = useCallback(async (cards) => {
    const backendUrl = (
      process.env.NEXT_PUBLIC_BACKEND_URL ||
      "https://trainer-exchange-backend-services-production.up.railway.app"
    ).replace(/\/$/, "");
    const toFetch = cards.filter(
      (c) => !priceCache.current[c.id] && !fetchingPrices.current.has(c.id),
    );

    for (const card of toFetch) {
      fetchingPrices.current.add(card.id);
      try {
        const res = await fetch(
          `${backendUrl}/api/cards/id/${card.id}/pricing`,
        );
        const data = await res.json();
        priceCache.current[card.id] = data.pricing?.trend || 0;
      } catch (e) {
        // ignore
      } finally {
        fetchingPrices.current.delete(card.id);
      }
    }
  }, []);

  // whenever search results change, pre‑fetch
  useEffect(() => {
    if (searchResults.length > 0) {
      prefetchPrices(searchResults);
    }
  }, [searchResults, prefetchPrices]);

  // ----- open price modal -----
  const openPriceModal = useCallback((card) => {
    setSelectedCard(card);
  }, []);

  // ----- optimistic add + background price update -----
  const addCardOptimistic = useCallback(
    (card, rate) => {
      const newItem = {
        card_id: card.id,
        name: card.name,
        set_name: card.set?.name || "Unknown Set",
        image_url: getCardImage(card, "small"),
        trade_price: 0,
        quantity: 1,
      };

      // immediate UI update
      if (selectedDirection === "in") {
        setTradeInItems((prev) => [...prev, newItem]);
      } else {
        setTradeOutItems((prev) => [...prev, newItem]);
      }

      // clear search & modal
      setSearchTerm("");
      search({ name: "" }, { debounceMs: 0 });
      setSelectedCard(null);

      // determine price
      const price = priceCache.current[card.id] ?? 0;
      const finalPrice = parseFloat((price * rate).toFixed(2));

      const updateList = (items) =>
        items.map((item) =>
          item.card_id === card.id && item.trade_price === 0
            ? { ...item, trade_price: finalPrice }
            : item,
        );

      if (selectedDirection === "in") setTradeInItems(updateList);
      else setTradeOutItems(updateList);
    },
    [selectedDirection, search],
  );

  // modal actions
  const handleTradeIn = (rate) => {
    if (!selectedCard) return;
    addCardOptimistic(selectedCard, rate);
  };

  const handleTradeOut = () => {
    if (!selectedCard) return;
    addCardOptimistic(selectedCard, 1.0);
  };

  // ----- item manipulation -----
  const updateItem = (list, index, field, value) => {
    const updater = (prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item));
    if (list === "in") setTradeInItems(updater);
    else setTradeOutItems(updater);
  };

  const removeItem = (list, index) => {
    if (list === "in")
      setTradeInItems((prev) => prev.filter((_, i) => i !== index));
    else setTradeOutItems((prev) => prev.filter((_, i) => i !== index));
  };

  // ----- totals -----
  const totalIn = tradeInItems.reduce(
    (s, i) => s + (i.trade_price || 0) * (i.quantity || 1),
    0,
  );
  const totalOut = tradeOutItems.reduce(
    (s, i) => s + (i.trade_price || 0) * (i.quantity || 1),
    0,
  );
  const profit = totalIn - totalOut;

  // ----- complete trade -----
  const handleCompleteTrade = async () => {
    if (tradeInItems.length === 0 && tradeOutItems.length === 0) {
      alert("Add at least one card.");
      return;
    }

    if (
      !confirm(
        "Save this trade? Cards traded out will be removed from your collection.",
      )
    ) {
      return;
    }

    setCompleting(true);
    try {
      const event = await findOrCreateEvent();
      const allItems = [
        ...tradeInItems.map((i) => ({ ...i, direction: "in" })),
        ...tradeOutItems.map((i) => ({ ...i, direction: "out" })),
      ];
      await createTradeSession(event.id, null, allItems);

      // Remove traded out cards from the user's collection
      const cardsToRemove = tradeOutItems
        .filter((item) => item.collection_card_id)
        .map((item) => item.collection_card_id);

      if (cardsToRemove.length > 0) {
        // Delete cards from Supabase – only those that belong to the user (RLS handles security)
        const { error } = await supabase
          .from("cards")
          .delete()
          .in("id", cardsToRemove);
        if (error) console.error("Failed to remove collection cards:", error);
      }

      setSuccessMessage("Trade saved successfully!");
      setTradeInItems([]);
      setTradeOutItems([]);
    } catch (err) {
      console.error(err);
      alert("Failed to save trade.");
    } finally {
      setCompleting(false);
      setTimeout(() => setSuccessMessage(""), 3000);
    }
  };

  return {
    // data
    showCollectionModal,
    openCollectionModal,
    closeCollectionModal,
    addCardFromCollection,
    tradeInItems,
    tradeOutItems,
    searchTerm,
    selectedDirection,
    searchResults,
    searching,
    selectedCard,
    priceLoading,
    completing,
    successMessage,
    totalIn,
    totalOut,
    profit,

    // actions
    setSelectedDirection,
    handleSearch,
    openPriceModal,
    handleTradeIn,
    handleTradeOut,
    setSelectedCard,
    updateItem,
    removeItem,
    handleCompleteTrade,
  };
}
