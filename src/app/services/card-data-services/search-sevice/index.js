import { fetchCards } from "../api/client";

export async function searchCards(query) {
    if(!query) return [];
    const cards = await fetchCards({q: `name:${query}`});
    return cards;
}