// src/app/api/test/route.js
import { NextResponse } from 'next/server';

export async function GET() {
    const tests = [
        { name: 'Simple name search', url: 'https://api.pokemontcg.io/v2/cards?q=name:pikachu&pageSize=3' },
        { name: 'Wildcard search', url: 'https://api.pokemontcg.io/v2/cards?q=name:pik*&pageSize=3' },
        { name: 'Get recent cards', url: 'https://api.pokemontcg.io/v2/cards?pageSize=3' },
        { name: 'Get by ID', url: 'https://api.pokemontcg.io/v2/cards/swsh4-25' }
    ];
    
    const results = [];
    
    for (const test of tests) {
        try {
            console.log(`Testing: ${test.name} - ${test.url}`);
            
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 5000);
            
            const startTime = Date.now();
            const response = await fetch(test.url, {
                headers: { 'Accept': 'application/json' },
                signal: controller.signal
            });
            clearTimeout(timeout);
            
            const duration = Date.now() - startTime;
            
            if (response.ok) {
                const data = await response.json();
                results.push({
                    test: test.name,
                    url: test.url,
                    success: true,
                    duration: `${duration}ms`,
                    status: response.status,
                    dataLength: Array.isArray(data.data) ? data.data.length : 1,
                    sample: test.name.includes('ID') ? data.name : data.data?.[0]?.name || 'none'
                });
            } else {
                results.push({
                    test: test.name,
                    url: test.url,
                    success: false,
                    duration: `${duration}ms`,
                    status: response.status,
                    error: response.statusText
                });
            }
            
        } catch (error) {
            results.push({
                test: test.name,
                url: test.url,
                success: false,
                error: error.message,
                type: error.name
            });
        }
        
        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    return NextResponse.json({
        timestamp: new Date().toISOString(),
        tests: results,
        summary: {
            total: results.length,
            successful: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length
        }
    });
}