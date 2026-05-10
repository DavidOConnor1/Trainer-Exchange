import "@testing-library/jest-dom";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import SaveToCollectionButton from "../../../../src/features/trades/components/SaveToCollectionButton";
import { useTrades } from "../../../../src/features/trades/hooks/useTrades";

// Mock the hook
jest.mock("../../../../src/features/trades/hooks/useTrades", () => ({
  useTrades: jest.fn(),
}));

describe("SaveToCollectionButton", () => {
  const event = {
    id: "event-1",
    converted_to_collection: false,
  };

  const mockConvertToCollection = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useTrades.mockReturnValue({
      convertToCollection: mockConvertToCollection,
    });
  });

  it("shows the save button when event is not converted", () => {
    render(<SaveToCollectionButton event={event} />);
    expect(screen.getByText("💾 Save as Collection")).toBeInTheDocument();
  });

  it("shows a badge when already converted", () => {
    render(
      <SaveToCollectionButton
        event={{ ...event, converted_to_collection: true }}
      />,
    );
    expect(screen.getByText("✓ Saved to collection")).toBeInTheDocument();
    expect(screen.queryByText("💾 Save as Collection")).not.toBeInTheDocument();
  });

  it("opens the modal when the button is clicked", () => {
    render(<SaveToCollectionButton event={event} />);
    fireEvent.click(screen.getByText("💾 Save as Collection"));
    expect(screen.getByText("Save to Collection")).toBeInTheDocument();
  });

  it("calls convertToCollection and closes modal on save", async () => {
    mockConvertToCollection.mockResolvedValue({});
    render(<SaveToCollectionButton event={event} />);
    fireEvent.click(screen.getByText("💾 Save as Collection"));

    // Fill in collection name
    fireEvent.change(screen.getByPlaceholderText("Collection name"), {
      target: { value: "My Collection" },
    });

    // Click Save
    fireEvent.click(screen.getByText("Save"));

    expect(mockConvertToCollection).toHaveBeenCalledWith(
      "event-1",
      "My Collection",
    );

    // After save, the modal should disappear
    await waitFor(() => {
      expect(screen.queryByText("Save to Collection")).not.toBeInTheDocument();
    });
  });

  it("disables the Save button when name is empty", () => {
    render(<SaveToCollectionButton event={event} />);
    fireEvent.click(screen.getByText("💾 Save as Collection"));
    const saveButton = screen.getByText("Save");
    expect(saveButton).toBeDisabled();

    fireEvent.change(screen.getByPlaceholderText("Collection name"), {
      target: { value: "  " },
    });
    expect(saveButton).toBeDisabled();
  });

  it("closes the modal when Cancel is clicked", () => {
    render(<SaveToCollectionButton event={event} />);
    fireEvent.click(screen.getByText("💾 Save as Collection"));
    fireEvent.click(screen.getByText("Cancel"));
    expect(screen.queryByText("Save to Collection")).not.toBeInTheDocument();
  });
});
