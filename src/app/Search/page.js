// src/app/Search/page.js - USING SDK DIRECTLY
'use client';

import { useState, useEffect } from "react";
const TCGdex = require('@tcgdex/sdk').default
import CardGrid from "../../../components/cardApi/CardGrid";

export default function SearchPage() {
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

 const tcgdex = new TCGdex('en');

 // Use in an async context
(async () => {
  // Retrieve Furret from the Darkness Ablaze Set
  const card = await tcgdex.card.get('swsh3-136');
  console.log(card.name, card.pricing.cardmarket.trend, card.localId); // "Furret"
})();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">
        Pokémon Card Search 
        
      </h1>
      
      {/* Search Input */}
      <div className="max-w-2xl mx-auto mb-8">
        <div className="flex gap-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch(searchQuery)}
            placeholder="Search Pokémon by name..."
            className="flex-grow px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <button
            onClick={() => handleSearch(searchQuery)}
            disabled={isLoading || !searchQuery.trim()}
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>
      
      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      )}
      
      {/* Results */}
      <CardGrid 
        cards={searchResults} 
        isLoading={isLoading}
        emptyMessage={searchQuery ? `No Pokémon found for "${searchQuery}"` : 'Enter a search term'}
      />
    </div>
  );
}