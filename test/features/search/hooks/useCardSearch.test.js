import { renderHook, act, waitFor } from "@testing-library/react";
import { useCardSearch } from "../../../../src/features/search/hooks/useCardSearch";
import {
  searchCards,
  extractCards,
  extractPagination,
} from "../../../../lib/pokemonApi/searchService";

jest.mock("../../../../lib/pokemonApi/searchService", () => ({
  searchCards: jest.fn(),
  extractCards: jest.fn(),
  extractPagination: jest.fn(),
}));

describe("useCardSearch", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return initial state", () => {
    const { result } = renderHook(() => useCardSearch());
    expect(result.current.cards).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.pagination).toEqual({
      page: 1,
      pageSize: 20,
      total: 0,
      hasMore: false,
    });
    expect(result.current.hasMore).toBe(false);
  });

  it("should search and update state", async () => {
    const mockCards = [{ id: "1" }, { id: "2" }];
    const mockPagination = { page: 1, pageSize: 20, total: 2, hasMore: false };

    extractCards.mockReturnValue(mockCards);
    extractPagination.mockReturnValue(mockPagination);
    searchCards.mockResolvedValue({ data: mockCards });

    const { result } = renderHook(() => useCardSearch());

    act(() => {
      result.current.search({ name: "pikachu" }, { debounceMs: 0 });
    });

    // Just wait for the final result – no need to catch loading=true
    await waitFor(() => expect(result.current.loading).toBe(false));
    await waitFor(() => expect(result.current.cards).toEqual(mockCards));
    await waitFor(() =>
      expect(result.current.pagination).toEqual(mockPagination),
    );
    expect(result.current.error).toBeNull();
    expect(searchCards).toHaveBeenCalledWith({ name: "pikachu" });
  });

  it("should set error when search fails", async () => {
    searchCards.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useCardSearch());

    act(() => {
      result.current.search({ name: "mew" }, { debounceMs: 0 });
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
    await waitFor(() => expect(result.current.error).toBe("Network error"));
    expect(result.current.cards).toEqual([]);
  });

  it("should load more when pagination allows", async () => {
    const initialCards = [{ id: "1" }];
    const moreCards = [{ id: "2" }, { id: "3" }];
    const initialPagination = {
      page: 1,
      pageSize: 20,
      total: 3,
      hasMore: true,
    };
    const nextPagination = { page: 2, pageSize: 20, total: 3, hasMore: false };

    // First search
    extractCards.mockReturnValueOnce(initialCards);
    extractPagination.mockReturnValueOnce(initialPagination);
    searchCards.mockResolvedValueOnce({ data: initialCards });

    const { result } = renderHook(() => useCardSearch());

    act(() => {
      result.current.search({ name: "char" }, { debounceMs: 0 });
    });

    await waitFor(() => expect(result.current.cards).toEqual(initialCards));
    await waitFor(() =>
      expect(result.current.pagination).toEqual(initialPagination),
    );

    // Load more mocks
    extractCards.mockReturnValueOnce(moreCards);
    extractPagination.mockReturnValueOnce(nextPagination);
    searchCards.mockResolvedValueOnce({ data: moreCards });

    act(() => {
      result.current.loadMore();
    });

    await waitFor(() =>
      expect(result.current.cards).toEqual([...initialCards, ...moreCards]),
    );
    await waitFor(() =>
      expect(result.current.pagination).toEqual(nextPagination),
    );
  });

  it("should not load more if already loading or no more pages", async () => {
    searchCards.mockResolvedValue({ data: [] });
    const { result } = renderHook(() => useCardSearch());

    // Manually set hasMore to false – this can be done by mocking pagination
    act(() => {
      // We'll override pagination via a search that sets it
      extractPagination.mockReturnValue({
        page: 1,
        pageSize: 20,
        total: 0,
        hasMore: false,
      });
    });

    act(() => {
      result.current.loadMore();
    });

    expect(searchCards).not.toHaveBeenCalled();
  });

  it("should clear previous debounce on rapid search calls", () => {
    jest.useFakeTimers();
    const { result } = renderHook(() => useCardSearch());

    act(() => {
      result.current.search({ name: "a" }, { debounceMs: 300 });
    });

    act(() => {
      result.current.search({ name: "ab" }, { debounceMs: 300 });
    });

    // Fast-forward timers
    act(() => {
      jest.advanceTimersByTime(300);
    });

    // Only the last call should have been made
    expect(searchCards).toHaveBeenCalledTimes(1);
    expect(searchCards).toHaveBeenCalledWith({ name: "ab" });

    jest.useRealTimers();
  });
});
