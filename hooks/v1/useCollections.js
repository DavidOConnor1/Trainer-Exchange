import { useState, useEffect, use } from 'react';
import {supabase} from '../../lib-supa/v1/api.js';
import { useAuth } from './useAuth';

export function useCollections() {//start use collections

    const { user } = useAuth();
    const [collections, setCollections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    //fetch all collections fir current user
    const fetchCollections = async () => {
        if(!user) return;

        try{
            setLoading(true);

            const { data, error } = await supabase
            .from('collections')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', {ascending: false});

            if (error) throw error;
            setCollections(data || []);
        } catch(err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }//end try catch finally
    };//end fetch collections

    //create a new collection
    const createCollection = async (name, description='') => {
        if(!user) throw new Error('User not authenticated');

        try{
         const {data, error} = await supabase
         .from('collections')
         .insert([
            {
                user_id: user.id,
                name,
                description
            },
         ])
         .select()
         .single();

         if(error) throw error;
        } catch(err){

        } finally {

        }
    }//end create collection

} //end use collections