// hooks/usePokemonAPI.js
import { useState, useCallback } from 'react';

export function usePokemonAPI() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [data, setData] = useState(null);

    const searchCards = useCallback(async (params = {}) => {
        setLoading(true);
        setError(null);

        try {
            // Build query string from params
            const queryParams = new URLSearchParams();
            
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    queryParams.set(key, value.toString());
                }
            });

            const response = await fetch(`/api/cards/search?${queryParams}`);
            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error || 'Search failed');
            }

            setData(result);
            return result;
        } catch (error) {
            setError(error.message);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const getCardById = useCallback(async (id) => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/cards/${id}`);
            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error || 'Failed to fetch card');
            }

            setData(result);
            return result;
        } catch (error) {
            setError(error.message);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const getSets = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/cards/sets');
            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error || 'Failed to fetch sets');
            }

            setData(result);
            return result;
        } catch (error) {
            setError(error.message);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        searchCards,
        getCardById,
        getSets,
        data,
        loading,
        error,
        clearError: () => setError(null),
        clearData: () => setData(null)
    };
}