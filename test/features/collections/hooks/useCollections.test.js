import { renderHook, act } from "@testing-library/react";
import { useCollections } from "../../../../src/features/collections/hooks/useCollections";
import { useAuth } from "../../../../src/features/auth/hooks/useAuth";
import useCollectionStore from "../../../../stores/collectionStore";

// Mock useAuth
jest.mock("../../../../src/features/auth/hooks/useAuth", () => ({
  useAuth: jest.fn(),
}));

// Mock the store
jest.mock("../../../../stores/collectionStore", () => ({
  __esModule: true,
  default: jest.fn(),
}));

describe("useCollections", () => {
  const mockUser = { id: "user-1" };
  const mockStore = {
    collections: [{ id: "col-1", name: "Test" }],
    loading: false,
    error: null,
    initialized: true,
    fetchCollections: jest.fn(),
    createCollection: jest.fn(),
    updateCollection: jest.fn(),
    deleteCollection: jest.fn(),
    clearCollections: jest.fn(),
    getCollectionById: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useAuth.mockReturnValue({ user: mockUser });
    useCollectionStore.mockReturnValue(mockStore);
    window.confirm = jest.fn(() => true);
  });

  it("should fetch collections when user is present", () => {
    renderHook(() => useCollections());
    expect(mockStore.fetchCollections).toHaveBeenCalledWith("user-1");
  });

  it("should clear collections when user is null", () => {
    useAuth.mockReturnValue({ user: null });
    renderHook(() => useCollections());
    expect(mockStore.clearCollections).toHaveBeenCalled();
  });

  it("should call createCollection with correct parameters", async () => {
    mockStore.createCollection.mockResolvedValue({ id: "new-col" });
    const { result } = renderHook(() => useCollections());

    let created;
    await act(async () => {
      created = await result.current.createCollection("My Collection", "desc");
    });

    expect(created).toEqual({ id: "new-col" });
    expect(mockStore.createCollection).toHaveBeenCalledWith(
      "user-1",
      "My Collection",
      "desc",
    );
  });

  it("should call deleteCollection after confirmation", async () => {
    const { result } = renderHook(() => useCollections());
    await act(async () => {
      await result.current.deleteCollection("col-1");
    });
    expect(window.confirm).toHaveBeenCalled();
    expect(mockStore.deleteCollection).toHaveBeenCalledWith("col-1", "user-1");
  });

  it("should not delete if user cancels confirmation", async () => {
    window.confirm = jest.fn(() => false);
    const { result } = renderHook(() => useCollections());
    await act(async () => {
      await result.current.deleteCollection("col-1");
    });
    expect(mockStore.deleteCollection).not.toHaveBeenCalled();
  });
});
