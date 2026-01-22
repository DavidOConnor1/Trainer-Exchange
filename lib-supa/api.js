const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:4000/api'

//api request function
async function apiRequest(endpoint, options = {}){//start 
    const url = `${API_BASE_URL}${endpoint}`;

    const defaultHeaders = {
        'Content-Type' : 'application/json',
    };

    const config = {
        ...options,
        headers: {
            ...defaultHeaders,
            ...options.headers,
        },
    };

    if(config.body && typeof config.body ==='object'){
        config.body = JSON.stringify(config.body);
    }//end if

    try{ //open try
        const response = await fetch(url, config);

        if(!response.ok){
            throw new Error(`API Error: ${response.status}`); //if response not ok, throw error
        }//end if

        //handle for empty response
        const contentType = response.headers.get('content-type');
        if(contentType && contentType.includes('application/json')) {
            return await response.json();
        }//end if
    } catch(error){

    }//end catch
} //end function