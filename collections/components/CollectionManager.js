// collections/components/CollectionManager.js
"use client";
import { useState, useCallback, useRef, useEffect } from "react";
import { useCollections } from "../../hooks/v1/useCollections";
import { useCards } from "../../hooks/v1/useCards";
import { useAuth } from "../../auth/hooks/useAuth";
import { pokemonApi } from "../../lib/pokemonApi/client";
import Image from "next/image";
import CardImage from "../../components/cardApi/cardImage";

export default function CollectionManager() {
  const { user } = useAuth();
  const {
    collections,
    loading: collectionsLoading,
    createCollection,
    deleteCollection,
  } = useCollections();

  const [selectedCollection, setSelectedCollection] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [newCollectionDesc, setNewCollectionDesc] = useState("");

  if (!user) {
    return (
      <div className="text-center p-8">
        Please sign in to view your collections
      </div>
    );
  }

  const handleCreateCollection = async (e) => {
    e.preventDefault();
    try {
      await createCollection(newCollectionName, newCollectionDesc);
      setNewCollectionName("");
      setNewCollectionDesc("");
      setShowCreateForm(false);
    } catch (error) {
      console.error("Failed to create collection:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">
            My Pokemon Collections
          </h1>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            + New Collection
          </button>
        </div>

        {/* Create Collection Form */}
        {showCreateForm && (
          <div className="mb-8 p-6 bg-gray-800 rounded-lg border border-gray-700">
            <h2 className="text-xl font-semibold text-white mb-4">
              Create New Collection
            </h2>
            <form onSubmit={handleCreateCollection} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Collection Name *
                </label>
                <input
                  type="text"
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description (optional)
                </label>
                <textarea
                  value={newCollectionDesc}
                  onChange={(e) => setNewCollectionDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
                  rows="3"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Collections Grid */}
        {collectionsLoading ? (
          <div className="text-center text-gray-400">
            Loading collections...
          </div>
        ) : collections.length === 0 ? (
          <div className="text-center text-gray-400 py-12">
            No collections yet. Create your first one!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {collections.map((collection) => (
              <CollectionCard
                key={collection.id}
                collection={collection}
                onSelect={() => setSelectedCollection(collection)}
                onDelete={() => deleteCollection(collection.id)}
              />
            ))}
          </div>
        )}

        {/* Cards View Modal */}
        {selectedCollection && (
          <CollectionView
            collection={selectedCollection}
            onClose={() => setSelectedCollection(null)}
          />
        )}
      </div>
    </div>
  );
}

// Collection Card Component
function CollectionCard({ collection, onSelect, onDelete }) {
  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden hover:border-blue-500 transition">
      <div className="p-6">
        <h3 className="text-xl font-semibold text-white mb-2">
          {collection.name}
        </h3>
        {collection.description && (
          <p className="text-gray-400 text-sm mb-4">{collection.description}</p>
        )}
        <p className="text-gray-500 text-xs mb-4">
          Created: {new Date(collection.created_at).toLocaleDateString()}
        </p>
        <div className="flex gap-3">
          <button
            onClick={onSelect}
            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          >
            View Cards
          </button>
          <button
            onClick={onDelete}
            className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// Collection View Modal with proper image handling
function CollectionView({ collection, onClose }) {
  const { cards, loading, totalValue, addCard, deleteCard } = useCards(
    collection.id,
  );
  const [showAddCard, setShowAddCard] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchingCards, setSearchingCards] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [apiStatus, setApiStatus] = useState({
    checked: false,
    working: false,
    message: "",
  });
  const [searchMode, setSearchMode] = useState("name");

  const debounceRef = useRef(null);

  // Helper function to validate image URLs
  const isValidImageUrl = (url) => {
    if (!url || typeof url !== "string") return false;
    if (url === "undefined" || url === "null") return false;
    if (url.includes("undefined") || url.includes("null")) return false;

    try {
      new URL(url);
      return url.startsWith("http://") || url.startsWith("https://");
    } catch {
      return false;
    }
  };

  // Helper to get a fallback or placeholder
  const getCardImage = (card) => {
    // Check all possible image sources
    const imageUrl =
      card.image_url ||
      card.images?.small ||
      card.images?.large ||
      card._original?.images?.small ||
      card._original?.images?.large;

    if (isValidImageUrl(imageUrl)) {
      return imageUrl;
    }

    // Return null for no image - we'll show a placeholder
    return null;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-700 flex justify-between items-center sticky top-0 bg-gray-900 z-10">
          <div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-sm mb-1 flex items-center gap-1"
            >
              <span className="text-lg">←</span> Back to Collections
            </button>
            <h2 className="text-2xl font-bold text-white">{collection.name}</h2>
            <p className="text-gray-400 mt-1">
              Total Value:{" "}
              <span className="text-green-400 font-semibold">
                €{totalValue.toFixed(2)}
              </span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xl md:hidden"
          >
            ✕
          </button>
        </div>

        <div className="p-6">
          {/* Search Results */}
          {!searchingCards && searchResults.length > 0 && (
            <div>
              <p className="text-sm text-gray-400 mb-3">
                Found {searchResults.length} card
                {searchResults.length !== 1 ? "s" : ""}
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {searchResults.map((card) => {
                  const imageUrl = getCardImage(card);

                  return (
                    <div
                      key={card.id || Math.random()}
                      className="bg-gray-900 p-3 rounded-lg border border-gray-700 hover:border-blue-500 transition"
                    >
                      {/* Card Image */}
                      <div className="relative w-full h-32 mb-2 bg-gray-800 rounded flex items-center justify-center">
                        {imageUrl ? (
                          <Image
                            src={imageUrl}
                            alt={card.name || "Pokemon card"}
                            fill
                            className="object-contain rounded"
                            sizes="(max-width: 768px) 50vw, 25vw"
                            onError={(e) => {
                              // Hide broken image, show placeholder
                              e.target.style.display = "none";
                              e.target.parentElement.innerHTML = `
                                <div class="flex items-center justify-center h-full">
                                  <span class="text-gray-500 text-4xl">🃏</span>
                                </div>
                              `;
                            }}
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center text-gray-500">
                            <span className="text-4xl mb-1">🃏</span>
                            <span className="text-xs">No image</span>
                          </div>
                        )}
                      </div>

                      {/* Card Info */}
                      <h4
                        className="font-semibold text-white text-sm truncate"
                        title={card.name}
                      >
                        {card.name || "Unknown Card"}
                      </h4>
                      <p
                        className="text-gray-400 text-xs truncate"
                        title={card.set_name}
                      >
                        {card.set_name || "Unknown Set"}
                      </p>
                      <p className="text-gray-400 text-xs">
                        {card.rarity || "Common"}{" "}
                        {card.type && `• ${card.type}`}
                      </p>
                      {card.id && (
                        <p className="text-gray-500 text-xs font-mono truncate">
                          ID: {card.id}
                        </p>
                      )}

                      {/* Price */}
                      {card.price > 0 && (
                        <p className="text-green-400 font-semibold mt-2 text-sm">
                          €{Number(card.price).toFixed(2)}
                        </p>
                      )}

                      {/* Add Button */}
                      <button
                        onClick={() => handleAddCard(card)}
                        className="mt-2 w-full px-2 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition"
                      >
                        Add to Collection
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Existing Cards in Collection */}
          {loading ? (
            <div className="text-center text-gray-400 py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-2"></div>
              <p>Loading collection cards...</p>
            </div>
          ) : cards.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              <p>No cards in this collection yet.</p>
              <p className="text-sm mt-2">
                Click "+ Add Cards" to search and add Pokemon cards!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {cards.map((card) => {
                const imageUrl = getCardImage(card);

                return (
                  <div
                    key={card.id}
                    className="bg-gray-800 rounded-lg p-4 border border-gray-700"
                  >
                    {/* Card Image */}
                    <div className="relative w-full h-32 mb-3 bg-gray-700 rounded flex items-center justify-center">
                      {imageUrl ? (
                        <Image
                          src={imageUrl}
                          alt={card.name || "Pokemon card"}
                          fill
                          className="object-contain rounded"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          onError={(e) => {
                            e.target.style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-gray-500">
                          <span className="text-4xl mb-1">🃏</span>
                          <span className="text-xs">No image available</span>
                        </div>
                      )}
                    </div>

                    <h4
                      className="font-semibold text-white truncate"
                      title={card.name}
                    >
                      {card.name || "Unknown Card"}
                    </h4>
                    <p
                      className="text-gray-400 text-sm truncate"
                      title={card.set_name}
                    >
                      Set: {card.set_name || "Unknown"}
                    </p>
                    {card.type && (
                      <p className="text-gray-400 text-sm">Type: {card.type}</p>
                    )}
                    {card.rarity && (
                      <p className="text-gray-400 text-sm">
                        Rarity: {card.rarity}
                      </p>
                    )}
                    <p className="text-gray-400 text-sm">
                      Quantity: {card.quantity || 1}
                    </p>
                    {card.condition && (
                      <p className="text-gray-400 text-sm capitalize">
                        Condition: {card.condition.replace(/_/g, " ")}
                      </p>
                    )}
                    <p className="text-green-400 font-semibold mt-2">
                      €
                      {(
                        (Number(card.price) || 0) * (Number(card.quantity) || 1)
                      ).toFixed(2)}
                    </p>
                    {card.card_id && (
                      <p className="text-gray-500 text-xs font-mono truncate">
                        ID: {card.card_id}
                      </p>
                    )}
                    <button
                      onClick={() => {
                        if (
                          confirm("Delete this collection and all cards in it?")
                        ) {
                          onDelete();
                        }
                      }}
                      className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
