import "@testing-library/jest-dom";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import UserCollections from "../../../../src/features/collections/components/UserCollections";
import { useCollections } from "../../../../src/features/collections/hooks/useCollectionStore";
import { supabase } from "../../../../lib/supabase/api";

// Mock the hook that the component actually imports ----------
jest.mock(
  "../../../../src/features/collections/hooks/useCollectionStore",
  () => ({
    useCollections: jest.fn(),
  }),
);
// -----------------------------------------------------------

jest.mock("next/image", () => ({
  __esModule: true,
  default: (props) => <img {...props} />,
}));

const mockCollections = [
  {
    id: "col-1",
    name: "Favorites",
    description: "My favorite cards",
    created_at: new Date().toISOString(),
    isTemp: false,
  },
  {
    id: "col-2",
    name: "Trade Bait",
    description: null,
    created_at: new Date().toISOString(),
    isTemp: false,
  },
];

const mockStats = {
  "col-1": { card_count: 5, total_value: 100 },
  "col-2": { card_count: 2, total_value: 25 },
};

describe("UserCollections", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock: authenticated user with collections
    useCollections.mockReturnValue({
      collections: mockCollections,
      loading: false,
      error: null,
      createCollection: jest.fn().mockResolvedValue({ id: "new-col" }),
      deleteCollection: jest.fn().mockResolvedValue(),
      refreshCollections: jest.fn(),
    });

    // Mock supabase.from('cards') for stats
    supabase.from.mockImplementation((table) => {
      if (table === "cards") {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn((_field, collectionId) => {
            const stat = mockStats[collectionId] || {
              card_count: 0,
              total_value: 0,
            };
            // Return the data directly (not a Promise) because the component uses await
            return {
              data: Array(stat.card_count).fill({
                price: stat.total_value / stat.card_count,
                quantity: 1,
              }),
              error: null,
            };
          }),
        };
      }
      return {};
    });
  });

  it("renders the stats cards", async () => {
    render(<UserCollections />);
    await waitFor(() => {
      expect(screen.getByText("2")).toBeInTheDocument();
    });
    // Wait for the total value to load (it's async)
    await waitFor(() => {
      expect(screen.getByText("€125.00")).toBeInTheDocument();
    });
  });

  it("displays loading state for collections", () => {
    useCollections.mockReturnValue({
      loading: true,
      collections: [],
    });
    render(<UserCollections />);
    expect(screen.getByText("Loading collections...")).toBeInTheDocument();
  });

  it("displays error state", () => {
    useCollections.mockReturnValue({
      collections: [],
      loading: false,
      error: "Failed to load",
    });
    render(<UserCollections />);
    expect(screen.getByText("Error: Failed to load")).toBeInTheDocument();
  });

  it('opens create modal when "New Collection" button is clicked', async () => {
    render(<UserCollections />);
    await waitFor(() =>
      expect(
        screen.queryByText("Loading collections..."),
      ).not.toBeInTheDocument(),
    );
    // "New Collection" button appears when collections.length > 0
    const addButton = screen.getByRole("button", { name: /new collection/i });
    fireEvent.click(addButton);
    expect(screen.getByText("Create New Collection")).toBeInTheDocument();
  });

  it("creates a new collection from the modal", async () => {
    const createCollection = jest.fn().mockResolvedValue({});
    useCollections.mockReturnValue({
      ...useCollections(),
      createCollection,
    });
    render(<UserCollections />);
    await waitFor(() =>
      expect(
        screen.queryByText("Loading collections..."),
      ).not.toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole("button", { name: /new collection/i }));
    fireEvent.change(screen.getByPlaceholderText("Collection name *"), {
      target: { value: "New" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create" }));
    expect(createCollection).toHaveBeenCalledWith("New", null);
  });

  it("opens delete modal and confirms deletion", async () => {
    const deleteCollection = jest.fn().mockResolvedValue();
    useCollections.mockReturnValue({
      ...useCollections(),
      deleteCollection,
    });
    render(<UserCollections />);
    await waitFor(() =>
      expect(
        screen.queryByText("Loading collections..."),
      ).not.toBeInTheDocument(),
    );
    // The delete button has aria-label="Delete collection"
    const deleteButtons = screen.getAllByRole("button", {
      name: /delete collection/i,
    });
    fireEvent.click(deleteButtons[0]);
    expect(
      screen.getByText(/Are you sure you want to delete/),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Delete Collection" }));
    expect(deleteCollection).toHaveBeenCalledWith("col-1");
  });

  it("cancels deletion", async () => {
    const deleteCollection = jest.fn();
    useCollections.mockReturnValue({
      ...useCollections(),
      deleteCollection,
    });
    render(<UserCollections />);
    await waitFor(() =>
      expect(
        screen.queryByText("Loading collections..."),
      ).not.toBeInTheDocument(),
    );
    const deleteButtons = screen.getAllByRole("button", {
      name: /delete collection/i,
    });
    fireEvent.click(deleteButtons[0]);
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(deleteCollection).not.toHaveBeenCalled();
  });
});
