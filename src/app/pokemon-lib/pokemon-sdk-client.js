// lib/pokemon-sdk-client.js - DIRECT SDK USAGE
import pokemon from 'pokemontcgsdk';

class PokemonSDKClient {
    constructor() {
        // SDK handles API key automatically if needed
    }

    async searchCards(name, options = {}) {
        try {
            console.log(`🔍 SDK searching for: "${name}"`);
            
            const cards = await pokemon.card.where({
                q: `name:${name}`,
                page: options.page || 1,
                pageSize: options.pageSize || 3,
                select: ['images.small', 'name', 'types', 'set.name', 'cardmarket.prices.averageSellPrice'],
                orderBy: options.orderBy || 'name'
            });
            
            console.log(`✅ SDK found ${cards.length} cards`);
            
            return {
                success: true,
                data: cards.map(card => ({
                    id: card.id,
                    image: card.images?.small || null,
                    name: card.name || '',
                    types: card.types || [],
                    set: card.set?.name || '',
                    avgSellPrice: card.cardmarket?.prices?.averageSellPrice || null
                })),
                meta: {
                    count: cards.length,
                    page: options.page || 1,
                    pageSize: options.pageSize || 3
                }
            };
            
        } catch (error) {
            console.error('SDK search error:', error);
            return {
                success: false,
                error: error.message,
                data: []
            };
        }
    }

    async getCardById(id) {
        try {
            const card = await pokemon.card.find(id);
            
            return {
                success: true,
                data: {
                    id: card.id,
                    image: card.images?.small || null,
                    name: card.name || '',
                    types: card.types || [],
                    set: card.set?.name || '',
                    avgSellPrice: card.cardmarket?.prices?.averageSellPrice || null
                }
            };
            
        } catch (error) {
            console.error('SDK get card error:', error);
            return {
                success: false,
                error: error.message,
                data: null
            };
        }
    }

    async checkHealth() {
        try {
            // Simple test with SDK
            const cards = await pokemon.card.all({
                pageSize: 1,
                select: ['name']
            });
            
            return {
                success: true,
                status: 'healthy',
                message: `SDK is working. Found ${cards.length} cards.`
            };
            
        } catch (error) {
            return {
                success: false,
                status: 'unhealthy',
                error: error.message,
                message: 'SDK connection failed'
            };
        }
    }
}

export const pokemonSDK = new PokemonSDKClient();