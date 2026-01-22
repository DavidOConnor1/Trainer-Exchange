// src/app/api/cards/async/route.js - ASYNC PROCESSING
import { NextResponse } from 'next/server';

// Simple job store
const jobs = new Map();

export async function GET(request) {
    const { searchParams } = request.nextUrl;
    const jobId = searchParams.get('jobId');
    
    // Check job status
    if (jobId) {
        const job = jobs.get(jobId);
        if (!job) {
            return NextResponse.json({
                success: false,
                error: 'Job not found',
                jobId
            }, { status: 404 });
        }
        
        return NextResponse.json({
            success: job.completed,
            data: job.data,
            meta: job.meta,
            jobId,
            status: job.completed ? 'completed' : 'processing',
            started: job.started,
            completed: job.completed ? job.completed : null
        });
    }
    
    // Start new job
    const newJobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const job = {
        id: newJobId,
        started: new Date().toISOString(),
        completed: false,
        data: null,
        meta: null,
        searchParams: Object.fromEntries(searchParams.entries())
    };
    
    jobs.set(newJobId, job);
    
    // Start background processing
    processJobAsync(newJobId);
    
    return NextResponse.json({
        success: true,
        message: 'Search job started',
        jobId: newJobId,
        status: 'processing',
        checkUrl: `/api/cards/async?jobId=${newJobId}`
    });
}

async function processJobAsync(jobId) {
    const job = jobs.get(jobId);
    if (!job) return;
    
    try {
        const params = new URLSearchParams();
        
        // Build query from job params
        let q = job.searchParams.q;
        const name = job.searchParams.name;
        if (!q && name) q = `name:${name}`;
        if (!q) q = 'name:*';
        
        params.set('q', q);
        params.set('select', 'images.small,name,types,set.name,cardmarket.prices.averageSellPrice');
        params.set('pageSize', '3');
        
        const apiUrl = `https://api.pokemontcg.io/v2/cards?${params.toString()}`;
        console.log(`🔄 Processing job ${jobId}: ${apiUrl}`);
        
        // No timeout - let it run
        const response = await fetch(apiUrl, {
            headers: { 'Accept': 'application/json' }
        });
        
        if (!response.ok) {
            throw new Error(`API error ${response.status}`);
        }
        
        const data = await response.json();
        
        // Transform
        const cards = data.data?.map(card => ({
            id: card.id,
            image: card.images?.small || null,
            name: card.name || '',
            types: card.types || [],
            set: card.set?.name || '',
            avgSellPrice: card.cardmarket?.prices?.averageSellPrice || null
        })) || [];
        
        // Update job
        job.data = cards;
        job.meta = {
            count: cards.length,
            totalCount: data.totalCount || 0,
            page: 1,
            pageSize: 3
        };
        job.completed = new Date().toISOString();
        
        console.log(`✅ Job ${jobId} completed with ${cards.length} cards`);
        
        // Clean up old jobs after 1 hour
        setTimeout(() => {
            jobs.delete(jobId);
        }, 3600000);
        
    } catch (error) {
        console.error(`❌ Job ${jobId} failed:`, error);
        job.error = error.message;
        job.completed = new Date().toISOString();
    }
}