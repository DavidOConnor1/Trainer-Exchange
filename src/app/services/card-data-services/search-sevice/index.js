import { fetchCards } from "../api/client.js";


export async function searchCards(query) {
    if(!query) return [];
    const cards = await fetchCards({q: `name:${query}`});
    return cards;
}