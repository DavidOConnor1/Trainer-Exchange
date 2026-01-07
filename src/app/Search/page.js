// src/app/Search/page.js
'use client';

import { useState, useEffect, useCallback } from "react";
import { pokemonApi } from "../lib/pokemon-card-api";
import CardGrid from "../../../components/CardGrid";
import AdvancedSearchPanel from "../../../components/AdvancedSearchPanel";
import Link from "next/link";

export default function SearchPage() {
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [exactMatch, setExactMatch] = useState(false);
  const [metaData, setMetaData] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const health = await pokemonApi.checkHealth();
        console.log('API Health:', health);
        
        // Load some popular cards on initial load
        const popularCards = await pokemonApi.searchCards('pikachu', { pageSize: 12 });
        if (popularCards.success) {
          setSearchResults(popularCards.data);
          setMetaData(popularCards.meta);
          setSearchQuery('pikachu');
        }
      } catch(err) {
        console.error('API connection issue:', err);
      }
    };
    
    loadInitialData();
  }, []);

  // In your SearchPage component
const handleSearch = async (query) => {
    if (!query.trim()) {
        setError('Please enter a search term');
        return;
    }

    setSearchQuery(query);
    setIsLoading(true);
    setError('');

    try {
        // Use the simple API
        const response = await pokemonApi.searchByName(query, { pageSize: 20 });

        if (response.success) {
            setSearchResults(response.data || []);
            setMetaData(response.meta || {});
        } else {
            setError(response.error || 'Search failed');
            setSearchResults([]);
            setMetaData(null);
        }
    } catch(err) {
        setError('Failed to connect to API. Please try again later');
        console.error('Search error:', err);
        setSearchResults([]);
        setMetaData(null);
    } finally {
        setIsLoading(false);
    }
};

