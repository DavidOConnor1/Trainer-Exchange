// src/app/api/cards/route.js - USING OFFICIAL SDK
import { NextResponse } from 'next/server';
import { Card } from 't'

// Simple cache
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function GET(request) {
    const startTime = Date.now();
    
    try {
        const { searchParams } = request.nextUrl;
        
        // Build cache key
        const cacheKey = searchParams.toString();
        const cached = cache.get(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
            console.log('✅ Cache hit');
            return NextResponse.json({
                ...cached.data,
                cached: true,
                responseTime: Date.now() - startTime
            });
        }
        
        // Build query for SDK
        const name = searchParams.get('name');
        const page = parseInt(searchParams.get('page') || '1');
        const pageSize = 3;
        
        console.log(`🔍 Searching for: "${name || 'all cards'}"`);
        
        // Use the SDK - it handles everything!
        let cards;
        if (name) {
            cards = await Card.where({
                q: `name:${name}`,
                page: page,
                pageSize: pageSize,
                select: ['images.small', 'name', 'types', 'set.name', 'cardmarket.prices.averageSellPrice']
            });
        } else {
            // Get recent cards
            cards = await Card.all({
                page: page,
                pageSize: pageSize,
                select: ['images.small', 'name', 'types', 'set.name', 'cardmarket.prices.averageSellPrice']
            });
        }
        
        const responseTime = Date.now() - startTime;
        console.log(`✅ SDK found ${cards.length} cards in ${responseTime}ms`);
        
        // Transform data
        const transformedCards = cards.map(card => ({
            id: card.id,
            image: card.images?.small || null,
            name: card.name || '',
            types: card.types || [],
            set: card.set?.name || '',
            avgSellPrice: card.cardmarket?.prices?.averageSellPrice || null
        }));
        
        const result = {
            success: true,
            data: transformedCards,
            meta: {
                count: transformedCards.length,
                page: page,
                pageSize: pageSize,
                responseTime: `${responseTime}ms`
            }
        };
        
        // Cache result
        cache.set(cacheKey, {
            timestamp: Date.now(),
            data: result
        });
        
        return NextResponse.json(result);
        
    } catch (error) {
        const responseTime = Date.now() - startTime;
        console.error('❌ SDK Error:', error);
        
        return NextResponse.json({
            success: false,
            error: error.message,
            responseTime: `${responseTime}ms`,
            note: 'Using official Pokemon TCG SDK'
        }, { status: 500 });
    }
}