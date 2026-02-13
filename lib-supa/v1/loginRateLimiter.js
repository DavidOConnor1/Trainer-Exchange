"use client";

class rateLimiter{
    constructor(){
        this.attempts = new Map();
    }//end constructor

    //will perform a check if the action is rate limited
    check(identifier, maxAttempts = 5, windowMs= 15*60*1000){
        
    }//end check
}//end rate limiter