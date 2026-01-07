
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
    try {
        const { id } = await params;
        
        if (!id) {
            return NextResponse.json({
                success: false,
                error: 'Card ID is required'
            }, { status: 400 });
        }

        const apiUrl = `${process.env.POKEMON_TCG_BASE_URL}/cards/${id}`;
        
        const headers = {
            'Accept': 'application/json'
        };
        
        if (process.env.POKEMON_TCG_API_KEY) {
            headers['X-Api-Key'] = process.env.POKEMON_TCG_API_KEY;
        }

        const response = await fetch(apiUrl, 
            { headers: {
                'Accept': 'application/json'
            }, });
        
        if (!response.ok) {
            if (response.status === 404) {
                return NextResponse.json({
                    success: false,
                    error: 'Card not found'
                }, { status: 404 });
            }
            throw new Error(`API error: ${response.status}`);
        }

        const card = await response.json();
        
        // Transform to our format
        const transformedCard = {
            id: card.id,
            image: card.images?.small || null,
            name: card.name || '',
            types: card.types || [],
            set: card.set?.name || '',
            avgSellPrice: card.cardmarket?.prices?.averageSellPrice || null,
            // Additional details for single card view
            supertype: card.supertype,
            subtypes: card.subtypes || [],
            hp: card.hp,
            attacks: card.attacks || [],
            abilities: card.abilities || [],
            weaknesses: card.weaknesses || [],
            retreatCost: card.retreatCost || [],
            artist: card.artist,
            rarity: card.rarity,
            number: card.number,
            flavorText: card.flavorText,
            legalities: card.legalities || {},
            tcgplayer: card.tcgplayer,
            cardmarket: card.cardmarket
        };

        return NextResponse.json({
            success: true,
            data: transformedCard
        });

    } catch (error) {
        console.error('Get card error:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to fetch card'
        }, { status: 500 });
    }
}