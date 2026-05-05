"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase/api";
import { useCollections } from "../../hooks/v1/useCollections";
import Image from "next/image";

export default function CollectionTradeModal({ onClose, onSelectCard }) {
  const { collections } = useCollections();
  const [selectedCollectionId, setSelectedCollectionId] = useState("");
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch cards for the selected collection
  useEffect(() => {
    if (!selectedCollectionId) return;
    setLoading(true);
    supabase
      .from("cards")
      .select("*")
      .eq("collection_id", selectedCollectionId)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        setCards(data || []);
        setLoading(false);
        if (error) console.error(error);
      });
  }, [selectedCollectionId]);

  const handleTradeOut = (card) => {
    // Pass the full card record (includes UUID, price, etc.)
    onSelectCard(card);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6">
        <h3 className="text-xl font-semibold text-white mb-4">
          Add from Collection
        </h3>

        {/* Collection selector */}
        <div className="mb-4">
          <label className="block text-sm text-gray-300 mb-1">
            Choose a collection
          </label>
          <select
            value={selectedCollectionId}
            onChange={(e) => setSelectedCollectionId(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
          >
            <option value="">Select a collection</option>
            {collections.map((col) => (
              <option key={col.id} value={col.id}>
                {col.name}
              </option>
            ))}
          </select>
        </div>

        {/* Cards grid */}
        {loading ? (
          <p className="text-gray-400 text-center py-4">Loading cards…</p>
        ) : cards.length === 0 ? (
          <p className="text-gray-500 text-center py-4">
            {selectedCollectionId
              ? "No cards in this collection"
              : "Select a collection to see its cards"}
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {cards.map((card) => (
              <div
                key={card.id}
                className="bg-gray-800 rounded p-2 flex flex-col items-center"
              >
                {card.image_url && card.image_url.startsWith("https://") && (
                  <Image
                    src={card.image_url}
                    alt={card.name}
                    width={80}
                    height={112}
                    className="object-contain mb-2"
                  />
                )}
                <p className="text-white text-sm text-center truncate w-full">
                  {card.name}
                </p>
                <p className="text-gray-400 text-xs">{card.set_name}</p>
                <p className="text-green-400 text-xs mt-1">
                  Price: €{Number(card.price).toFixed(2)}
                </p>
                <button
                  onClick={() => handleTradeOut(card)}
                  className="mt-2 px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                >
                  Trade Out
                </button>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={onClose}
          className="mt-4 w-full py-2 bg-gray-700 text-gray-300 rounded hover:bg-gray-600"
        >
          Close
        </button>
      </div>
    </div>
  );
}
