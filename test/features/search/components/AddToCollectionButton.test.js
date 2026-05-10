import "@testing-library/jest-dom";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AddToCollectionButton from "../../../../src/features/search/components/AddToCollectionButton";
import { useCollections } from "../../../../src/features/collections/hooks/useCollectionStore";
import { supabase } from "../../../../lib/supabase/api";

jest.mock(
  "../../../../src/features/collections/hooks/useCollectionStore",
  () => ({
    useCollections: jest.fn(),
  }),
);

describe("AddToCollectionButton", () => {
  const card = {
    id: "base1-58",
    name: "Pikachu",
    types: ["Electric"],
    set: { name: "Base Set" },
    images: { small: "https://img.com/small.png" },
  };
  const pricing = { trend: 10.5, avg30: 9.0 };

  beforeEach(() => {
    jest.clearAllMocks();
    useCollections.mockReturnValue({
      collections: [
        { id: "col-1", name: "Favorites" },
        { id: "col-2", name: "Trade Bait" },
      ],
      createCollection: jest.fn().mockResolvedValue({ id: "new-col" }),
    });
  });

  it("renders the add button", () => {
    render(<AddToCollectionButton card={card} pricing={pricing} />);
    expect(screen.getByText("+ Add to Collection")).toBeInTheDocument();
  });

  it("opens modal on button click", () => {
    render(<AddToCollectionButton card={card} pricing={pricing} />);
    fireEvent.click(screen.getByText("+ Add to Collection"));
    expect(screen.getByText("Add to Collection")).toBeInTheDocument(); // modal header
  });

  it("shows collection dropdown when collections exist", () => {
    render(<AddToCollectionButton card={card} pricing={pricing} />);
    fireEvent.click(screen.getByText("+ Add to Collection"));
    expect(screen.getByText("Choose a collection")).toBeInTheDocument();
    expect(screen.getByText("Favorites")).toBeInTheDocument();
  });

  it("adds card to existing collection and shows success", async () => {
    supabase.from.mockReturnValueOnce({
      insert: jest.fn().mockResolvedValue({ error: null }),
    });
    render(<AddToCollectionButton card={card} pricing={pricing} />);
    fireEvent.click(screen.getByText("+ Add to Collection"));

    // Select a collection
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "col-1" },
    });
    fireEvent.click(screen.getByText("Add Card"));

    await waitFor(() => {
      expect(screen.getByText("✅ Added successfully!")).toBeInTheDocument();
    });
  });

  it("creates new collection and adds card", async () => {
    useCollections.mockReturnValue({
      collections: [], // no existing collections
      createCollection: jest.fn().mockResolvedValue({ id: "new-col" }),
    });
    supabase.from.mockReturnValueOnce({
      insert: jest.fn().mockResolvedValue({ error: null }),
    });

    render(<AddToCollectionButton card={card} pricing={pricing} />);
    fireEvent.click(screen.getByText("+ Add to Collection"));

    // Enter new collection name
    fireEvent.change(screen.getByPlaceholderText("Collection name"), {
      target: { value: "My Collection" },
    });
    fireEvent.click(screen.getByText("Add Card"));

    await waitFor(() => {
      expect(screen.getByText("✅ Added successfully!")).toBeInTheDocument();
    });
  });

  it("disables Add button when no selection and no name", () => {
    render(<AddToCollectionButton card={card} pricing={pricing} />);
    fireEvent.click(screen.getByText("+ Add to Collection"));
    const addButton = screen.getByText("Add Card");
    expect(addButton).toBeDisabled();
  });

  it("closes modal when clicking the backdrop", () => {
    render(<AddToCollectionButton card={card} pricing={pricing} />);
    fireEvent.click(screen.getByText("+ Add to Collection"));

    // The modal’s content has the class "bg-gray-900"; its parent is the backdrop overlay
    const content = screen
      .getByText("Add to Collection")
      .closest(".bg-gray-900");
    const backdrop = content.parentElement;
    fireEvent.click(backdrop);

    expect(screen.queryByText("Add to Collection")).not.toBeInTheDocument();
  });
});
