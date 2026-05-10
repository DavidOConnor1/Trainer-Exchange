import { renderHook, act, waitFor } from "@testing-library/react";
import { useTrades } from "../../../../src/features/trades/hooks/useTrades";
import { useAuth } from "../../../../src/features/auth/hooks/useAuth";
import useTradeStore from "../../../../stores/tradeStore";
import securityService from "../../../../lib/security";

// Mock dependencies
jest.mock("../../../../src/features/auth/hooks/useAuth", () => ({
  useAuth: jest.fn(),
}));
jest.mock("../../../../stores/tradeStore", () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock("../../../../lib/security", () => ({
  sanitizeText: jest.fn((input) => input?.trim() || ""),
}));

describe("useTrades", () => {
  // Sample user
  const mockUser = { id: "user-1" };

  // Mock store functions
  const mockStore = {
    events: [],
    loading: false,
    error: null,
    initialized: true,
    fetchEvents: jest.fn(),
    createEvent: jest.fn(),
    updateEventName: jest.fn(),
    deleteEvent: jest.fn(),
    findOrCreateLatestEvent: jest.fn(),
    sessions: [],
    sessionsLoading: false,
    sessionsError: null,
    fetchSessions: jest.fn(),
    createSession: jest.fn(),
    deleteSession: jest.fn(),
    createTradeSession: jest.fn(),
    clearSessions: jest.fn(),
    updateTradeItem: jest.fn(),
    deleteTradeItem: jest.fn(),
    convertEventToCollection: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useAuth.mockReturnValue({ user: mockUser });
    useTradeStore.mockReturnValue(mockStore);
  });

  it("should call fetchEvents when user is present", () => {
    renderHook(() => useTrades());
    expect(mockStore.fetchEvents).toHaveBeenCalledWith("user-1");
  });

  it("should not call fetchEvents when user is null", () => {
    useAuth.mockReturnValue({ user: null });
    renderHook(() => useTrades());
    expect(mockStore.fetchEvents).not.toHaveBeenCalled();
  });

  it("should wrap createEvent and sanitize the name", async () => {
    mockStore.createEvent.mockResolvedValue({ id: "new-event" });
    const { result } = renderHook(() => useTrades());

    let createdEvent;
    await act(async () => {
      createdEvent = await result.current.createEvent(
        "  My Event  ",
        "2026-05-10",
      );
    });

    expect(securityService.sanitizeText).toHaveBeenCalledWith(
      "  My Event  ",
      100,
    );
    expect(mockStore.createEvent).toHaveBeenCalledWith(
      "user-1",
      "My Event",
      "2026-05-10",
    );
    expect(createdEvent).toEqual({ id: "new-event" });
  });

  it("should throw error on empty event name", async () => {
    securityService.sanitizeText.mockReturnValueOnce("");
    const { result } = renderHook(() => useTrades());

    await expect(result.current.createEvent("", "2026-05-10")).rejects.toThrow(
      "Event name is required",
    );
  });

  it("should throw if not authenticated during createEvent", async () => {
    useAuth.mockReturnValue({ user: null });
    const { result } = renderHook(() => useTrades());

    await expect(
      result.current.createEvent("Name", "2026-05-10"),
    ).rejects.toThrow("Not authenticated");
  });

  it("should call deleteEvent from store", async () => {
    const { result } = renderHook(() => useTrades());
    await act(async () => {
      await result.current.deleteEvent("ev-1");
    });
    expect(mockStore.deleteEvent).toHaveBeenCalledWith("ev-1");
  });

  it("should call updateEventName", async () => {
    const { result } = renderHook(() => useTrades());
    await act(async () => {
      await result.current.updateEventName("ev-1", "New Name");
    });
    expect(mockStore.updateEventName).toHaveBeenCalledWith("ev-1", "New Name");
  });

  it("should wrap fetchSessions", async () => {
    const { result } = renderHook(() => useTrades());
    await act(async () => {
      await result.current.fetchSessions("ev-1");
    });
    expect(mockStore.fetchSessions).toHaveBeenCalledWith("ev-1");
  });

  it("should wrap createSession with authentication check", async () => {
    mockStore.createSession.mockResolvedValue({ id: "sess-1" });
    const { result } = renderHook(() => useTrades());

    await act(async () => {
      await result.current.createSession("ev-1", "My Session");
    });
    expect(mockStore.createSession).toHaveBeenCalledWith("ev-1", "My Session");
  });

  it("should throw on createSession when not authenticated", async () => {
    useAuth.mockReturnValue({ user: null });
    const { result } = renderHook(() => useTrades());

    await expect(result.current.createSession("ev-1", "Name")).rejects.toThrow(
      "Not authenticated",
    );
  });

  it("should wrap deleteSession", async () => {
    const { result } = renderHook(() => useTrades());
    await act(async () => {
      await result.current.deleteSession("ev-1", "sess-1");
    });
    expect(mockStore.deleteSession).toHaveBeenCalledWith("ev-1", "sess-1");
  });

  it("should wrap createTradeSession", async () => {
    const items = [{ name: "Pikachu", trade_price: 10 }];
    mockStore.createTradeSession.mockResolvedValue({ id: "sess-2" });
    const { result } = renderHook(() => useTrades());

    await act(async () => {
      await result.current.createTradeSession("ev-1", null, items);
    });
    expect(mockStore.createTradeSession).toHaveBeenCalledWith(
      "ev-1",
      null,
      items,
    );
  });

  it("should wrap updateTradeItem", async () => {
    const { result } = renderHook(() => useTrades());
    await act(async () => {
      await result.current.updateTradeItem("sess-1", "item-1", {
        trade_price: 5,
      });
    });
    expect(mockStore.updateTradeItem).toHaveBeenCalledWith("sess-1", "item-1", {
      trade_price: 5,
    });
  });

  it("should wrap deleteTradeItem", async () => {
    const { result } = renderHook(() => useTrades());
    await act(async () => {
      await result.current.deleteTradeItem("sess-1", "item-1");
    });
    expect(mockStore.deleteTradeItem).toHaveBeenCalledWith("sess-1", "item-1");
  });

  it("should wrap convertToCollection with authentication", async () => {
    mockStore.convertEventToCollection.mockResolvedValue({ id: "coll-1" });
    const { result } = renderHook(() => useTrades());

    await act(async () => {
      await result.current.convertToCollection("ev-1", "My Collection");
    });
    expect(mockStore.convertEventToCollection).toHaveBeenCalledWith(
      "ev-1",
      "My Collection",
      "user-1",
    );
  });

  it("should throw on convertToCollection when not authenticated", async () => {
    useAuth.mockReturnValue({ user: null });
    const { result } = renderHook(() => useTrades());

    await expect(
      result.current.convertToCollection("ev-1", "Name"),
    ).rejects.toThrow("Not authenticated");
  });

  it("should expose fetchEvents that calls store with userId and optional includeExpired", async () => {
    const { result } = renderHook(() => useTrades());
    await act(async () => {
      await result.current.fetchEvents(true);
    });
    expect(mockStore.fetchEvents).toHaveBeenCalledWith("user-1", true);
  });
});
