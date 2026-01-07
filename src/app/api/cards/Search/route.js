// src/app/api/cards/search/route.js
import { NextResponse } from 'next/server';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        
        // Accept both 'q' (direct query) and 'name' (convenience parameter)
        let q = searchParams.get('q');
        const name = searchParams.get('name');
        const pageSize = searchParams.get('pageSize') || '20';
        const page = searchParams.get('page') || '1';
        const exact = searchParams.get('exact');
        const type = searchParams.get('type');
        const set = searchParams.get('set');
        const rarity = searchParams.get('rarity');
        
        console.log('API Search Request:', { q, name, pageSize, page, exact, type, set, rarity });

        // Build query from individual parameters if 'q' not provided
        if (!q && name) {
            if (exact === 'true') {
                q = `name:"${name}"`;
            } else {
                q = `name:${name}*`;
            }
            
            // Add other filters
            const filters = [];
            if (type) filters.push(`types:${type}`);
            if (set) filters.push(`set.name:${set}*`);
            if (rarity) filters.push(`rarity:${rarity}`);
            
            if (filters.length > 0) {
                q = `${q} ${filters.join(' ')}`;
            }
        }
        
        if (!q) {
            return NextResponse.json({
                success: false,
                error: 'Query parameter (q) or name parameter is required',
                data: []
            }, { status: 400 });
        }

        // Build the external API URL - SIMPLE is better!
        const apiParams = new URLSearchParams({
            q: q,
            pageSize: Math.min(parseInt(pageSize), 250).toString(), // Pokemon API max is 250
            page: page,
            orderBy: 'name'
        });

        const apiUrl = `https://api.pokemontcg.io/v2/cards?${apiParams}`;
        console.log('Calling Pokemon TCG API:', apiUrl);

        const response = await fetch(apiUrl, {
            headers: {
                'Accept': 'application/json'
            },
            signal: AbortSignal.timeout(10000)
        });

        if (!response.ok) {
            console.error('Pokemon TCG API Error:', response.status, response.statusText);
            
            // If it's a 400/404, it might be a query syntax issue
            if (response.status === 400 || response.status === 404) {
                // Try a simpler query with just the name
                if (name) {
                    const simpleQuery = `name:${name}`;
                    const simpleParams = new URLSearchParams({
                        q: simpleQuery,
                        pageSize: '5',
                        page: '1',
                        orderBy: 'name'
                    });
                    
                    const simpleApiUrl = `https://api.pokemontcg.io/v2/cards?${simpleParams}`;
                    console.log('Trying simpler query:', simpleApiUrl);
                    
                    const simpleResponse = await fetch(simpleApiUrl, {
                        headers: { 'Accept': 'application/json' },
                        signal: AbortSignal.timeout(5000)
                    });
                    
                    if (simpleResponse.ok) {
                        const simpleData = await simpleResponse.json();
                        const cards = simpleData.data?.map(card => ({
                            id: card.id,
                            image: card.images?.small || null,
                            name: card.name || '',
                            types: card.types || [],
                            set: card.set?.name || '',
                            avgSellPrice: card.cardmarket?.prices?.averageSellPrice || null
                        })) || [];
                        
                        return NextResponse.json({
                            success: true,
                            data: cards,
                            meta: {
                                count: cards.length,
                                page: parseInt(page),
                                pageSize: parseInt(pageSize),
                                totalCount: simpleData.totalCount || cards.length,
                                note: 'Used simple query format'
                            }
                        });
                    }
                }
                
                // Return empty results
                return NextResponse.json({
                    success: true,
                    data: [],
                    meta: {
                        count: 0,
                        page: parseInt(page),
                        pageSize: parseInt(pageSize),
                        totalCount: 0
                    }
                });
            }
            
            throw new Error(`Pokemon TCG API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log(`Received ${data.data?.length || 0} cards from API`);

        // Transform to our format
        const cards = data.data?.map(card => ({
            id: card.id,
            image: card.images?.small || null,
            name: card.name || '',
            types: card.types || [],
            set: card.set?.name || '',
            avgSellPrice: card.cardmarket?.prices?.averageSellPrice || null
        })) || [];

        return NextResponse.json({
            success: true,
            data: cards,
            meta: {
                count: cards.length,
                page: parseInt(page),
                pageSize: parseInt(pageSize),
                totalCount: data.totalCount || cards.length,
                hasMore: (data.totalCount || 0) > (parseInt(page) * parseInt(pageSize))
            }
        });

    } catch (error) {
        console.error('Search API Route Error:', error);
        
        return NextResponse.json({
            success: false,
            error: error.name === 'TimeoutError' ? 'Request timed out' : 'Search failed',
            data: []
        }, { status: 500 });
    }
}