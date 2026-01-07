// src/app/api/debug/route.js (temporary)
import { NextResponse } from 'next/server';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name') || 'pikachu';
    
    const testUrl = `https://api.pokemontcg.io/v2/cards?q=name:${name}*&pageSize=5`;
    
    try {
        const response = await fetch(testUrl);
        const data = await response.json();
        
        return NextResponse.json({
            externalApiUrl: testUrl,
            externalApiStatus: response.status,
            externalApiData: data.data?.slice(0, 2) || [],
            yourApiUrl: `/api/cards/search?name=${name}`,
            message: 'Test complete'
        });
    } catch (error) {
        return NextResponse.json({
            error: error.message,
            externalApiUrl: testUrl,
            message: 'Test failed'
        }, { status: 500 });
    }
}