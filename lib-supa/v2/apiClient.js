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
            if(contentType)
        } catch(err) {

        }//end try/catch
    }//end request
}//end api client