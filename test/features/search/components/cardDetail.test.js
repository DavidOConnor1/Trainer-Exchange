import "@testing-library/jest-dom";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import CardDetail from "../../../../src/features/search/components/cardDetail";
import {
  getCardImage,
  formatPrice,
} from "../../../../lib/pokemonApi/searchService";

// Mock the child component AddToCollectionButton to simplify tests
jest.mock(
  "../../../../src/features/search/components/AddToCollectionButton",
  () => ({
    __esModule: true,
    default: ({ card, pricing }) => <div>MockAddToCollectionButton</div>,
  }),
);
jest.mock("../../../../lib/pokemonApi/searchService", () => ({
  getCardImage: jest.fn(),
  formatPrice: jest.fn(),
}));

// Mock fetch for pricing call
global.fetch = jest.fn();

describe("CardDetail", () => {
  const card = {
    id: "base1-58",
    name: "Pikachu",
    localId: "58",
    set: { name: "Base Set", series: "Base" },
    rarity: "Common",
    hp: 40,
    types: ["Electric"],
    stage: "Basic",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    getCardImage.mockReturnValue("https://img.com/large.png");
    formatPrice.mockReturnValue("10.50");
    fetch.mockResolvedValue({
      json: async () => ({
        pricing: {
          avg30: 9.0,
          trend: 10.5,
          avg1: 9.2,
          avg7: 8.8,
          low: 5.0,
        },
      }),
    });
  });

  it("renders card details and fetches pricing", async () => {
    render(<CardDetail card={card} onClose={jest.fn()} />);
    expect(screen.getByText("Pikachu")).toBeInTheDocument();
    expect(screen.getByText("Card Details")).toBeInTheDocument();

    // wait for the pricing to load – the heading "30-Day Avg" should appear
    await waitFor(() => {
      expect(screen.getByText("30-Day Avg")).toBeInTheDocument();
    });

    // The pricing values all show the same formatted price, so we just verify the Trend Price label exists
    expect(screen.getByText("Trend Price")).toBeInTheDocument();
  });

  it("shows no pricing data when fetch returns empty", async () => {
    fetch.mockResolvedValue({ json: async () => ({ pricing: null }) });
    render(<CardDetail card={card} onClose={jest.fn()} />);
    await waitFor(() => {
      expect(screen.getByText("No pricing data available")).toBeInTheDocument();
    });
  });

  it("closes modal when clicking the backdrop", () => {
    const onClose = jest.fn();
    render(<CardDetail card={card} onClose={onClose} />);

    // The overlay is the outermost div with class "fixed inset-0"
    const overlay = document.querySelector(".fixed.inset-0");
    fireEvent.click(overlay);

    // The component calls onClose when the overlay is clicked
    expect(onClose).toHaveBeenCalled();
  });

  it("renders the AddToCollectionButton", () => {
    render(<CardDetail card={card} onClose={jest.fn()} />);
    expect(screen.getByText("MockAddToCollectionButton")).toBeInTheDocument();
  });
});
