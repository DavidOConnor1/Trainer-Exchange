// lib/pokemon-card-api.js - WITH RETRY LOGIC
class PokemonApi {
    constructor() {
        this.baseUrl = '/api/cards';
        this.retryDelays = [1000, 2000, 3000];
        this.maxRetries = 2;
    }

    async fetchWithRetry(url, options = {}, retryCount = 0) {
        try {
            const response = await fetch(url, {
                ...options,
                signal: AbortSignal.timeout(8000) // 8 second timeout
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            return response;
            
        } catch (error) {
            if (retryCount < this.maxRetries) {
                const delay = this.retryDelays[retryCount] || 1000;
                console.log(`Retrying in ${delay}ms (attempt ${retryCount + 1}/${this.maxRetries + 1})`);
                
                await new Promise(resolve => setTimeout(resolve, delay));
                return this.fetchWithRetry(url, options, retryCount + 1);
            }
            
            throw error;
        }
    }

    async getCards(params = {}) {
        try {
            const queryParams = new URLSearchParams();
            
            // Only pass essential parameters
            if (params.name) {
                queryParams.set('name', params.name);
                if (params.exact) queryParams.set('exact', 'true');
            } else if (params.q) {
                queryParams.set('q', params.q);
            } else {
                // Default to get some cards
                queryParams.set('q', 'name:*');
            }
            
            // Always small page size
            queryParams.set('pageSize', '3');
            queryParams.set('page', params.page || '1');
            
            const url = `${this.baseUrl}?${queryParams.toString()}`;
            console.log('🔍 Fetching:', url);
            
            const response = await this.fetchWithRetry(url);
            const data = await response.json();
            
            return data;
            
        } catch (error) {
            console.error('Get cards failed:', error);
            return {
                success: false,
                error: error.name === 'TimeoutError' ? 'Request timed out' : 'Failed to fetch cards',
                data: [],
                circuitState: 'error'
            };
        }
    }

    async searchByName(name) {
        return this.getCards({ name });
    }

    async searchExact(name) {
        return this.getCards({ name, exact: true });
    }

    // Quick test method
    async testConnection() {
        try {
            const response = await fetch('/api/test');
            return await response.json();
        } catch (error) {
            return {
                success: false,
                error: 'Test endpoint not available',
                details: error.message
            };
        }
    }
}

export const pokemonApi = new PokemonApi();