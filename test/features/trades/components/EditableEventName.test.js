import "@testing-library/jest-dom";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import EditableEventName from "../../../../src/features/trades/components/EditableEventName";
import { useTrades } from "../../../../src/features/trades/hooks/useTrades";

jest.mock("../../../../src/features/trades/hooks/useTrades", () => ({
  useTrades: jest.fn(),
}));

describe("EditableEventName", () => {
  const event = {
    id: "ev-1",
    name: "Test Event",
  };

  const mockUpdateEventName = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useTrades.mockReturnValue({
      updateEventName: mockUpdateEventName,
    });
  });

  it("renders the event name and an edit icon", () => {
    render(<EditableEventName event={event} />);
    expect(screen.getByText("Test Event ✎")).toBeInTheDocument();
  });

  it("enters editing mode on click", () => {
    render(<EditableEventName event={event} />);
    fireEvent.click(screen.getByText("Test Event ✎"));
    // An input field should appear
    expect(screen.getByDisplayValue("Test Event")).toBeInTheDocument();
  });

  it("calls updateEventName on blur when the name has changed", async () => {
    mockUpdateEventName.mockResolvedValue({});
    render(<EditableEventName event={event} />);
    fireEvent.click(screen.getByText("Test Event ✎"));

    const input = screen.getByDisplayValue("Test Event");
    fireEvent.change(input, { target: { value: "New Name" } });
    fireEvent.blur(input);

    // The update function should have been called
    expect(mockUpdateEventName).toHaveBeenCalledWith("ev-1", "New Name");

    // The input should disappear (back to display mode)
    await waitFor(() => {
      expect(screen.queryByDisplayValue("New Name")).not.toBeInTheDocument();
    });

    // The original event name is still shown because the parent didn't update the prop,
    // but the key behaviour is that editing mode ended and the store was updated.
    expect(screen.getByText("Test Event ✎")).toBeInTheDocument();
  });

  it("does not call updateEventName if name unchanged", () => {
    render(<EditableEventName event={event} />);
    fireEvent.click(screen.getByText("Test Event ✎"));
    const input = screen.getByDisplayValue("Test Event");
    fireEvent.blur(input);
    expect(mockUpdateEventName).not.toHaveBeenCalled();
  });

  it("reverts to original name on Escape", () => {
    render(<EditableEventName event={event} />);
    fireEvent.click(screen.getByText("Test Event ✎"));
    const input = screen.getByDisplayValue("Test Event");
    fireEvent.change(input, { target: { value: "Changed" } });
    fireEvent.keyDown(input, { key: "Escape" });
    expect(screen.getByText("Test Event ✎")).toBeInTheDocument();
    expect(mockUpdateEventName).not.toHaveBeenCalled();
  });

  it("reverts to original name when empty input is saved", () => {
    render(<EditableEventName event={event} />);
    fireEvent.click(screen.getByText("Test Event ✎"));
    const input = screen.getByDisplayValue("Test Event");
    fireEvent.change(input, { target: { value: "   " } });
    fireEvent.blur(input);
    // Should revert to the original name
    expect(screen.getByText("Test Event ✎")).toBeInTheDocument();
    expect(mockUpdateEventName).not.toHaveBeenCalled();
  });
});