const handleExactSearch = async (query) => {
    if (!query.trim()) {
        setError('Please enter a search term');
        return;
    }

    setSearchQuery(query);
    setIsLoading(true);
    setError('');

    try {
        const response = await pokemonApi.searchExact(query, { pageSize: 20 });

        if (response.success) {
            setSearchResults(response.data || []);
            setMetaData(response.meta || {});
            
            // If no results, try wildcard search
            if (response.data.length === 0) {
                console.log('Exact search returned 0 results, trying wildcard');
                return handleSearch(query);
            }
        } else {
            setError(response.error || 'Exact search failed');
            setSearchResults([]);
            setMetaData(null);
        }
    } catch(err) {
        setError('Failed to connect to API. Please try again later');
        console.error('Exact search error:', err);
        setSearchResults([]);
        setMetaData(null);
    } finally {
        setIsLoading(false);
    }
};

  // Advanced search handler
  const handleAdvancedSearch = async (criteria) => {
    setIsLoading(true);
    setError('');
    setShowAdvanced(false);

    try {
      const response = await pokemonApi.advancedSearch(criteria);
      
      if (response.success) {
        setSearchResults(response.data || []);
        setMetaData(response.meta || {});
        setSearchQuery(criteria.name || Object.values(criteria).filter(v => v).join(', ') || 'Advanced Search');
      } else {
        setError(response.error || 'Advanced search failed');
        setSearchResults([]);
        setMetaData(null);
      }
    } catch(err) {
      setError('Advanced search failed. Please try again.');
      console.error('Advanced search error:', err);
      setSearchResults([]);
      setMetaData(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Pagination handler
  const handlePageChange = async (page) => {
    if (!metaData || page === metaData.page || isLoading) return;
    
    setIsLoading(true);
    try {
      const response = await pokemonApi.searchCards(searchQuery, {
        page: page,
        pageSize: metaData.pageSize || 20,
        exact: exactMatch
      });

      if (response.success) {
        setSearchResults(response.data || []);
        setMetaData(response.meta || {});
      }
    } catch (err) {
      setError('Failed to load more results');
      console.error('Pagination error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Quick search examples
  const quickSearches = ['Pikachu', 'Charizard', 'Mewtwo', 'Eevee', 'Gengar', 'Lucario'];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Pokémon Card Search</h1>
              <p className="text-gray-600 mt-1">Search thousands of Pokémon TCG cards</p>
            </div>
            <Link 
              href="/" 
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              ← Back Home
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Main Search */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="mb-4">
            <label className="block text-lg font-medium text-gray-700 mb-2">
              Search Pokémon Cards
            </label>
            <div className="flex gap-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch(searchQuery, exactMatch)}
                placeholder="Enter Pokémon name (e.g., Pikachu, Charizard...)"
                className="flex-grow px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
              <button
                onClick={() => handleSearch(searchQuery, exactMatch)}
                disabled={isLoading || !searchQuery.trim()}
                className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Searching...' : 'Search'}
              </button>
            </div>
            
            <div className="flex items-center justify-between mt-3">
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked={exactMatch}
                  onChange={(e) => setExactMatch(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-600">Exact match only</span>
              </label>
              
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                {showAdvanced ? 'Hide Advanced' : 'Show Advanced Search'}
              </button>
            </div>
          </div>

          {/* Quick Search Buttons */}
          <div className="mt-4">
            <p className="text-sm text-gray-600 mb-2">Try these popular searches:</p>
            <div className="flex flex-wrap gap-2">
              {quickSearches.map((pokemon) => (
                <button
                  key={pokemon}
                  onClick={() => handleSearch(pokemon)}
                  disabled={isLoading}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  {pokemon}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Advanced Search Panel */}
        {showAdvanced && (
          <div className="mb-8">
            <AdvancedSearchPanel 
              onSearch={handleAdvancedSearch}
              isLoading={isLoading}
            />
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Results Header */}
        {searchQuery && (
          <div className="mb-6 bg-white rounded-lg p-4 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Results for "{searchQuery}"
                </h2>
                {metaData && (
                  <p className="text-gray-600 mt-1">
                    {metaData.totalCount 
                      ? `Showing ${searchResults.length} of ${metaData.totalCount} cards`
                      : `${searchResults.length} card${searchResults.length !== 1 ? 's' : ''} found`
                    }
                  </p>
                )}
              </div>
              
              {searchResults.length > 0 && metaData?.totalPages > 1 && (
                <div className="flex items-center gap-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handlePageChange((metaData.page || 1) - 1)}
                      disabled={!metaData || metaData.page <= 1 || isLoading}
                      className="px-4 py-2 text-sm bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      ← Previous
                    </button>
                    <span className="px-4 py-2 text-sm text-gray-600">
                      Page {metaData.page || 1} of {metaData.totalPages}
                    </span>
                    <button
                      onClick={() => handlePageChange((metaData.page || 1) + 1)}
                      disabled={!metaData || metaData.page >= metaData.totalPages || isLoading}
                      className="px-4 py-2 text-sm bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next →
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600">Searching for Pokémon cards...</p>
          </div>
        )}

        {/* Results Grid */}
        {!isLoading && (
          <CardGrid 
            cards={searchResults} 
            isLoading={isLoading}
            emptyMessage={searchQuery ? `No Pokémon cards found for "${searchQuery}"` : 'Enter a Pokémon name to start searching'}
          />
        )}

        {/* Empty State */}
        {!isLoading && searchResults.length === 0 && !searchQuery && (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Start Your Search</h3>
            <p className="text-gray-600 mb-6">Enter a Pokémon name above or try one of the quick search examples</p>
            
            <div className="max-w-md mx-auto">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Search Tips:</h4>
              <ul className="text-sm text-gray-600 text-left space-y-2">
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  <span>Use wildcards: <code className="bg-gray-100 px-1 rounded">char*</code> finds Charizard, Charmander, etc.</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  <span>Try exact match for specific cards</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  <span>Use advanced search for filtering by type, set, or rarity</span>
                </li>
              </ul>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-12 pt-8 pb-6 border-t border-gray-200">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-500 text-sm">
            Pokémon and Pokémon character names are trademarks of Nintendo.
            Data provided by the Pokémon TCG API.
          </p>
        </div>
      </footer>
    </div>
  );
}