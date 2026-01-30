import { createClient } from '@supabase/supabase-js';

class AuthService {//start auth

    constructor(){
        if(typeof window === 'undefined') return ;
        this.supabase = createClient(
            process.env.PUBLIC_API_URL,
            process.env.PUBLIC_SUPABASE_ANON_KEY,
            {
                auth: {
                    persistSession: true,
                    autoRefreshToken: true,
                }
            }
        );
    }//end constructor

    async signIn(email, password){
        const { data, error } = await this.supabase.auth.signInWithPassword({
            email,
            password
        });
        return {data, error};
    }//end sign in

    async signUp(email, password, username, displayName){
        const {data, error} = await this.supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    username,
                    display_name: displayName
                }
            }
        });
        return {data, error};
    }//end sign up

    async signOut(){
        return await this.supabase.auth.signOut();
    }//end sign out

    async getCurrentUser(){
        return await this.supabase.auth.getUser();
    }//end get current user

    getSession(){
        return this.supabase.auth.getSession();
    }//end get session

    onAuthStateChange(callback){
        return this.supabase.auth.onAuthStateChange(callback);
    }//end auth state change
} //close auth

//export for client side use
export const authService = typeof window !== 'undefined' ? new AuthService() : null;