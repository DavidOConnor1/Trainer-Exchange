import "@testing-library/jest-dom";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import TradeSummary from "../../../../src/features/trades/components/TradeSummary";

describe("TradeSummary", () => {
  it("displays the totals and profit", () => {
    render(
      <TradeSummary
        totalIn={125.5}
        totalOut={80.0}
        profit={45.5}
        onComplete={jest.fn()}
        completing={false}
      />,
    );
    expect(screen.getByText("Total In")).toBeInTheDocument();
    expect(screen.getByText("€125.50")).toBeInTheDocument();
    expect(screen.getByText("Total Out")).toBeInTheDocument();
    expect(screen.getByText("€80.00")).toBeInTheDocument();
    expect(screen.getByText("Profit")).toBeInTheDocument();
    expect(screen.getByText("€45.50")).toBeInTheDocument();
  });

  it("shows negative profit in red", () => {
    render(
      <TradeSummary
        totalIn={50}
        totalOut={100}
        profit={-50}
        onComplete={jest.fn()}
        completing={false}
      />,
    );

    // Find the profit value by its container's label, then get the next element
    const profitLabel = screen.getByText("Profit");
    const profitValueElement =
      profitLabel.parentElement.querySelector("p:last-child");

    // The full text content (ignoring internal spans) should be "€-50.00"
    expect(profitValueElement).toHaveTextContent("€-50.00");

    // Check that it has the red class
    expect(profitValueElement.className).toContain("text-red-400");
  });

  it("calls onComplete when the button is clicked", () => {
    const onComplete = jest.fn();
    render(
      <TradeSummary
        totalIn={0}
        totalOut={0}
        profit={0}
        onComplete={onComplete}
        completing={false}
      />,
    );
    fireEvent.click(screen.getByText("Complete Trade"));
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("disables the button while completing", () => {
    const onComplete = jest.fn();
    render(
      <TradeSummary
        totalIn={0}
        totalOut={0}
        profit={0}
        onComplete={onComplete}
        completing={true}
      />,
    );
    const button = screen.getByText("Saving Trade...");
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(onComplete).not.toHaveBeenCalled();
  });
});
