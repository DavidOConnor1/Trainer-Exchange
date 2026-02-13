"use client";

class hiddenTracker {
    constructor(){
        this.storageKey = 'anon_tracking_id';
    }//end constructor

    grabAnonId(){
        //checks for an anon id
        let anonId = localStorage.getItem(this.storageKey);

        //if there is no anonId, create one
        if(!anonId){
            anonId = 'anon_'+Math.random().toString(36).substring(2,15) + 
            Math.random().toString(36).substring(2,15);

            //stores anon id
            localStorage.setItem(this.storageKey, anonId);
        }//end if

        return anonId;
    }//end grab anon id

    clearAnonData(){
        localStorage.removeItem(this.storageKey);
    }//end clear anon data
}//end hidden tracker

export const anonTrack = new hiddenTracker();