import {useState, useEffect} from 'react';
import { supabase } from '../../lib-supa/v1/api.js';
import { useAuth } from './useAuth';

export function useCards(collectionId){
    const {user} = useAuth();
    const [cards, setCards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [totalValue, setTotalValue] = useState(0);

    //retrieve all cards in collection
    const fetchCards = async() => {
        if(!user || !collectionId) return;

        try{
            setLoading(true);
            const {data, error} = await supabase
            .from('cards')
            .select('*')
            .eq('collection_id', collectionId)
            .order('created_at', { ascending:false});

            if(error) throw error;
            setCards(data || []);

            //calculate total value
            const total = (data || []).reduce(
                (sum, card) => sum + (card.price * (card.quantity || 1)),
                0
            );

            setTotalValue(total);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }//end try catch finally
    };//end fetch cards

    const addCard = async (cardData)
}//end useCards