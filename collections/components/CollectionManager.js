"use client";
import { useState } from "react";
import { useCollections } from "../../hooks/v1/useCollections";
import { useCards } from "../../hooks/v1/useCards";
import { useAuth } from "../../auth/hooks/useAuth";
import Image from "next/image";

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

// Collection View Modal with Cards
function CollectionView({ collection, onClose }) {
  const { cards, loading, totalValue, addCard, deleteCard } = useCards(
    collection.id,
  );
  const [showAddCard, setShowAddCard] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  // Search Pokemon cards (you'll integrate with Pokemon API)
  const searchCards = async () => {
    // This is where you'd call your Pokemon API
    // For now, just a placeholder
    setSearchResults([
      {
        id: "1",
        name: "Pikachu",
        type: "Electric",
        set_name: "Base Set",
        price: 10.99,
        image_url: "/placeholder.png",
      },
    ]);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-700 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-white">{collection.name}</h2>
            <p className="text-gray-400 mt-1">
              Total Value:{" "}
              <span className="text-green-400 font-semibold">
                ${totalValue.toFixed(2)}
              </span>
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            ✕
          </button>
        </div>

        <div className="p-6">
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setShowAddCard(!showAddCard)}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              + Add Card
            </button>
          </div>

          {/* Add Card Form */}
          {showAddCard && (
            <div className="mb-6 p-4 bg-gray-800 rounded-lg">
              <h3 className="text-lg font-semibold text-white mb-3">
                Search Cards
              </h3>
              <div className="flex gap-3 mb-4">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search for a Pokemon card..."
                  className="flex-1 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
                />
                <button
                  onClick={searchCards}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Search
                </button>
              </div>

              {/* Search Results */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {searchResults.map((card) => (
                  <div key={card.id} className="bg-gray-900 p-3 rounded-lg">
                    <h4 className="font-semibold text-white">{card.name}</h4>
                    <p className="text-gray-400 text-sm">{card.set_name}</p>
                    <p className="text-green-400 font-semibold mt-2">
                      ${card.price}
                    </p>
                    <button
                      onClick={() => addCard(card)}
                      className="mt-2 w-full px-2 py-1 bg-blue-600 text-white rounded text-sm"
                    >
                      Add to Collection
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cards List */}
          {loading ? (
            <div className="text-center text-gray-400 py-8">
              Loading cards...
            </div>
          ) : cards.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              No cards in this collection yet. Add your first Pokemon card!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {cards.map((card) => (
                <div key={card.id} className="bg-gray-800 rounded-lg p-4">
                  {card.image_url && (
                    <Image
                      src={card.image_url}
                      alt={card.name}
                      width={200} //set width
                      height={128} //set height
                      className="w-full h-32 object-contain mb-3"
                      unoptimized={!card.image_url?.startsWith("/")} // For external URLs
                    />
                  )}
                  <h4 className="font-semibold text-white">{card.name}</h4>
                  <p className="text-gray-400 text-sm">Type: {card.type}</p>
                  <p className="text-gray-400 text-sm">Set: {card.set_name}</p>
                  <p className="text-gray-400 text-sm">
                    Quantity: {card.quantity}
                  </p>
                  <p className="text-green-400 font-semibold mt-2">
                    ${(card.price * card.quantity).toFixed(2)}
                  </p>
                  <button
                    onClick={() => deleteCard(card.id)}
                    className="mt-3 w-full px-2 py-1 bg-red-600 text-white rounded text-sm"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} //end of collection manager
