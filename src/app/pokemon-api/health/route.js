// src/app/api/health/route.js - SIMPLE HEALTH CHECK
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        // Test the Pokemon TCG API with minimal query
        const testUrl = 'https://api.pokemontcg.io/v2/cards?q=name:pikachu&pageSize=1&select=name';
        
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30000);
        
        const startTime = Date.now();
        const response = await fetch(testUrl, {
            headers: { 'Accept': 'application/json' },
            signal: controller.signal
        });
        clearTimeout(timeout);
        
        const responseTime = Date.now() - startTime;
        
        return NextResponse.json({
            status: response.ok ? 'healthy' : 'unhealthy',
            responseTime: `${responseTime}ms`,
            pokemonApiStatus: response.status,
            message: response.ok ? 
                `Pokemon TCG API is responding (${responseTime}ms)` :
                `Pokemon TCG API error: ${response.status}`,
            recommendation: responseTime > 10000 ? 
                'API is very slow. Consider reducing page sizes.' : 
                'API is responsive'
        });
        
    } catch (error) {
        return NextResponse.json({
            status: 'unreachable',
            responseTime: 'timeout',
            error: error.message,
            message: 'Pokemon TCG API is not reachable',
            recommendation: 'Check your internet connection or try again later'
        }, { status: 503 });
    }
}