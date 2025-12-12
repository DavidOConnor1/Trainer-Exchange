import { NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export async function GET(request, {params}) {
    const {proxy} = params;
    const {searchParams} = request.nextUrl;
    
    const targetUrl =`${API_BASE}/api/${proxy.join('/')}`;
    const queryString = searchParams.toString();
    const fullUrl = queryString? `${targetUrl}?${queryString}` :targetUrl;

    try{
        const response = await fetch(fullUrl, {
            headers: {
                'Content-Type': 'application/json',
            },
            next: {revalidate: 60} //cache 60 seconds
        });

        if(!response.ok){
            throw new Error(`API Error: ${response.status}`);
        }//end if

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error){
        console.error('Proxy error: ',error);
        return NextResponse.json(
            {error: 'failed to fetch from API'},
            {status: 500}
        );
    }//end catch
}//end get function