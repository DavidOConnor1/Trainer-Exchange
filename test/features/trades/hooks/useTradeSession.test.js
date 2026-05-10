import { renderHook, act, waitFor } from "@testing-library/react";
import { useTradeSession } from "../../../../src/features/trades/hooks/useTradeSession";
import { useTrades } from "../../../../src/features/trades/hooks/useTrades";
import { useCardSearch } from "../../../../src/features/search/hooks/useCardSearch";
import { supabase } from "../../../../lib/supabase/api";

jest.mock("../../../../src/features/trades/hooks/useTrades", () => ({
  useTrades: jest.fn(),
}));
jest.mock("../../../../src/features/search/hooks/useCardSearch", () => ({
  useCardSearch: jest.fn(),
}));

describe("useTradeSession", () => {
  const mockSearch = jest.fn();
  const mockFindOrCreateEvent = jest.fn();
  const mockCreateTradeSession = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useTrades.mockReturnValue({
      findOrCreateEvent: mockFindOrCreateEvent,
      createTradeSession: mockCreateTradeSession,
    });
    useCardSearch.mockReturnValue({
      search: mockSearch,
      cards: [],
      loading: false,
    });
    global.fetch = jest.fn();
    window.confirm = jest.fn(() => true);
    window.alert = jest.fn();
  });

  it("should initialise with empty trade lists", () => {
    const { result } = renderHook(() => useTradeSession());
    expect(result.current.tradeInItems).toEqual([]);
    expect(result.current.tradeOutItems).toEqual([]);
    expect(result.current.totalIn).toBe(0);
    expect(result.current.totalOut).toBe(0);
    expect(result.current.profit).toBe(0);
  });

  it("should add a card from collection to trade out", () => {
    const { result } = renderHook(() => useTradeSession());

    act(() => {
      result.current.addCardFromCollection({
        id: "coll-card-1",
        card_id: "base1-58",
        name: "Pikachu",
        set_name: "Base Set",
        price: 20,
        image_url: "https://img.com/pikachu.png",
      });
    });

    expect(result.current.tradeOutItems).toEqual([
      expect.objectContaining({
        card_id: "base1-58",
        name: "Pikachu",
        trade_price: 20,
      }),
    ]);
  });

  it("should open and close collection modal", () => {
    const { result } = renderHook(() => useTradeSession());
    expect(result.current.showCollectionModal).toBe(false);
    act(() => result.current.openCollectionModal());
    expect(result.current.showCollectionModal).toBe(true);
    act(() => result.current.closeCollectionModal());
    expect(result.current.showCollectionModal).toBe(false);
  });

  it("should search cards when typing at least 2 characters", () => {
    const { result } = renderHook(() => useTradeSession());
    act(() => {
      result.current.handleSearch({ target: { value: "Pi" } });
    });
    expect(mockSearch).toHaveBeenCalledWith(
      { name: "Pi", pageSize: 10 },
      { debounceMs: 400 },
    );
  });

  it("should not search for less than 2 characters", () => {
    const { result } = renderHook(() => useTradeSession());
    act(() => {
      result.current.handleSearch({ target: { value: "P" } });
    });
    expect(mockSearch).not.toHaveBeenCalled();
  });

  it("should open price modal for a card", () => {
    const { result } = renderHook(() => useTradeSession());
    const card = { id: "card-1", name: "Test", images: {} };
    act(() => result.current.openPriceModal(card));
    expect(result.current.selectedCard).toEqual(card);
  });

  it("should add trade-in item optimistically and set price from cache", async () => {
    // Mock fetch to return a trend price of 10.5
    global.fetch.mockResolvedValue({
      json: async () => ({ pricing: { trend: 10.5 } }),
    });

    // Pre-populate search results so the price cache gets filled
    useCardSearch.mockReturnValue({
      search: mockSearch,
      cards: [{ id: "card-1", name: "Pikachu", images: {} }],
      loading: false,
    });

    const { result } = renderHook(() => useTradeSession());

    // Simulate a search to trigger pre-fetching
    await act(async () => {
      result.current.handleSearch({ target: { value: "Pikachu" } });
    });

    // Wait for the pre-fetch to complete
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    // Now add the card using the trade-in handler
    await act(async () => {
      result.current.openPriceModal({
        id: "card-1",
        name: "Pikachu",
        images: {},
      });
    });

    await act(async () => {
      result.current.handleTradeIn(0.8);
    });

    // The item should be added with the correct price
    expect(result.current.tradeInItems).toHaveLength(1);
    expect(result.current.tradeInItems[0].name).toBe("Pikachu");
    expect(result.current.tradeInItems[0].trade_price).toBe(8.4); // 10.5 * 0.8
  });

  it("should update an item field", () => {
    const { result } = renderHook(() => useTradeSession());

    // Switch to trade-out direction
    act(() => {
      result.current.setSelectedDirection("out");
      result.current.openPriceModal({ id: "card-1", name: "Test", images: {} });
    });
    act(() => {
      result.current.handleTradeOut();
    });

    act(() => {
      result.current.updateItem("out", 0, "trade_price", 15);
    });
    expect(result.current.tradeOutItems[0].trade_price).toBe(15);
  });

  it("should remove an item", () => {
    const { result } = renderHook(() => useTradeSession());

    act(() => {
      result.current.setSelectedDirection("out");
      result.current.openPriceModal({ id: "card-1", name: "Test", images: {} });
    });
    act(() => {
      result.current.handleTradeOut();
    });
    expect(result.current.tradeOutItems).toHaveLength(1);

    act(() => {
      result.current.removeItem("out", 0);
    });
    expect(result.current.tradeOutItems).toHaveLength(0);
  });

  it("should calculate totals correctly", () => {
    const { result } = renderHook(() => useTradeSession());

    // Add trade-in item
    act(() => {
      result.current.openPriceModal({ id: "c1", name: "A", images: {} });
    });
    act(() => {
      result.current.handleTradeIn(1.0);
    });
    // Add trade-out item
    act(() => {
      result.current.setSelectedDirection("out");
      result.current.openPriceModal({ id: "c2", name: "B", images: {} });
    });
    act(() => {
      result.current.handleTradeOut();
    });

    // Set prices directly for a stable test
    act(() => {
      result.current.updateItem("in", 0, "trade_price", 10);
      result.current.updateItem("out", 0, "trade_price", 5);
    });

    expect(result.current.totalIn).toBe(10);
    expect(result.current.totalOut).toBe(5);
    expect(result.current.profit).toBe(5);
  });

  it("should prevent completing an empty trade", async () => {
    const { result } = renderHook(() => useTradeSession());
    await act(async () => {
      await result.current.handleCompleteTrade();
    });
    expect(window.alert).toHaveBeenCalledWith("Add at least one card.");
    expect(mockFindOrCreateEvent).not.toHaveBeenCalled();
  });

  it("should complete a trade and remove collection cards", async () => {
    window.confirm = jest.fn(() => true);
    mockFindOrCreateEvent.mockResolvedValue({ id: "ev-1" });
    mockCreateTradeSession.mockResolvedValue({ id: "sess-1" });

    const { result } = renderHook(() => useTradeSession());
    act(() => {
      result.current.addCardFromCollection({
        id: "coll-card-1",
        card_id: "base1-58",
        name: "Pikachu",
        set_name: "Base Set",
        price: 10,
      });
    });

    supabase.from.mockReturnValueOnce({
      delete: jest.fn().mockReturnThis(),
      in: jest.fn().mockResolvedValue({ error: null }),
    });

    await act(async () => {
      await result.current.handleCompleteTrade();
    });

    expect(mockFindOrCreateEvent).toHaveBeenCalled();
    expect(mockCreateTradeSession).toHaveBeenCalled();
    expect(result.current.successMessage).toBe("Trade saved successfully!");
    expect(result.current.tradeOutItems).toHaveLength(0);
  });
});
