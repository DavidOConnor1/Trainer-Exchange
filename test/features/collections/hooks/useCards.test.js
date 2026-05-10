import { renderHook, act } from "@testing-library/react";
import { useCards } from "../../../../src/features/collections/hooks/useCards";
import { supabase } from "../../../../lib/supabase/api";

describe("useCards", () => {
  const collectionId = "col-1";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should fetch cards and calculate total value", async () => {
    const mockCards = [
      { id: "card-1", price: 10, quantity: 2 },
      { id: "card-2", price: 5, quantity: 1 },
    ];

    // Mock the chain: from('cards') → select() → ...
    // First from('cards') call is for the head request (count)
    supabase.from.mockReturnValueOnce({
      select: jest
        .fn()
        .mockResolvedValue({ data: null, error: null, count: 2 }), // head request
    });

    // Second from('cards') call is for the full select
    supabase.from.mockReturnValueOnce({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: mockCards, error: null }),
    });

    const { result } = renderHook(() => useCards(collectionId));

    // Wait for the fetch to complete
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.cards).toEqual(mockCards);
    expect(result.current.totalValue).toBe(25);
  });

  it("should add a card and update state", async () => {
    // Initial fetch: head + full select (empty)
    supabase.from.mockReturnValueOnce({
      select: jest
        .fn()
        .mockResolvedValue({ data: null, error: null, count: 0 }),
    });
    supabase.from.mockReturnValueOnce({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: [], error: null }),
    });

    const newCardData = {
      id: "card-3",
      name: "Pikachu",
      price: 8,
      quantity: 1,
    };
    const insertedCard = { ...newCardData, collection_id: collectionId };

    supabase.from.mockReturnValueOnce({
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: insertedCard, error: null }),
    });

    const { result } = renderHook(() => useCards(collectionId));
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    await act(async () => {
      const card = await result.current.addCard(newCardData);
      expect(card).toEqual(insertedCard);
    });

    expect(result.current.cards).toEqual([insertedCard]);
    expect(result.current.totalValue).toBe(8);
  });

  it("should delete a card and update state", async () => {
    const existingCard = { id: "card-1", price: 10, quantity: 2 };

    supabase.from.mockReturnValueOnce({
      select: jest
        .fn()
        .mockResolvedValue({ data: null, error: null, count: 1 }),
    });
    supabase.from.mockReturnValueOnce({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: [existingCard], error: null }),
    });

    supabase.from.mockReturnValueOnce({
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ error: null }),
    });

    const { result } = renderHook(() => useCards(collectionId));
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    await act(async () => {
      await result.current.deleteCard("card-1");
    });

    expect(result.current.cards).toEqual([]);
    expect(result.current.totalValue).toBe(0);
  });
});
