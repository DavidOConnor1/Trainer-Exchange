const API_BASE_URL = process.env.PUBLIC_API_URL || 'http://localhost:4000';

class APIClient{//open api client
    constructor(){ //open constructor
        this.baseUrl = API_BASE_URL;
    }//close constructor

    //request method
    async request(endpoint, options = {}){ //start request
        const url = `${this.baseUrl}${endpoint}`;

        const headers = {//open headers
            'Content-type' : 'application/json',
            ...options.headers
        };//end headers

        //adds an authorization token from the client side
        if(typeof window !== 'undefined'){//start if
            const supabase = this.getSupabaseClient();
            const {data: {session}} = await supabase.auth.getSession();
            if(session?.access_token){
                headers['Authorization'] = `Bear ${session.access_token}`;
            }//end nested if
        }//end if

        const config = { //start config
            ...options,
            headers,
            credentials: 'include', //required to talk with cors
        }; //end config

        
        if(config.body && typeof config.body === 'object'){ //open if
            config.body = JSON.stringify(config.body);
        }//end if

        try{ //start try/catch
            const response = await fetch(url, config);
            //response not ok, generate error message
            if(!response.ok){//open if
                const error = await response.json().catch(() => ({
                    error: `HTTP ${response.status}: ${response.statusText}`
                }));
                throw new Error(error.error || 'Request Failed');
            } //close if

            const contentType = response.headers.get('content-type');
            if(contentType && contentType.includes('application/json')){//start if
                return await response.json();
            } //end if

            return null;
        } catch(err) {
            console.error(`Error with request [${endpoint}]: `, err);
            throw err;
        }//end try/catch
    }//end request

    //helps get the supabase client
    getSupabaseClient(){//start
        if(typeof window === 'undefined') return null;

        const {createClient} = require('@supanase.supabase-js');
        return createClient(
            process.env.PUBLIC_API_URL,
            process.env.PUBLIC_SUPABASE_ANON_KEY
        );
    }//end getclient
    
    //backend api endpoints
    async getPublicCollections(){
        return this.request('/api/public/collections');
    }//end get collections

    async getUserCollections(){
        return this.request('/api/collections');
    }//end get user collections

    async createCollection(data){
        return this.request('/api/collections', {
            method: 'POST',
            body: data,
        });
    }//end create collection

    async getCollectionCards(collectionId){
        return this.request(`/api/collections/${collectionId}/cards`);
    }//end get collectioncards

    async addCardToCollection(collectionId, cardData){
        return this.request(`/api/collections/${collectionId}/cards`, {
            method: 'POST',
            body: cardData,
        });
    }//end add card to collection

    //health checks 
    async checkHealth(){
        return this.request('/health');
    }//end check health

    async getCircuitBreakerStatus(){
        return this.request('/api/health/circuit-breakers');
    }//end circuit
}//end api client

//export as a singleton instance
export const apiClient = new APIClient(); 