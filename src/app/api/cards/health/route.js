// app/api/cards/health/route.js
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const apiUrl = `${process.env.POKEMON_TCG_BASE_URL || 'https://api.pokemontcg.io/v2'}/cards?pageSize=1`;
        
        const headers = {
            'Accept': 'application/json'
        };
        
        if (process.env.POKEMON_TCG_API_KEY) {
            headers['X-Api-Key'] = process.env.POKEMON_TCG_API_KEY;
        }

        const response = await fetch(apiUrl, { 
            headers,
            signal: AbortSignal.timeout(5000) // 5 second timeout for health check
        });

        return NextResponse.json({
            success: response.ok,
            status: response.status,
            apiStatus: response.ok ? 'healthy' : 'unhealthy',
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development'
        });

    } catch (error) {
        return NextResponse.json({
            success: false,
            status: 503,
            apiStatus: 'unreachable',
            error: error.message,
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development'
        });
    }
}