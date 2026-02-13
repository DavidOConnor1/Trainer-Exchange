"use client";

import { anonTrack } from "../v1/sessionTracker";

class rateLimiter{
    constructor(){
        this.attempts = new Map();
        this.storageKey = 'rate_limit_data';
        this.loadFromStorage();
    }//end constructor

    loadFromStorage(){
        try{
            const store = localStorage.getItem(this.storageKey);

            //if anon id found, map the attempts to it 
            if(stored){
                this.attempts = new Map(JSON.parse(store));
            }//end if
        } catch(error){
            //if unable to find store, attach to browser memory
            this.attempts = new Map();
        }//end try/catch
    }//end load from storage

    saveToStorage(){
        try{
            localStorage.setItem(this.storageKey, JSON.stringify(Array.from(this.attempts.entries())));
        } catch(error){
            console.log("unable to store rate limit attempts: ",error);
        }//end try catch
    }//end save to storage

    //will perform a check if the action is rate limited
    check(email = null, maxAttempts = 5, windowMs= 15*60*1000){
        //grab id whether logged in or not
        const identifier = email || anonTrack.grabAnonId();
        
        const now  = Date.now(); //grabs the current time
        const record = this.attempts.get(identifier) || {
            count: 0,
            firstAttempt: now,
            locked: false
        }//end record

        //resets window when expired
        if(now - record.firstAttempt > windowMs){
            record.count = 0;
            record.firstAttempt = now;
            record.locked = false;
        }//end if

        //counter will iterate with each wrong attempt
        record.count++;
        this.attempts.set(identifier, record);
        this.saveToStorage();

        const remainingTime = windowMs - (now - record.firstAttempt);
        const limited = record.count > maxAttempts;
        
        //Auto-lock after too many attempts
        if(limited && !record.locked){
            record.locked = true;
            console.warn(`Rate Limit has been triggered for ${identifier}`);
        }//end if

        return{
            limited,
            attempts: record.count,
            remainingTime,
            locked: record.locked,
            identifier: identifier
        };
    }//end check

    //clears attempts on successful
    clear(identifier){
        this.attempts.delete(identifier);
        this.saveToStorage();
    }//end clear

    //gathers remaining attempts
    getRemainingAttempts(identifier, maxAttempts){
        const record = this.attempts.get(identifier);
        if(!record) return maxAttempts;
        return Math.max(0, maxAttempts - record.count);
    }//end get remaining attempts
}//end rate limiter

export const authRateLimiter01 = new rateLimiter();