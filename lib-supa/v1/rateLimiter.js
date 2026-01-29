/*

    Creating a rate limiter to the backend 
    To prevent attacks or to prevent too many requests being made to the database.

*/

class FrontendRateLimiter {
    constructor(options = {}){
        this.config = {
            windowMs: options.windowMs || 15*60*1000, //15mins
            maxRequests: options.maxRequests || 100, //100 requests per window
            storageKey: options.storageKey || 'frontend_rate_limiter',
            useIP: options.useIP !== false, //default is set true
            useFingerPrint: options.useFingerPrint !== false, //default set true
            ...options
        };

        //storage for in memory tracking (in the event it cannot connect back to db)
        this.attempts = new Map();
        this.initializeStorage();
    }//end

    
}