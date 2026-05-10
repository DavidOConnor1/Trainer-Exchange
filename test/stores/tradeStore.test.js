import { act } from "@testing-library/react";
import { supabase } from "lib/supabase/api";

// Mock persist middleware
jest.mock("zustand/middleware", () => ({
  persist: (config) => (set, get, api) => config(set, get, api),
}));

// Mock securityService
jest.mock("../../lib/security", () => ({
  sanitizeText: jest.fn((input) => input?.trim() || ""),
}));

// Mock convertEventToCollection helper
jest.mock("../../lib/trade/convertEventToCollection", () => ({
  convertEventToCollection: jest.fn(),
}));

const {
  convertEventToCollection,
} = require("../../lib/trade/convertEventToCollection");

let useTradeStore;
beforeAll(() => {
  useTradeStore = require("../../stores/tradeStore").default;
});

describe("tradeStore", () => {
  beforeEach(() => {
    act(() =>
      useTradeStore.setState({
        events: [],
        sessions: [],
        loading: false,
        error: null,
        initialized: false,
      }),
    );
    jest.clearAllMocks();
  });

  it("should fetch events with includeExpired flag", async () => {
    const mockEvents = [{ id: "ev-1", name: "Event" }];
    const gteMock = jest
      .fn()
      .mockResolvedValue({ data: mockEvents, error: null });
    supabase.from.mockReturnValueOnce({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      gte: gteMock,
    });

    await act(async () => {
      await useTradeStore.getState().fetchEvents("user-1", false);
    });

    expect(useTradeStore.getState().events).toEqual(mockEvents);
    expect(gteMock).toHaveBeenCalledWith("expires_at", expect.any(String));
  });

  it("should create an event with sanitized name", async () => {
    const newEvent = { id: "ev-new", name: "Cleaned Name" };
    supabase.from.mockReturnValueOnce({
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: newEvent, error: null }),
    });

    await act(async () => {
      await useTradeStore
        .getState()
        .createEvent("user-1", "  My Event  ", "2026-05-10");
    });

    expect(useTradeStore.getState().events[0].id).toBe("ev-new");
    expect(useTradeStore.getState().events[0].name).toBe("Cleaned Name");
  });

  it("should find or create latest event", async () => {
    const existingEvent = { id: "ev-existing" };
    supabase.from.mockReturnValueOnce({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: existingEvent, error: null }),
    });

    const result = await act(async () => {
      return await useTradeStore.getState().findOrCreateLatestEvent("user-1");
    });
    expect(result).toEqual(existingEvent);
  });

  it("should create a trade session with items", async () => {
    const sessionData = { id: "sess-1" };
    supabase.from.mockReturnValueOnce({
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: sessionData, error: null }),
    });
    supabase.from.mockReturnValueOnce({
      insert: jest.fn().mockResolvedValue({ error: null }),
    });

    const items = [{ name: "Pikachu", trade_price: 10, direction: "in" }];
    await act(async () => {
      await useTradeStore
        .getState()
        .createTradeSession("ev-1", "Test Session", items);
    });

    expect(supabase.from).toHaveBeenCalledTimes(2);
  });

  it("should update event name", async () => {
    act(() =>
      useTradeStore.setState({ events: [{ id: "ev-1", name: "Old" }] }),
    );
    supabase.from.mockReturnValueOnce({
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest
        .fn()
        .mockResolvedValue({ data: { id: "ev-1", name: "New" }, error: null }),
    });

    await act(async () => {
      await useTradeStore.getState().updateEventName("ev-1", "  New  ");
    });

    expect(useTradeStore.getState().events[0].name).toBe("New");
  });

  it("should delete an event", async () => {
    act(() => useTradeStore.setState({ events: [{ id: "ev-1" }] }));
    supabase.from.mockReturnValueOnce({
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ error: null }),
    });

    await act(async () => {
      await useTradeStore.getState().deleteEvent("ev-1");
    });

    expect(useTradeStore.getState().events).toHaveLength(0);
  });

  it("should delete a trade item from a session", async () => {
    act(() =>
      useTradeStore.setState({
        sessions: [
          { id: "sess-1", trade_items: [{ id: "item-1" }, { id: "item-2" }] },
        ],
      }),
    );
    supabase.from.mockReturnValueOnce({
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ error: null }),
    });

    await act(async () => {
      await useTradeStore.getState().deleteTradeItem("sess-1", "item-1");
    });

    const session = useTradeStore.getState().sessions[0];
    expect(session.trade_items).toHaveLength(1);
    expect(session.trade_items[0].id).toBe("item-2");
  });

  it("should update a trade item", async () => {
    act(() =>
      useTradeStore.setState({
        sessions: [
          { id: "sess-1", trade_items: [{ id: "item-1", trade_price: 5 }] },
        ],
      }),
    );
    supabase.from.mockReturnValueOnce({
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { id: "item-1", trade_price: 10, quantity: 2 },
        error: null,
      }),
    });

    await act(async () => {
      await useTradeStore
        .getState()
        .updateTradeItem("sess-1", "item-1", { trade_price: 10, quantity: 2 });
    });

    const item = useTradeStore.getState().sessions[0].trade_items[0];
    expect(item.trade_price).toBe(10);
    expect(item.quantity).toBe(2);
  });

  it("should fetch sessions with their trade items", async () => {
    const mockSessions = [{ id: "sess-1", trade_items: [{ id: "item-1" }] }];
    supabase.from.mockReturnValueOnce({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: mockSessions, error: null }),
    });

    await act(async () => {
      await useTradeStore.getState().fetchSessions("ev-1");
    });

    expect(useTradeStore.getState().sessions).toEqual(mockSessions);
  });

  it("should create a session", async () => {
    const newSession = { id: "sess-new", trade_items: [] };
    supabase.from.mockReturnValueOnce({
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: newSession, error: null }),
    });

    await act(async () => {
      await useTradeStore.getState().createSession("ev-1", "My Session");
    });

    expect(useTradeStore.getState().sessions).toEqual([newSession]);
  });

  it("should delete a session", async () => {
    act(() =>
      useTradeStore.setState({
        sessions: [{ id: "sess-1" }, { id: "sess-2" }],
      }),
    );
    supabase.from.mockReturnValueOnce({
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ error: null }),
    });

    await act(async () => {
      await useTradeStore.getState().deleteSession("ev-1", "sess-1");
    });

    expect(useTradeStore.getState().sessions).toHaveLength(1);
    expect(useTradeStore.getState().sessions[0].id).toBe("sess-2");
  });

  it("should convert event to collection", async () => {
    act(() =>
      useTradeStore.setState({
        events: [{ id: "ev-1", converted_to_collection: false }],
      }),
    );
    convertEventToCollection.mockResolvedValue({ id: "coll-1" });

    await act(async () => {
      await useTradeStore
        .getState()
        .convertEventToCollection("ev-1", "My Collection", "user-1");
    });

    expect(convertEventToCollection).toHaveBeenCalledWith(
      "ev-1",
      "My Collection",
      "user-1",
    );
    expect(useTradeStore.getState().events[0].converted_to_collection).toBe(
      true,
    );
  });

  it("should clear sessions", () => {
    act(() =>
      useTradeStore.setState({
        sessions: [{ id: "sess-1" }],
        currentEventId: "ev-1",
      }),
    );
    act(() => useTradeStore.getState().clearSessions());
    expect(useTradeStore.getState().sessions).toEqual([]);
    expect(useTradeStore.getState().currentEventId).toBeNull();
  });
});
