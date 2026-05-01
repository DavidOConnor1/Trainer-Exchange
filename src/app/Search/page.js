// src/app/Search/page.js
"use client";

import { useState, useCallback } from "react";
import { useCardSearch } from "../../../hooks/v2/useCardSearch";
import {
  getCardImage,
  formatPrice,
} from "../../../lib/pokemonApi/searchService";
import Image from "next/image";

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [filters, setFilters] = useState({
    type: "",
    set: "",
    rarity: "",
    minHp: "",
    maxHp: "",
    exactName: false,
  });

  const {
    cards: searchResults,
    loading: isLoading,
    error,
    pagination,
    search,
    loadMore,
    hasMore,
  } = useCardSearch();

  // Handle basic search
  const handleSearch = useCallback(
    (query) => {
      if (!query || !query.trim()) return;

      const criteria = { name: query.trim(), pageSize: 20 };

      // Add any active filters
      if (filters.type) criteria.types = [filters.type];
      if (filters.set) criteria.set = filters.set;
      if (filters.rarity) criteria.rarity = filters.rarity;
      if (filters.minHp) criteria.minHp = parseInt(filters.minHp);
      if (filters.maxHp) criteria.maxHp = parseInt(filters.maxHp);
      if (filters.exactName) criteria.exactName = true;

      search(criteria);
    },
    [filters, search],
  );

  // Handle filter change
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  // Apply filters to current search
  const applyFilters = () => {
    if (searchQuery.trim()) {
      handleSearch(searchQuery);
    }
    setAdvancedOpen(false);
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      type: "",
      set: "",
      rarity: "",
      minHp: "",
      maxHp: "",
      exactName: false,
    });
  };

  // Card types for filter dropdown
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

  // Rarity options
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

        {/* Search Input */}
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
              disabled={isLoading || !searchQuery.trim()}
              className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? "Searching..." : "Search"}
            </button>
          </div>
        </div>

        {/* Advanced Filters Toggle */}
        <div className="max-w-2xl mx-auto mb-6">
          <button
            onClick={() => setAdvancedOpen(!advancedOpen)}
            className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            {advancedOpen ? "− Hide Filters" : "+ Advanced Filters"}
          </button>
        </div>

        {/* Advanced Filters Panel */}
        {advancedOpen && (
          <div className="max-w-2xl mx-auto mb-6 p-6 bg-gray-800 rounded-lg border border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Type Filter */}
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

              {/* Rarity Filter */}
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

              {/* Set Filter */}
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

              {/* Exact Name Toggle */}
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

              {/* HP Range */}
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

            {/* Filter Actions */}
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

        {/* Error Display */}
        {error && (
          <div className="max-w-2xl mx-auto mb-6 p-4 bg-red-900/50 border border-red-700 rounded-lg">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {isLoading && searchResults.length === 0 && (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        )}

        {/* Results */}
        {!isLoading && searchResults.length > 0 && (
          <>
            {/* Results Summary */}
            <div className="max-w-2xl mx-auto mb-4">
              <p className="text-sm text-gray-400">
                Showing {searchResults.length} of {pagination.total} results
                {pagination.total > 20 && ` (Page ${pagination.page})`}
              </p>
            </div>

            {/* Card Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 max-w-7xl mx-auto">
              {searchResults.map((card) => (
                <div
                  key={card.id}
                  className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden hover:border-blue-500 hover:shadow-lg transition-all"
                >
                  {/* Card Image */}
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

                  {/* Card Info */}
                  <div className="p-4">
                    <h3
                      className="font-semibold text-white text-sm truncate"
                      title={card.name}
                    >
                      {card.name}
                    </h3>

                    {/* Set & Number */}
                    <p className="text-gray-400 text-xs truncate mt-1">
                      {card.set?.name || "Unknown Set"}
                      {card.localId && ` • #${card.localId}`}
                    </p>

                    {/* Types */}
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

                    {/* Rarity & HP */}
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

                    {/* Pricing */}
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

                    {/* Card ID */}
                    <p
                      className="text-gray-600 text-xs font-mono mt-2 truncate"
                      title={card.id}
                    >
                      {card.id}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Load More Button */}
            {hasMore && (
              <div className="flex justify-center mt-8 mb-12">
                <button
                  onClick={loadMore}
                  disabled={isLoading}
                  className="px-8 py-3 bg-gray-800 text-white font-medium rounded-lg hover:bg-gray-700 border border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading
                    ? "Loading..."
                    : `Load More (${pagination.total - searchResults.length} remaining)`}
                </button>
              </div>
            )}
          </>
        )}

        {/* Empty State */}
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

        {/* Initial State */}
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
