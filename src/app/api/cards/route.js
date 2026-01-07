// src/app/api/cards/route.js - WITH CIRCUIT BREAKER
import { NextResponse } from 'next/server';

// Simple circuit breaker state
let circuitState = {
    isOpen: false,
    failureCount: 0,
    lastFailure: null,
    nextAttempt: null
};

const MAX_FAILURES = 3;
const RESET_TIMEOUT = 30000; // 30 seconds
const FETCH_TIMEOUT = 5000; // 5 seconds
const RETRY_DELAYS = [1000, 2000, 3000]; // Retry delays in ms

// Reset circuit if it's been closed for long enough
function resetCircuitIfNeeded() {
    if (circuitState.isOpen && circuitState.nextAttempt && Date.now() > circuitState.nextAttempt) {
        console.log('🔄 Resetting circuit breaker');
        circuitState = {
            isOpen: false,
            failureCount: 0,
            lastFailure: null,
            nextAttempt: null
        };
    }
}

// Mark failure
function markFailure() {
    circuitState.failureCount++;
    circuitState.lastFailure = Date.now();
    
    if (circuitState.failureCount >= MAX_FAILURES) {
        circuitState.isOpen = true;
        circuitState.nextAttempt = Date.now() + RESET_TIMEOUT;
        console.log('🔴 Circuit breaker OPEN - too many failures');
    }
}

// Mark success
function markSuccess() {
    circuitState.failureCount = 0;
    circuitState.isOpen = false;
    console.log('🟢 Circuit breaker CLOSED - success');
}

// Retry with exponential backoff
async function fetchWithRetry(url, options, maxRetries = 2) {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            if (attempt > 0) {
                const delay = RETRY_DELAYS[attempt - 1] || 1000;
                console.log(`⏳ Retry ${attempt}/${maxRetries} after ${delay}ms delay`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
            
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
            
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });
            
            clearTimeout(timeout);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            return response;
            
        } catch (error) {
            console.error(`Attempt ${attempt} failed:`, error.message);
            
            if (attempt === maxRetries) {
                throw error;
            }
        }
    }
}

export async function GET(request) {
    try {
        // Check circuit breaker
        resetCircuitIfNeeded();
        
        if (circuitState.isOpen) {
            console.log('⏸️ Circuit breaker is OPEN, rejecting request');
            return NextResponse.json({
                success: false,
                error: 'Service temporarily unavailable. Please try again in 30 seconds.',
                circuitState: 'open',
                retryAfter: Math.ceil((circuitState.nextAttempt - Date.now()) / 1000)
            }, { status: 503 });
        }

        const { searchParams } = request.nextUrl;
        
        // Build parameters - SIMPLIFY EVERYTHING
        const params = new URLSearchParams();
        
        // Get the q parameter or build from name
        let q = searchParams.get('q');
        const name = searchParams.get('name');
        const exact = searchParams.get('exact');
        
        if (name) {
            // SUPER SIMPLE query building
            q = exact === 'true' ? `name:"${name}"` : `name:${name}`;
            params.set('q', q);
        } else if (q) {
            params.set('q', q);
        } else {
            // Default to recent cards if no query
            params.set('q', 'name:*');
        }
        
        // ALWAYS use small page size for testing
        params.set('pageSize', '3');
        params.set('page', searchParams.get('page') || '1');
        params.set('orderBy', 'name');
        
        // Remove any complex filters for now
        console.log('🔧 Simplified params:', params.toString());
        
        const apiUrl = `https://api.pokemontcg.io/v2/cards?${params.toString()}`;
        console.log('🌐 Calling Pokemon TCG API:', apiUrl);

        // Try with retry logic
        const response = await fetchWithRetry(apiUrl, {
            headers: {
                'Accept': 'application/json'
            }
        });

        const data = await response.json();
        console.log(`✅ Received ${data.data?.length || 0} cards`);
        
        // Mark success
        markSuccess();
        
        // Transform to minimal format
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
                totalCount: data.totalCount || 0,
                page: parseInt(params.get('page')),
                pageSize: 3,
                circuitState: 'closed'
            }
        });

    } catch (error) {
        console.error('❌ API Error:', error.message);
        
        // Mark failure
        markFailure();
        
        // Different error messages based on error type
        let errorMessage = 'Failed to fetch cards';
        let statusCode = 500;
        
        if (error.name === 'AbortError' || error.name === 'TimeoutError') {
            errorMessage = 'Pokemon TCG API is taking too long to respond. Please try a simpler search.';
            statusCode = 504; // Gateway Timeout
        } else if (error.message.includes('Failed to fetch')) {
            errorMessage = 'Cannot connect to Pokemon TCG API. Please check your internet connection.';
        }
        
        return NextResponse.json({
            success: false,
            error: errorMessage,
            circuitState: circuitState.isOpen ? 'open' : 'closed',
            failureCount: circuitState.failureCount,
            retryAfter: circuitState.isOpen ? 30 : 5
        }, { status: statusCode });
    }
}