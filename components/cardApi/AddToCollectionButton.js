// components/cardApi/AddToCollectionButton.js
"use client";

import { useState } from "react";
import { useCollections } from "../../hooks/v1/useCollections";
import { supabase } from "../../lib/supabase/api";

export default function AddToCollectionButton({ card, pricing }) {
  const { collections, createCollection } = useCollections();
  const [showModal, setShowModal] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState("");
  const [newCollectionName, setNewCollectionName] = useState("");
  const [adding, setAdding] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleAdd = async () => {
    setAdding(true);
    try {
      let collectionId = selectedCollection;

      if (newCollectionName) {
        const newColl = await createCollection(newCollectionName);
        collectionId = newColl.id;
      }

      if (collectionId) {
        const trendPrice = pricing?.trend || pricing?.avg30 || 0;
        const { error } = await supabase.from("cards").insert({
          collection_id: collectionId,
          card_id: card.id,
          name: card.name,
          type: card.types?.[0] || "Unknown",
          set_name: card.set?.name || "Unknown",
          price: trendPrice,
          image_url: card.images?.small || card.images?.large || null,
          quantity: 1,
        });

        if (error) throw error;
      }

      setSuccess(true);
      setTimeout(() => {
        setShowModal(false);
        setSuccess(false);
        setNewCollectionName("");
        setSelectedCollection("");
      }, 1500);
    } catch (error) {
      console.error("Failed to add card:", error);
    } finally {
      setAdding(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
      >
        + Add to Collection
      </button>

      {showModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-[60]"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-gray-900 rounded-lg max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              Add to Collection
            </h3>

            {success ? (
              <p className="text-green-400 text-center py-4">
                ✅ Added successfully!
              </p>
            ) : (
              <>
                {collections.length > 0 && (
                  <div className="mb-4">
                    <label className="block text-sm text-gray-400 mb-2">
                      Choose a collection
                    </label>
                    <select
                      value={selectedCollection}
                      onChange={(e) => setSelectedCollection(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                    >
                      <option value="">Select...</option>
                      {collections.map((coll) => (
                        <option key={coll.id} value={coll.id}>
                          {coll.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="mb-4">
                  <label className="block text-sm text-gray-400 mb-2">
                    Or create new
                  </label>
                  <input
                    type="text"
                    value={newCollectionName}
                    onChange={(e) => setNewCollectionName(e.target.value)}
                    placeholder="Collection name"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                  />
                </div>

                <button
                  onClick={handleAdd}
                  disabled={
                    adding || (!selectedCollection && !newCollectionName)
                  }
                  className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  {adding ? "Adding..." : "Add Card"}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
