"use client";

class rateLimiter{
    constructor(){
        this.attempts = new Map();
    }//end constructor

    //will perform a check if the action is rate limited
    check(identifier, maxAttempts = 5, windowMs= 15*60*1000){
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
            locked: record.locked
        };
    }//end check

    //clears attempts on successful
    clear(identifier){
        this.attempts.delete(identifier);
    }//end clear

    //gathers remaining attempts
    getRemainingAttempts(identifier, maxAttempts){
        const record = this.attempts.get(identifier);
        if(!record) return maxAttempts;
        return Math.max(0, maxAttempts - record.count);
    }//end get remaining attempts
}//end rate limiter

export const authRateLimiter01 = new rateLimiter();