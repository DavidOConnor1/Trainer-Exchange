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

    const addCard = async (cardData) => {
        if(!user || !collectionId) throw new Error('Missing required data');

        try{
            const {data, error} = await supabase
            .from('cards')
            .insert([
                {
                    collection_id: collectionId,
                    name: cardData.name,
                    type: cardData.type,
                    set_name: cardData.set_name,
                    price: cardData.price,
                    quantity: cardData.quantity || 1,
                    image_url: cardData.image_url,
                    card_id:cardData.card_id
                },
            ])
            .select()
            .single();

            if(error) throw error;

            //update local state
            setCards(prev => [data, ...prev]);

            //update total value
            setTotalValue(prev => prev + (data.price * data.quantity));

            return data;
        } catch(err){
            setError(err.message);
            throw err;
        }//end try catch
    };//end add card

    const updateCard = async(cardId, updates) => {
        try{
            const {data, error} = await supabase
            .from('cards')
            .update({
                ...updates,
                updated_at: new Date().toISOString(),
            })
            .eq('id', cardId)
            .select()
            .single();

            if (error) throw error;

            //updates local state
            setCards(prev => prev.map(c => (c.id === cardId ? data : c)));

            //recalculate total
            const newCollectionTotal = cards.reduce((sum, card)=> {
                if(card.id === cardId){
                    return sum + (data.price * (data.quantity || 1));
                }//end if
                return sum + (card.price * (card.quantity || 1));
            }, 0);
            setTotalValue(newCollectionTotal);

            return data;
        } catch(err){
            setError(err.message);
            throw err;
        }//end try catch
    };//end updatecard

    const removeCard = async (cardId) => {
        try{
            const cardToRemove = cards.find(c => c.id === cardId);

            const {error} = await supabase
            .from('cards')
            .delete()
            .eq('id', cardId);

            if(error) throw error;

            //update local state
            setCards(prev => prev.filter(c => c.id !== cardId));

            //update total value
            if(cardToRemove){
                setTotalValue(prev => prev - (cardToRemove.price * cardToRemove.quantity));
            }//end if 
        } catch(err) {
            setError(err.message);
            throw err;
        }//end try catch
    }; //end remove card

    //load cards on mount or when collection changes
    useEffect(() => {
        if(collectionId){
            fetchCards();
        }
    }, [collectionId]);

    return {
        cards,
        loading,
        error,
        totalValue,
        addCard,
        updateCard,
        removeCard,
        refreshCards: fetchCards
    };
}//end useCards