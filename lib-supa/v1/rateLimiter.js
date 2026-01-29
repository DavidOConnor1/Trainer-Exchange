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

    //intialize storage based on the users browser capabilities
    initializeStorage(){
        if(typeof window === 'undefined') return;

        try{ //open try catch
            //try to load from local storage
            const stored = localStorage.getItem(this.config.storageKey);
            if(stored){
                const parsed = JSON.parse(stored);
                for(const [key, value] of Object.entries(parsed)){
                    this.attempts.set(key, value);
                }//end for
            }//end if
        } catch(error){
            console.warn('failed to load rate limiter from storage: ', error);
        }//end try catch
        //cleans out old entries periodically
        setInterval(() => this.cleanupOldEntries(), this.config.windowMs);
    }//end intialize storage

    //grabs the client identifier
    async getClientIdentifier(){ //open client identifier
        const identifier = [];

        //will capture the users ip
        if(this.config.useIP){
            const ip = await this.getClientIP();
            if(ip) identifier.push(`ip:${ip}`);
        }

        //fallback ti session based identifier
        if(identifier.length === 0){
            const sessionId = sessionStorage.getItem('session_id') || 
                `session-${Date.now()}-${Math.random().toString(36).substr(2,9)}`;
                sessionStorage.setItem('session_id', sessionId);
                identifier.push(`session:${sessionId}`);
        }//end if

        return identifier.join('|');
    }//end client identifier

    async getClientIP(){
        if(typeof window === 'undefined') return null;

        try{ //start try catch

        } catch(error) {
            
        }//end try catch
    }//end get client ip
}//end frontend rate limiter