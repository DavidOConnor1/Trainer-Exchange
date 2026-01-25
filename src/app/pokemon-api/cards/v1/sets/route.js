// app/api/cards/sets/route.js - Get all sets
export async function GET() {
    try {
        const apiUrl = `${process.env.POKEMON_TCG_BASE_URL}/sets`;
        
        const headers = {
            'Accept': 'application/json'
        };
        
        if (process.env.POKEMON_TCG_API_KEY) {
            headers['X-Api-Key'] = process.env.POKEMON_TCG_API_KEY;
        }

        const response = await fetch(apiUrl, { headers });
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        
        // Transform sets to simpler format
        const sets = data.data?.map(set => ({
            id: set.id,
            name: set.name,
            series: set.series,
            printedTotal: set.printedTotal,
            symbol: set.images?.symbol,
            logo: set.images?.logo,
            releaseDate: set.releaseDate
        })) || [];

        return NextResponse.json({
            success: true,
            data: sets,
            count: sets.length
        });

    } catch (error) {
        console.error('Get sets error:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to fetch sets'
        }, { status: 500 });
    }
}