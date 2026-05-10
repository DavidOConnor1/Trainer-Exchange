"use client";

import Image from "next/image";
import { getCardImage } from "../../../../lib/pokemonApi/searchService";

export default function PriceModal({
  card,
  direction,
  onTradeIn,
  onTradeOut,
  onClose,
}) {
  if (!card) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 rounded-lg p-6 max-w-sm w-full">
        <div className="flex items-center gap-4 mb-4">
          {getCardImage(card, "small") && (
            <Image
              src={getCardImage(card, "small")}
              alt={card.name}
              width={60}
              height={84}
              className="object-contain"
            />
          )}
          <div>
            <h3 className="text-white font-semibold">{card.name}</h3>
            <p className="text-gray-400 text-sm">{card.set?.name}</p>
          </div>
        </div>

        {direction === "in" ? (
          <div className="space-y-3">
            <p className="text-gray-300 text-sm">Choose payment method:</p>
            <button
              onClick={() => onTradeIn(0.8)}
              className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Trade‑in (80% trend)
            </button>
            <button
              onClick={() => onTradeIn(0.7)}
              className="w-full py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Cash (70% trend)
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-gray-300 text-sm">Add with full trend price:</p>
            <button
              onClick={onTradeOut}
              className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Add (100% trend)
            </button>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full mt-3 py-2 bg-gray-700 text-gray-300 rounded hover:bg-gray-600"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
