// lib/pokemon-card-api.js - WITH POLLING
class PokemonApi {
    constructor() {
        this.baseUrl = '/api/cards';
        this.pendingRequests = new Map();
    }

    async searchCards(query, options = {}) {
        // For very slow API, use polling
        if (options.usePolling) {
            return this.searchWithPolling(query, options);
        }
        
        // Regular request (with longer timeout)
        return this.searchDirect(query, options);
    }

    async searchDirect(query, options = {}) {
        try {
            const params = new URLSearchParams();
            
            if (typeof query === 'string') {
                params.set('name', query);
            } else if (query?.name) {
                params.set('name', query.name);
            } else if (query?.q) {
                params.set('q', query.q);
            }
            
            params.set('pageSize', options.pageSize || '3');
            if (options.page) params.set('page', options.page);
            
            const url = `${this.baseUrl}?${params.toString()}`;
            console.log('🔍 Searching (direct):', url);
            
            // LONG timeout
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 90000);
            
            const response = await fetch(url, {
                signal: controller.signal
            });
            
            clearTimeout(timeout);
            
            if (!response.ok) {
                throw new Error(`API error ${response.status}`);
            }
            
            return await response.json();
            
        } catch (error) {
            console.error('Direct search error:', error);
            
            // If timeout, suggest polling
            if (error.name === 'AbortError') {
                return {
                    success: false,
                    error: 'Request timed out (90s). The API is very slow.',
                    suggestion: 'Try polling method or simpler query',
                    data: []
                };
            }
            
            return {
                success: false,
                error: error.message,
                data: []
            };
        }
    }

    async searchWithPolling(query, options = {}) {
        // Use async endpoint if available
        try {
            const params = new URLSearchParams();
            
            if (typeof query === 'string') {
                params.set('name', query);
            } else if (query?.name) {
                params.set('name', query.name);
            }
            
            const startUrl = `/api/cards/async?${params.toString()}`;
            const startResponse = await fetch(startUrl);
            const startData = await startResponse.json();
            
            if (!startData.success || !startData.jobId) {
                throw new Error('Failed to start async job');
            }
            
            const jobId = startData.jobId;
            console.log(`🔄 Started polling job: ${jobId}`);
            
            // Poll for results
            return await this.pollJobResult(jobId, options.pollInterval || 5000);
            
        } catch (error) {
            console.error('Polling setup error:', error);
            
            // Fall back to direct with warning
            console.log('⚠️ Falling back to direct search');
            const result = await this.searchDirect(query, options);
            
            if (!result.success) {
                result.note = 'Polling failed, direct search also failed';
            }
            
            return result;
        }
    }

    async pollJobResult(jobId, interval = 5000, maxAttempts = 36) { // 36 * 5s = 3 minutes
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                console.log(`⏳ Polling job ${jobId} (attempt ${attempt}/${maxAttempts})`);
                
                const response = await fetch(`/api/cards/async?jobId=${jobId}`);
                const data = await response.json();
                
                if (data.status === 'completed') {
                    console.log(`✅ Job ${jobId} completed after ${attempt} polls`);
                    return data;
                }
                
                if (data.status === 'processing') {
                    // Still processing, wait and retry
                    await new Promise(resolve => setTimeout(resolve, interval));
                    continue;
                }
                
                // Error or unknown status
                throw new Error(data.error || 'Job failed');
                
            } catch (error) {
                console.error(`Poll attempt ${attempt} failed:`, error);
                
                if (attempt === maxAttempts) {
                    throw new Error(`Polling timeout after ${maxAttempts * interval / 1000} seconds`);
                }
                
                await new Promise(resolve => setTimeout(resolve, interval));
            }
        }
        
        throw new Error('Max polling attempts reached');
    }

    // Simple status check
    async checkHealth() {
        try {
            // Quick test with timeout
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 10000);
            
            const response = await fetch('https://api.pokemontcg.io/v2/cards?pageSize=1&select=name', {
                signal: controller.signal
            });
            
            clearTimeout(timeout);
            
            return {
                success: response.ok,
                status: response.status,
                message: response.ok ? 'API is reachable' : 'API error',
                note: 'Full searches may still be slow (>50s)'
            };
            
        } catch (error) {
            return {
                success: false,
                error: error.message,
                message: 'API is not reachable',
                note: 'The Pokemon TCG API appears to be down or very slow'
            };
        }
    }
}

export const pokemonApi = new PokemonApi();