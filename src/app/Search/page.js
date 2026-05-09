// src/app/Search/page.js
"use client";

import CardDetail from "@/features/search/components/cardDetail";

import { useState, useCallback, useRef, useEffect } from "react";
import { useCardSearch } from "@/features/search/hooks/useCardSearch";
import {
  getCardImage,
  formatPrice,
} from "../../../lib/pokemonApi/searchService";
import Image from "next/image";

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [filters, setFilters] = useState({
    type: "",
    set: "",
    setName: "",
    rarity: "",
    minHp: "",
    maxHp: "",
    exactName: false,
    localId: "",
  });

  const {
    cards: searchResults,
    loading: isLoading,
    error,
    pagination,
    search,
  } = useCardSearch();

  const currentFiltersRef = useRef({ name: "", pageSize: 20 });

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSearch = useCallback(
    (query) => {
      const criteria = { pageSize: 20 };

      if (query && query.trim()) {
        // Capitalize first letter
        const formatted = query.trim();
        criteria.name =
          formatted.charAt(0).toUpperCase() + formatted.slice(1).toLowerCase();
      }

      if (filters.localId) {
        const num = parseInt(filters.localId);
        if (!isNaN(num)) {
          criteria.localId = num.toString().padStart(3, "0");
        } else {
          criteria.localId = filters.localId;
        }
      }

      if (filters.type) criteria.types = [filters.type];
      if (filters.set) criteria.set = filters.set;
      if (filters.setName) criteria.set = filters.setName;
      if (filters.rarity) criteria.rarity = filters.rarity;
      if (filters.minHp) criteria.minHp = parseInt(filters.minHp);
      if (filters.maxHp) criteria.maxHp = parseInt(filters.maxHp);
      if (filters.exactName) criteria.exactName = true;

      // Require at least one filter (name, set, type, etc.)
      const hasFilters =
        criteria.name ||
        criteria.set ||
        criteria.types ||
        criteria.rarity ||
        criteria.minHp ||
        criteria.maxHp;
      if (!hasFilters) return;

      currentFiltersRef.current = criteria;
      search(criteria);
    },
    [filters, search],
  );

  const applyFilters = () => {
    handleSearch(searchQuery);
    setAdvancedOpen(false);
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      type: "",
      set: "",
      setName: "",
      rarity: "",
      minHp: "",
      maxHp: "",
      localId: "",
      exactName: false,
    });
  };

  const pokemonTypes = [
    "Colorless",
    "Grass",
    "Fire",
    "Water",
    "Lightning",
    "Psychic",
    "Fighting",
    "Darkness",
    "Metal",
    "Dragon",
    "Fairy",
  ];

  const rarities = [
    "Common",
    "Uncommon",
    "Rare",
    "Rare Holo",
    "Rare Ultra",
    "Rare Secret",
    "Amazing Rare",
    "Radiant Rare",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center text-white mb-2">
          Pokémon Card Search
        </h1>
        <p className="text-center text-gray-400 mb-8">
          Search hundreds of Pokémon cards with real-time Cardmarket pricing
        </p>

        <div className="max-w-2xl mx-auto mb-4">
          <div className="flex gap-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch(searchQuery)}
              placeholder="Search Pokémon by name (e.g., Charizard, Pikachu)..."
              className="flex-grow px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            />
            <button
              onClick={() => handleSearch(searchQuery)}
              disabled={isLoading}
              className="..."
            >
              {isLoading ? "Searching..." : "Search"}
            </button>
          </div>
        </div>

        <div className="max-w-2xl mx-auto mb-6">
          <button
            onClick={() => setAdvancedOpen(!advancedOpen)}
            className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            {advancedOpen ? "− Hide Filters" : "+ Advanced Filters"}
          </button>
        </div>

        {advancedOpen && (
          <div className="max-w-2xl mx-auto mb-6 p-6 bg-gray-800 rounded-lg border border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Card Number
                </label>
                <input
                  type="text"
                  value={filters.localId}
                  onChange={(e) =>
                    handleFilterChange("localId", e.target.value)
                  }
                  placeholder="e.g., 025"
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Type
                </label>
                <select
                  value={filters.type}
                  onChange={(e) => handleFilterChange("type", e.target.value)}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Any Type</option>
                  {pokemonTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Rarity
                </label>
                <select
                  value={filters.rarity}
                  onChange={(e) => handleFilterChange("rarity", e.target.value)}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Any Rarity</option>
                  {rarities.map((rarity) => (
                    <option key={rarity} value={rarity}>
                      {rarity}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Set ID
                </label>
                <input
                  type="text"
                  value={filters.set}
                  onChange={(e) => handleFilterChange("set", e.target.value)}
                  placeholder="e.g., swsh3, base1"
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Set Name
                </label>
                <input
                  type="text"
                  value={filters.setName}
                  onChange={(e) =>
                    handleFilterChange("setName", e.target.value)
                  }
                  placeholder="e.g., 151, Mythical Island"
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.exactName}
                    onChange={(e) =>
                      handleFilterChange("exactName", e.target.checked)
                    }
                    className="w-4 h-4 rounded border-gray-600 bg-gray-900 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-300">
                    Exact name match
                  </span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Min HP
                </label>
                <input
                  type="number"
                  value={filters.minHp}
                  onChange={(e) => handleFilterChange("minHp", e.target.value)}
                  placeholder="0"
                  min="0"
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Max HP
                </label>
                <input
                  type="number"
                  value={filters.maxHp}
                  onChange={(e) => handleFilterChange("maxHp", e.target.value)}
                  placeholder="500"
                  min="0"
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-4 pt-4 border-t border-gray-700">
              <button
                onClick={applyFilters}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
              >
                Apply Filters
              </button>
              <button
                onClick={clearFilters}
                className="px-4 py-2 bg-gray-700 text-gray-300 text-sm rounded-lg hover:bg-gray-600 transition-colors"
              >
                Clear All
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="max-w-2xl mx-auto mb-6 p-4 bg-red-900/50 border border-red-700 rounded-lg">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {isLoading && searchResults.length === 0 && (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        )}

        {!isLoading && searchResults.length > 0 && (
          <>
            <div className="max-w-2xl mx-auto mb-4">
              <p className="text-sm text-gray-400">
                Showing {searchResults.length} of {pagination.total} results
                {pagination.total > pagination.pageSize &&
                  ` (Page ${pagination.page})`}
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 max-w-7xl mx-auto">
              {searchResults.map((card) => (
                <div
                  key={card.id}
                  onClick={() => setSelectedCard(card)}
                  className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden hover:border-blue-500 hover:shadow-lg transition-all cursor-pointer"
                >
                  <div className="relative w-full aspect-[2.5/3.5] bg-gray-900">
                    {getCardImage(card, "large") ? (
                      <Image
                        src={getCardImage(card, "large")}
                        alt={card.name}
                        fill
                        className="object-contain p-2"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-600">
                        <span className="text-4xl">🃏</span>
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <h3
                      className="font-semibold text-white text-sm truncate"
                      title={card.name}
                    >
                      {card.name}
                    </h3>

                    <p className="text-gray-400 text-xs truncate mt-1">
                      {card.set?.name || "Unknown Set"}
                      {card.localId && ` • #${card.localId}`}
                    </p>

                    {card.types && card.types.length > 0 && (
                      <div className="flex gap-1 mt-2">
                        {card.types.map((type) => (
                          <span
                            key={type}
                            className="px-2 py-0.5 bg-gray-700 text-gray-300 text-xs rounded-full"
                          >
                            {type}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex justify-between items-center mt-2">
                      {card.rarity && (
                        <span className="text-gray-500 text-xs">
                          {card.rarity}
                        </span>
                      )}
                      {card.hp && (
                        <span className="text-gray-400 text-xs font-semibold">
                          HP {card.hp}
                        </span>
                      )}
                    </div>

                    {card.pricing &&
                      (card.pricing.avg30 || card.pricing.trend) && (
                        <div className="mt-3 pt-3 border-t border-gray-700">
                          {card.pricing.avg30 && (
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-400">30-Day Avg</span>
                              <span className="text-green-400 font-semibold">
                                €{formatPrice(card.pricing.avg30)}
                              </span>
                            </div>
                          )}
                          {card.pricing.trend && (
                            <div className="flex justify-between text-xs mt-1">
                              <span className="text-gray-400">Trend</span>
                              <span className="text-blue-400 font-semibold">
                                €{formatPrice(card.pricing.trend)}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                    <p
                      className="text-gray-600 text-xs font-mono mt-2 truncate"
                      title={card.id}
                    >
                      {card.id}
                    </p>
                  </div>
                </div>
              ))}
              {selectedCard && (
                <CardDetail
                  card={selectedCard}
                  onClose={() => setSelectedCard(null)}
                />
              )}
            </div>

            {pagination.total > pagination.pageSize && (
              <div className="flex justify-center items-center gap-4 mt-8 mb-12">
                <button
                  onClick={() =>
                    search(
                      {
                        ...currentFiltersRef.current,
                        page: pagination.page - 1,
                      },
                      { debounceMs: 0 },
                    )
                  }
                  disabled={pagination.page <= 1 || isLoading}
                  className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  ← Previous
                </button>

                <span className="text-gray-400">
                  Page {pagination.page} of{" "}
                  {Math.ceil(pagination.total / pagination.pageSize)}
                </span>

                <button
                  onClick={() =>
                    search(
                      {
                        ...currentFiltersRef.current,
                        page: pagination.page + 1,
                      },
                      { debounceMs: 0 },
                    )
                  }
                  disabled={!pagination.hasMore || isLoading}
                  className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}

        {!isLoading && searchQuery && searchResults.length === 0 && !error && (
          <div className="text-center py-12">
            <span className="text-6xl">🔍</span>
            <h3 className="text-xl font-semibold text-white mt-4">
              No cards found
            </h3>
            <p className="text-gray-400 mt-2">
              No Pokémon found for "{searchQuery}"
            </p>
            <p className="text-gray-500 text-sm mt-1">
              Try a different search term or adjust your filters
            </p>
          </div>
        )}

        {!isLoading && !searchQuery && searchResults.length === 0 && !error && (
          <div className="text-center py-12">
            <span className="text-6xl">⚡</span>
            <h3 className="text-xl font-semibold text-white mt-4">
              Start Searching
            </h3>
            <p className="text-gray-400 mt-2">
              Enter a Pokémon name to find cards, prices, and more
            </p>
            <div className="mt-4 flex justify-center gap-3">
              {["Charizard", "Pikachu", "Mewtwo", "Gengar"].map(
                (suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => {
                      setSearchQuery(suggestion);
                      handleSearch(suggestion);
                    }}
                    className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 text-sm transition-colors"
                  >
                    {suggestion}
                  </button>
                ),
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
