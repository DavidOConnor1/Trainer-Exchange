import { act } from "@testing-library/react";
import { supabase } from "../../lib/supabase/api";
// Mock persist middleware
jest.mock("zustand/middleware", () => ({
  persist: (config) => (set, get, api) => config(set, get, api),
}));

// Mock securityService – path is from test/stores/ to lib/security
jest.mock("../../lib/security", () => ({
  sanitizeText: jest.fn((input) => input?.trim() || ""),
  sanitizeDescription: jest.fn((input) => input?.trim() || ""),
  containsSuspiciousPatterns: jest.fn(() => false),
  makeDBSafe: jest.fn((s) => s),
}));

// We need supabase from the globally mocked lib/supabase/api
jest.mock("../../lib/supabase/api", () => ({
  supabase: {
    from: jest.fn(),
  },
}));

const { supabase } = require("../../lib/supabase/api");
const securityService = require("../../lib/security");

let useCollectionStore;
beforeAll(() => {
  useCollectionStore = require("../../stores/collectionStore").default;
});

describe("collectionStore", () => {
  beforeEach(() => {
    act(() => useCollectionStore.getState().reset());
    jest.clearAllMocks();
  });

  it("should fetch collections successfully", async () => {
    const mockCollections = [{ id: "col-1", name: "Test" }];
    supabase.from.mockReturnValueOnce({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest
        .fn()
        .mockResolvedValue({ data: mockCollections, error: null }),
    });

    await act(async () => {
      await useCollectionStore.getState().fetchCollections("user-1");
    });

    const state = useCollectionStore.getState();
    expect(state.collections).toEqual(mockCollections);
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
    expect(state.initialized).toBe(true);
    expect(state.lastFetched).toBeDefined();
    expect(supabase.from).toHaveBeenCalledWith("collections");
  });

  it("should handle fetch error", async () => {
    supabase.from.mockReturnValueOnce({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest
        .fn()
        .mockResolvedValue({ data: null, error: { message: "Error" } }),
    });

    await act(async () => {
      await useCollectionStore.getState().fetchCollections("user-1");
    });

    expect(useCollectionStore.getState().error).toBe("Error");
    expect(useCollectionStore.getState().loading).toBe(false);
  });

  it("should clear collections when no userId", async () => {
    await act(async () => {
      await useCollectionStore.getState().fetchCollections(null);
    });
    const state = useCollectionStore.getState();
    expect(state.collections).toEqual([]);
    expect(state.loading).toBe(false);
    expect(state.initialized).toBe(true);
  });

  it("should create a collection optimistically and then replace with real data", async () => {
    const newData = {
      id: "real-id",
      name: "Safe Name",
      description: "Safe Desc",
    };
    const insertChain = {
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: newData, error: null }),
    };
    supabase.from.mockReturnValueOnce({
      insert: jest.fn().mockReturnValue(insertChain),
    });

    await act(async () => {
      await useCollectionStore
        .getState()
        .createCollection("user-1", "  My Collection ", "  desc  ");
    });

    const state = useCollectionStore.getState();
    expect(state.collections[0].id).toBe("real-id");
    expect(state.collections[0].name).toBe("Safe Name");
    expect(state.collections[0].description).toBe("Safe Desc");
    expect(securityService.sanitizeText).toHaveBeenCalled();
    expect(securityService.sanitizeDescription).toHaveBeenCalled();
  });

  it("should throw error on empty collection name", async () => {
    await expect(
      act(() =>
        useCollectionStore.getState().createCollection("user-1", "", ""),
      ),
    ).rejects.toThrow("Collection name is required");
  });

  it("should update a collection optimistically and rollback on error", async () => {
    const originalCollections = [{ id: "col-1", name: "Old Name" }];
    act(() =>
      useCollectionStore.setState({ collections: originalCollections }),
    );

    supabase.from.mockReturnValueOnce({
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ error: { message: "Error" } }),
    });

    let thrownError;
    await act(async () => {
      try {
        await useCollectionStore
          .getState()
          .updateCollection("col-1", { name: "New Name" }, "user-1");
      } catch (err) {
        thrownError = err;
      }
    });

    expect(thrownError).toBeTruthy();
    expect(useCollectionStore.getState().collections[0].name).toBe("Old Name");
  });

  it("should delete a collection and its cards", async () => {
    const col = { id: "col-1", name: "Test" };
    act(() => useCollectionStore.setState({ collections: [col] }));

    // Cards deletion
    supabase.from.mockReturnValueOnce({
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ error: null }),
    });

    // Collection deletion – chainable eq
    let callCount = 0;
    const chainedEq = {
      eq: jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 2) {
          return Promise.resolve({ error: null });
        }
        return chainedEq;
      }),
    };
    supabase.from.mockReturnValueOnce({
      delete: jest.fn().mockReturnValue(chainedEq),
    });

    await act(async () => {
      await useCollectionStore.getState().deleteCollection("col-1", "user-1");
    });

    expect(useCollectionStore.getState().collections).toHaveLength(0);
  });
  it("should clear collections", () => {
    act(() =>
      useCollectionStore.setState({
        collections: [{ id: "c1" }],
        loading: true,
      }),
    );
    act(() => useCollectionStore.getState().clearCollections());
    expect(useCollectionStore.getState().collections).toEqual([]);
    expect(useCollectionStore.getState().loading).toBe(false);
  });
});
