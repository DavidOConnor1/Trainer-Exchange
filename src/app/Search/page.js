'use client';//uses client server

import { useState, useEffect, use } from "react";
import SearchBar from "./SearchBar";
import { pokemonApi } from "../lib/pokemon-card-api";

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
        
      }//end if
    } catch(err){

    }
  }//end handle advanced search
}//end search page