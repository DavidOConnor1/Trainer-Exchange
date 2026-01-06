

const USE_PROXY = true;
const API_BASE_URL = USE_PROXY ? '/api/pokemon' : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000');

export const pokemonApi = {
    async fetch(endpoint, options = {}){
        const url = `${API_BASE_URL}${endpoint}`;

        console.log(`making a api call to: ${url}`)//debug log

        try{
            const response = await fetch(url, {
                ...options,
                headers: {
                    'Content-Type' : 'application/json',
                    ...options.headers,
                },
            });

            console.log(`response status: ${response.status} ${response.statusText}`)

            if(!response.ok){
                throw new Error(`API Error: ${response.status}`);
            }//end if

            const data = await response.json();
            console.log(`Response data:`,data);
            return data;
            
        } catch(error){
            console.error('API request failed: ',error);
            console.error('Endpoint failure: ',endpoint);
            console.error('full url', url);
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
    searchPaginated(query, page = 1, pageSize = 20){
        const params = new URLSearchParams({
            q: query,
            page: page.toString(),
            pageSize: pageSize.toString(),
        });
        return this.fetch(`/api/cards/search/paginated${params}`);
    }, //end search paginated

    // Advanced search
    advancedSearch(params){
        const queryString = new URLSearchParams(params).toString();
        return this.fetch(`/api/cards/search/advanced?${queryString}`);
    }, //end advancedSearch

    //health check
    checkHealth(){
        return this.fetch('/health');
    }//end check health
}//end pokemon api