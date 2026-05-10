// lib/trade/convertEventToCollection.js
import { supabase } from "../supabase/api";

/**
 * Convert all traded‑in items of a trade event into a new regular collection.
 * @param {string} eventId – The UUID of the trade event.
 * @param {string} collectionName – Name for the new collection.
 * @param {string} userId – UUID of the authenticated user.
 * @returns {Promise<Object>} The newly created collection object.
 */
export async function convertEventToCollection(
  eventId,
  collectionName,
  userId,
) {
  // 1. Fetch sessions and traded‑in items
  const { data: sessions, error: sessionsError } = await supabase
    .from("trade_sessions")
    .select("*, trade_items(*)")
    .eq("event_id", eventId);

  if (sessionsError) throw sessionsError;

  const tradedInItems = sessions.flatMap((s) =>
    (s.trade_items || []).filter((item) => item.direction === "in"),
  );

  if (tradedInItems.length === 0) {
    throw new Error("No traded‑in items to save.");
  }

  // 2. Create the new collection
  const { data: collection, error: collectionError } = await supabase
    .from("collections")
    .insert({
      user_id: userId,
      name: collectionName,
      description: `Converted from trade event on ${new Date().toLocaleDateString()}`,
    })
    .select()
    .single();

  if (collectionError) throw collectionError;

  // 3. Insert all traded‑in items as cards
  const cards = tradedInItems.map((item) => ({
    collection_id: collection.id,
    card_id: item.card_id || item.id,
    name: item.name,
    type: item.set_name || "Unknown",
    set_name: item.set_name,
    price: item.trade_price,
    quantity: item.quantity || 1,
    image_url: item.image_url,
  }));

  const { error: cardsError } = await supabase.from("cards").insert(cards);
  if (cardsError) throw cardsError;

  // 4. Mark the event as converted
  const { error: updateError } = await supabase
    .from("trade_events")
    .update({ converted_to_collection: true })
    .eq("id", eventId);

  if (updateError) throw updateError;

  return collection;
}
