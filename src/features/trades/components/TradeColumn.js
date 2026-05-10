"use client";

import Image from "next/image";
import { getCardImage } from "../../../../lib/pokemonApi/searchService";

export default function TradeColumn({
  title,
  items,
  direction,
  selectedDirection,
  onDirectionChange,
  searchTerm,
  onSearch,
  searchResults,
  searching,
  onCardClick,
  onUpdateItem,
  onRemoveItem,
  bgColor,
  borderColor,
  onAddFromCollection,
}) {
  return (
    <div className={`${bgColor} ${borderColor} border rounded-lg p-4`}>
      <h2 className="text-xl font-semibold text-white mb-4">{title}</h2>

      {/* Add from Collection button (only if function provided) */}
      {onAddFromCollection && (
        <button
          onClick={onAddFromCollection}
          className="mb-4 px-4 py-2 bg-purple-600 text-white text-sm rounded hover:bg-purple-700"
        >
          Add from Collection
        </button>
      )}

      {/* Search */}
      <div className="mb-4">
        <div className="flex gap-2 mb-2">
          <button
            onClick={() => onDirectionChange(direction)}
            className={`px-2 py-1 text-xs rounded ${
              selectedDirection === direction
                ? "bg-blue-600 text-white"
                : "bg-gray-700 text-gray-300"
            }`}
          >
            Add to {direction === "in" ? "In" : "Out"}
          </button>
        </div>
        <input
          type="text"
          value={selectedDirection === direction ? searchTerm : ""}
          onChange={onSearch}
          onFocus={() => onDirectionChange(direction)}
          placeholder="Search Pokémon by name..."
          className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white placeholder-gray-500"
        />
        {selectedDirection === direction && searching && (
          <p className="text-gray-400 text-sm mt-1">Searching...</p>
        )}
        {selectedDirection === direction && searchResults.length > 0 && (
          <div className="mt-2 max-h-48 overflow-y-auto space-y-1">
            {searchResults.map((card) => (
              <div
                key={card.id}
                className="flex items-center gap-2 p-2 bg-gray-700 rounded hover:bg-gray-600 cursor-pointer"
                onClick={() => onCardClick(card)}
              >
                {getCardImage(card, "small") && (
                  <Image
                    src={getCardImage(card, "small")}
                    alt={card.name}
                    width={40}
                    height={56}
                    className="object-contain"
                  />
                )}
                <div>
                  <p className="text-white text-sm">{card.name}</p>
                  <p className="text-gray-400 text-xs">{card.set?.name}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Items list */}
      <div className="space-y-3">
        {items.length === 0 ? (
          <p className="text-gray-500 text-sm">No cards yet</p>
        ) : (
          items.map((item, index) => (
            <div
              key={index}
              className="bg-gray-800 rounded p-3 flex items-center gap-3"
            >
              {item.image_url && item.image_url.startsWith("https://") && (
                <Image
                  src={item.image_url}
                  alt={item.name}
                  width={48}
                  height={67}
                  className="object-contain"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm truncate">{item.name}</p>
                <p className="text-gray-400 text-xs truncate">
                  {item.set_name}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <label className="text-gray-500 text-xs">Price €</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={item.trade_price}
                    onChange={(e) =>
                      onUpdateItem(
                        index,
                        "trade_price",
                        parseFloat(e.target.value) || 0,
                      )
                    }
                    className="w-20 px-2 py-0.5 bg-gray-900 border border-gray-600 rounded text-white text-xs"
                  />
                  <label className="text-gray-500 text-xs">Qty</label>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) =>
                      onUpdateItem(
                        index,
                        "quantity",
                        parseInt(e.target.value) || 1,
                      )
                    }
                    className="w-16 px-2 py-0.5 bg-gray-900 border border-gray-600 rounded text-white text-xs"
                  />
                </div>
              </div>
              <button
                onClick={() => {
                  if (confirm("Remove this card from the trade?")) {
                    onRemoveItem(index);
                  }
                }}
                className="text-red-400 hover:text-red-300 text-sm"
              >
                ✕
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
