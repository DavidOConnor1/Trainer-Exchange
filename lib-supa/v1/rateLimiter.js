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

    //will use peer connection to obtain the users ip address to be used for the rate limiter
     async grabIPVIAPeer(){
        try{//start try catch
            const peerConnection = RTCPeerConnection ||
                                    window.RTCPeerConnection ||
                                    window.webkitRTCPeerConnection ||
                                    window.mozRTCPeerConnection;

            if(peerConnection){//start if
                const pc = new peerConnection({iceServers: []});
                const candidatePromise = new Promise(resolve => {
                    let candidate = null;
                    pc.createDataChannel('');
                    pc.createOffer().then(offer => pc.setLocalDescription(offer));
                    pc.onicecandidate = (ice) => {
                        if(!ice || ice.candidate || ice.candidate.candidate) return;
                        const ipRegex = /([0-9]{1,3}(\.[0-9]{1,3}){3})/;
                        const match = ipRegex.exec(ice.candidate.candidate);
                        if(match){
                            candidate = match[1];
                            resolve(candidate)
                        }   //end if 
                    }
                });

                //timeout
                const timeoutPromise = new Promise(resolve => 
                    setTimeout(() => resolve(null), 1000)
                );

                const ip = await Promise.race([candidatePromise, timeoutPromise]);
                pc.close();
                //if ip found return ip
                if(ip) return ip;
            }//end if
        } catch(error) {
            console.log('There was an issue when using peer connection: ', error);
        }//end try catch
    }//end grab IP via peer


    async getClientIP(){
        if(typeof window === 'undefined') return null;

        try{ //start try catch
            //will use peer connection to source the users ip address
            grabIPVIAPeer();
        } catch(error) {
            console.warn('Failure to get client IP: ',error);
        }//end try catch
        return null;
    }//end get client ip

    //generate a browser finger printer
    generateFingerPrint(){
        if(typeof window === 'undefined') return 'server';

        try{ //open try catch
            const components = [
                navigator.userAgent,
                navigator.language,
                screen.colorDepth,
                (screen.width || 0).toString(),
                (screen.height || 0).toString(),
                new Date().getTimezoneOffset(),
                !!window.sessionStorage,
                !!window.localStorage,
                !!window.indexedDB,
                (navigator.hardwareConcurrency || 0).toString(),
                (navigator.maxTouchPoints || 0).toString(),
                navigator.platform
            ];

            //generate simple hash of components
            let hash =0;
            const combined = components.join('|');
            for(let i=0; i<combined.length; i++){
                const char = combined.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash;
            }//end for

            return Math.abs(hash).toString(36);
        } catch(error){
            return 'unknown';
        }//end try catch
    }//end finger print

    
}//end frontend rate limiter