import { convertEventToCollection } from "../../../lib/trade/convertEventToCollection";
import { supabase } from "../../../lib/supabase/api";

jest.mock("../../../lib/supabase/api", () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe("convertEventToCollection", () => {
  const eventId = "event-123";
  const userId = "user-456";
  const collectionName = "My Collection";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should throw error if no traded-in items", async () => {
    supabase.from.mockReturnValueOnce({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({
        data: [{ trade_items: [] }, { trade_items: [{ direction: "out" }] }],
        error: null,
      }),
    });

    await expect(
      convertEventToCollection(eventId, collectionName, userId),
    ).rejects.toThrow("No traded‑in items to save.");
  });

  it("should create a collection and insert cards", async () => {
    const tradeItemIn = {
      card_id: "card-1",
      name: "Pikachu",
      set_name: "Base Set",
      trade_price: 10,
      quantity: 1,
      image_url: "https://img.com/pikachu.png",
      direction: "in",
    };

    // Create standalone mocks for the actions we want to verify
    const cardsInsertMock = jest.fn().mockResolvedValue({ error: null });
    const eventUpdateMock = jest.fn().mockReturnThis();

    // Chain the four from() calls
    supabase.from
      .mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: [{ trade_items: [tradeItemIn] }],
          error: null,
        }),
      })
      .mockReturnValueOnce({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: "new-collection-id" },
          error: null,
        }),
      })
      .mockReturnValueOnce({
        insert: cardsInsertMock, // <-- the cards insert we'll check
      })
      .mockReturnValueOnce({
        update: eventUpdateMock, // <-- the event update we'll check
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

    const result = await convertEventToCollection(
      eventId,
      collectionName,
      userId,
    );
    expect(result.id).toBe("new-collection-id");

    // Verify the cards insert was called with the correct items
    expect(cardsInsertMock).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          collection_id: "new-collection-id",
          name: "Pikachu",
          price: 10,
        }),
      ]),
    );

    // Verify event was marked as converted
    expect(eventUpdateMock).toHaveBeenCalledWith({
      converted_to_collection: true,
    });
  });
});
