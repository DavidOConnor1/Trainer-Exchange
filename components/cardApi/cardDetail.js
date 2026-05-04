// components/cardApi/CardDetail.js
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { getCardImage, formatPrice } from "../../lib/pokemonApi/searchService";

export default function CardDetail({ card, onClose }) {
  const [pricing, setPricing] = useState(null);
  const [loadingPricing, setLoadingPricing] = useState(false);

  useEffect(() => {
    if (!card) return;

    const fetchPricing = async () => {
      setLoadingPricing(true);
      try {
        const backendUrl =
          process.env.NEXT_PUBLIC_BACKEND_URL ||
          "https://prolific-heart.up.railway.app";
        const res = await fetch(
          `${backendUrl}/api/cards/id/${card.id}/pricing`,
        );
        const data = await res.json();
        setPricing(data.pricing);
      } catch (error) {
        console.error("Failed to fetch pricing:", error);
      } finally {
        setLoadingPricing(false);
      }
    };

    fetchPricing();
  }, [card]);

  if (!card) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-2xl font-bold text-white">{card.name}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-2xl"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card Image */}
            <div className="relative aspect-[2.5/3.5] bg-gray-800 rounded-lg">
              {getCardImage(card, "large") ? (
                <Image
                  src={getCardImage(card, "large")}
                  alt={card.name}
                  fill
                  className="object-contain p-4"
                  sizes="400px"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-600">
                  <span className="text-6xl">🃏</span>
                </div>
              )}
            </div>

            {/* Details & Pricing */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">
                  Card Details
                </h3>
                <div className="space-y-2 text-sm">
                  {card.set?.name && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Set</span>
                      <span className="text-white">{card.set.name}</span>
                    </div>
                  )}
                  {card.set?.series && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Series</span>
                      <span className="text-white">{card.set.series}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-400">Card Number</span>
                    <span className="text-white">#{card.localId}</span>
                  </div>
                  {card.rarity && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Rarity</span>
                      <span className="text-white">{card.rarity}</span>
                    </div>
                  )}
                  {card.hp && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">HP</span>
                      <span className="text-white">{card.hp}</span>
                    </div>
                  )}
                  {card.types?.length > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Types</span>
                      <div className="flex gap-1">
                        {card.types.map((type) => (
                          <span
                            key={type}
                            className="px-2 py-0.5 bg-gray-700 text-gray-300 text-xs rounded-full"
                          >
                            {type}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {card.stage && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Stage</span>
                      <span className="text-white">{card.stage}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Cardmarket Pricing */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">
                  Cardmarket Pricing
                </h3>
                {loadingPricing ? (
                  <div className="space-y-2 animate-pulse">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className="h-4 bg-gray-700 rounded w-3/4 mx-auto"
                      />
                    ))}
                  </div>
                ) : pricing && (pricing.avg30 || pricing.trend) ? (
                  <div className="space-y-2 text-sm">
                    {pricing.avg30 && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">30-Day Avg</span>
                        <span className="text-green-400 font-semibold">
                          €{formatPrice(pricing.avg30)}
                        </span>
                      </div>
                    )}
                    {pricing.trend && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Trend Price</span>
                        <span className="text-blue-400 font-semibold">
                          €{formatPrice(pricing.trend)}
                        </span>
                      </div>
                    )}
                    {pricing.avg1 && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">1-Day Avg</span>
                        <span className="text-white">
                          €{formatPrice(pricing.avg1)}
                        </span>
                      </div>
                    )}
                    {pricing.avg7 && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">7-Day Avg</span>
                        <span className="text-white">
                          €{formatPrice(pricing.avg7)}
                        </span>
                      </div>
                    )}
                    {pricing.low && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Lowest</span>
                        <span className="text-white">
                          €{formatPrice(pricing.low)}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">
                    No pricing data available
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-700">
            <p className="text-gray-500 text-xs font-mono">ID: {card.id}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
