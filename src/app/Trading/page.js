"use client";

import { useTradeSession } from "../../../hooks/v2/useTradeSession";
import TradeColumn from "../../../components/trades/TradeColumn";
import PriceModal from "../../../components/trades/PriceModal";
import TradeSummary from "../../../components/trades/TradeSummary";
import CollectionTradeModal from "../../../components/trades/CollectionTradeModal";

export default function TradingPage() {
  const {
    showCollectionModal,
    openCollectionModal,
    closeCollectionModal,
    addCardFromCollection,
    tradeInItems,
    tradeOutItems,
    searchTerm,
    selectedDirection,
    searchResults,
    searching,
    selectedCard,
    completing,
    successMessage,
    totalIn,
    totalOut,
    profit,
    setSelectedDirection,
    handleSearch,
    openPriceModal,
    handleTradeIn,
    handleTradeOut,
    setSelectedCard,
    updateItem,
    removeItem,
    handleCompleteTrade,
  } = useTradeSession();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6">Trading</h1>

        {successMessage && (
          <div className="mb-4 p-3 bg-green-900/50 border border-green-700 rounded text-green-400">
            {successMessage}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TradeColumn
            title="Traded In"
            items={tradeInItems}
            direction="in"
            selectedDirection={selectedDirection}
            onDirectionChange={setSelectedDirection}
            searchTerm={searchTerm}
            onSearch={handleSearch}
            searchResults={searchResults}
            searching={searching}
            onCardClick={openPriceModal}
            onUpdateItem={(i, f, v) => updateItem("in", i, f, v)}
            onRemoveItem={(i) => removeItem("in", i)}
            bgColor="bg-green-900/30"
            borderColor="border-green-700"
          />
          <TradeColumn
            title="Traded Out"
            items={tradeOutItems}
            direction="out"
            selectedDirection={selectedDirection}
            onDirectionChange={setSelectedDirection}
            searchTerm={searchTerm}
            onSearch={handleSearch}
            searchResults={searchResults}
            searching={searching}
            onCardClick={openPriceModal}
            onUpdateItem={(i, f, v) => updateItem("out", i, f, v)}
            onRemoveItem={(i) => removeItem("out", i)}
            bgColor="bg-red-900/30"
            borderColor="border-red-700"
            onAddFromCollection={openCollectionModal}
          />
        </div>

        <TradeSummary
          totalIn={totalIn}
          totalOut={totalOut}
          profit={profit}
          onComplete={handleCompleteTrade}
          completing={completing}
        />

        {selectedCard && (
          <PriceModal
            card={selectedCard}
            direction={selectedDirection}
            onTradeIn={handleTradeIn}
            onTradeOut={handleTradeOut}
            onClose={() => setSelectedCard(null)}
          />
        )}

        {showCollectionModal && (
          <CollectionTradeModal
            onClose={closeCollectionModal}
            onSelectCard={addCardFromCollection}
          />
        )}
      </div>
    </div>
  );
}
