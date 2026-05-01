// components/AdvancedSearchPanel.js
"use client";

import { useState } from "react";
import { searchCards } from "../../lib/pokemonApi/client";

export default function AdvancedSearchPanel({ onSearch, isLoading }) {
  const [criteria, setCriteria] = useState({
    name: "",
    type: "",
    set: "",
    rarity: "",
    hp: "",
    exact: false,
  });

  const handleChange = (field, value) => {
    setCriteria((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const { search, loading, error } = useCardSearch();

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Remove empty fields
    const cleanCriteria = Object.fromEntries(
      Object.entries(criteria).filter(([_, v]) => v !== "" && v !== false),
    );
    const result = await search(cleanCriteria);
    if (onSearch && result) {
      onSearch(result);
    }
  };

  const handleReset = () => {
    setCriteria({
      name: "",
      type: "",
      set: "",
      rarity: "",
      hp: "",
      exact: false,
    });
  };

  return (
    <div className="p-6 border border-gray-300 rounded-lg bg-white shadow-sm">
      <h3 className="text-lg font-semibold mb-4">Advanced Search</h3>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Card Name
            </label>
            <input
              type="text"
              value={criteria.name}
              onChange={(e) => handleChange("name", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Charizard"
            />
            <div className="mt-2">
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked={criteria.exact}
                  onChange={(e) => handleChange("exact", e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-600">Exact match</span>
              </label>
            </div>
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              value={criteria.type}
              onChange={(e) => handleChange("type", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Any Type</option>
              <option value="Grass">Grass</option>
              <option value="Fire">Fire</option>
              <option value="Water">Water</option>
              <option value="Lightning">Lightning</option>
              <option value="Psychic">Psychic</option>
              <option value="Fighting">Fighting</option>
              <option value="Darkness">Darkness</option>
              <option value="Metal">Metal</option>
              <option value="Dragon">Dragon</option>
              <option value="Fairy">Fairy</option>
              <option value="Colorless">Colorless</option>
            </select>
          </div>

          {/* Set */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Set Name
            </label>
            <input
              type="text"
              value={criteria.set}
              onChange={(e) => handleChange("set", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Base Set, Vivid Voltage"
            />
          </div>

          {/* Rarity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rarity
            </label>
            <select
              value={criteria.rarity}
              onChange={(e) => handleChange("rarity", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Any Rarity</option>
              <option value="Common">Common</option>
              <option value="Uncommon">Uncommon</option>
              <option value="Rare">Rare</option>
              <option value="Rare Holo">Rare Holo</option>
              <option value="Rare Holo EX">Rare Holo EX</option>
              <option value="Rare Holo GX">Rare Holo GX</option>
              <option value="Rare Holo V">Rare Holo V</option>
              <option value="Rare Secret">Rare Secret</option>
            </select>
          </div>

          {/* HP */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              HP (Hit Points)
            </label>
            <input
              type="number"
              value={criteria.hp}
              onChange={(e) => handleChange("hp", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 100"
              min="0"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={
              isLoading || (!criteria.name && !criteria.type && !criteria.set)
            }
            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? "Searching..." : "Search"}
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors"
          >
            Clear All
          </button>
        </div>
      </form>

      {/* Search Tips */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Search Tips:</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>
            • Use * for wildcard searches (e.g., "char*" finds Charizard,
            Charmander, etc.)
          </li>
          <li>• Leave fields blank to search all cards</li>
          <li>• Combine multiple criteria for precise searches</li>
        </ul>
      </div>
    </div>
  );
}
