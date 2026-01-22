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

        return null;
    } catch(error){
        console.error('API Request Error', error);
        throw error;
    }//end catch
} //end function 

//health check
export async function checkHealth(){
    return apiRequest('/health');
}//end function

//User API

export async function getUsers(){
    return apiRequest('/users');
}//end function

export async function getUser(){
    return apiRequest(`/users/${id}`);
}//end

export async function createUser(userData){
    return apiRequest('/users', {
        method: 'POST',
        body: userData
    });
}//end function 

export async function updateUser(id, userData) {
    return apiRequest(`/users/${id}`, {
        method: 'PUT',
        body: userData,
    });
}//end function

export async function deleteUser(id) {
    return apiRequest(`/users/${id}`, {
        method: 'DELETE',
    });
}//end function

const api = { 
    checkHealth,
    getUsers,
    getUser,
    createUser,
    updateUser,
    deleteUser
};

export default api;