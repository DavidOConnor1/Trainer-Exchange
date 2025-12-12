import { headers } from "next/headers";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export const pokemonApi = {
    async fetch(endpoint, options = {}){
        const url = `${API_BASE_URL}${endpoint}`;

        try{
            const response = await this.fetch(url, {
                ...options,
                headers: {
                    'Content-Type' : 'application/json',
                    ...options.headers,
                },
            });

            if(!response.ok){
                throw new Error(`API Error: ${response.status}`);
            }//end if


            return await response.json();
        } catch(error){
            console.error('API request failed: ',error);
            throw error;
        }//end catch
    }, //end async fetch

    //simple search query, come back and add front end validations
    searchCards(query){
        const encodedQuery = encodeURIComponent(query);
        return this.fetch(`/api/cards/search?q=${encodedQuery}`);
    }, //end search cards

    //retrieve single card
    getCard(id) {
        return this.fetch(`/api/cards/${id}`);
    }, //end get card

    //Paginated Search
    
}//end pokemon api