"use client";

import { useState, useCallback, useRef } from "react";
import {
  searchCards,
  extractCards,
  extractPagination,
} from "../../../../lib/pokemonApi/searchService";

export function useCardSearch() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
    hasMore: false,
  });
  const debounceRef = useRef(null);
  const lastCriteriaRef = useRef({});

  const search = useCallback((criteria = {}, options = {}) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    lastCriteriaRef.current = {
      ...criteria,
      pageSize: criteria.pageSize || 20,
    };

    return new Promise((resolve) => {
      debounceRef.current = setTimeout(async () => {
        try {
          setLoading(true);
          setError(null);
          const response = await searchCards(criteria);
          setCards(extractCards(response));
          setPagination(extractPagination(response));
          resolve(response);
        } catch (err) {
          setError(err.message);
          setCards([]);
          resolve(null);
        } finally {
          setLoading(false);
        }
      }, options.debounceMs || 300);
    });
  }, []);

  const loadMore = useCallback(async () => {
    if (loading || !pagination.hasMore) return;
    try {
      setLoading(true);
      const response = await searchCards({
        ...lastCriteriaRef.current,
        page: pagination.page + 1,
      });
      setCards((prev) => [...prev, ...extractCards(response)]);
      setPagination(extractPagination(response));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [loading, pagination]);

  return {
    cards,
    loading,
    error,
    pagination,
    search,
    loadMore,
    hasMore: pagination.hasMore,
  };
}
