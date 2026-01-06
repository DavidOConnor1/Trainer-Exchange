'use client';//uses client server

import { useState, useEffect, use } from "react";
import SearchBar from "./SearchBar";
import { pokemonApi } from "../../lib/pokemon-card-api";
import CardGrid from "./CardGrid";

export default function SearchPage() {
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  //load intial data or recent searches
  useEffect(() => {
    const loadIntialData = async () => {
      try{
        const health = await pokemonApi.checkHealth();
        console.log('API Health: ',health);
      } catch(err){
        console.error('API connection issue:', err);
      }//close catch
    };//close load
    loadIntialData();
  }, []);

  const handleSearch = async(query) => {
    if(!query.trim()) return;

    setSearchQuery(query);
    setIsLoading(true);
    setError('');

    try{
      const response = await pokemonApi.searchCards(query);

      if(response.success){
        setSearchResults(response.data || []);
      } else {
        setError(response.error || 'search failed');
      }//end else

    } catch(err){
      setError('Failed to connect to API. Please try again later');
      console.error('search error: ',err);
    } finally {
      setIsLoading(false);
    }//end finally
  }; //end handle search

  const handleAdvancedSearch = async (criteria) => {
    setIsLoading(true);
    try{
      const response = await pokemonApi.advancedSearch(criteria);
      if(response.success){
        setSearchResults(response.data || []);
      }//end if
    } catch(err){
      setError('Advanced Search failed');
    } finally {
      setIsLoading(false);
    }//end finally
  };//end handle advanced search

  return(
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-2">
        Pokemon Card Search
      </h1>
    <div className="mb-8">
      <SearchBar onSearch={handleSearch} intialQuery={searchQuery} />
    </div>
    {error && (
      <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600">{error}</p>
      </div>
    )}

    <div className="mb-6 flex justify-between items-center">
      <h2 className="text-xl font-semibold">
        {searchQuery ? `Results for "${searchQuery}"` : 'search results'}
      </h2>
      {searchResults.length > 0 && (
        <span className="text-gray-600">
          card {searchResults.length !== 1 ? 's' : ''} found
        </span>
      )} 
    </div>

      <CardGrid cards={searchResults} isLoading={isLoading} />

      <div className="mt-12 p-6 border rounded-lg bg-gray-50">
        <h3 className="text-lg font-semibold mb-4">Advanced Search</h3>
        <p className="text-gray-600 mb-4">
          use multiple search parameters like <code className="bg-gray-200 px-2 py-1 rounded">
            ?type=fire&amp; set=base
          </code>
        </p>
        <button
        onClick={() => handleAdvancedSearch({type: 'fire', pageSize: 10})}
        className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition-colors">
          Example: show fire type cards
        </button>
      </div>
    </div>
  );
}//end search page