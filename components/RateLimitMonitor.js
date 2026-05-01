// components/RateLimitMonitor.js
"use client";

import { useEffect, useState } from "react";
import { pokemonApi } from "../lib/pokemonApi/client";

export default function RateLimitMonitor() {
  const [rateLimits, setRateLimits] = useState({
    globalRemaining: 100,
    searchRemaining: 30,
    resetTime: null,
  });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show in development
    if (process.env.NODE_ENV === "development") {
      setIsVisible(true);

      const interval = setInterval(() => {
        // Check if method exists before calling
        if (typeof pokemonApi.getRateLimitInfo === "function") {
          setRateLimits(pokemonApi.getRateLimitInfo());
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-gray-900 text-white p-3 rounded-lg shadow-lg text-xs font-mono opacity-75 hover:opacity-100 transition-opacity z-50">
      <div className="space-y-1">
        <div className="flex justify-between gap-4">
          <span>Global:</span>
          <span
            className={
              rateLimits.globalRemaining < 10
                ? "text-red-400"
                : "text-green-400"
            }
          >
            {rateLimits.globalRemaining}
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span>Search:</span>
          <span
            className={
              rateLimits.searchRemaining < 5 ? "text-red-400" : "text-green-400"
            }
          >
            {rateLimits.searchRemaining}
          </span>
        </div>
        {rateLimits.resetTime && (
          <div className="text-gray-400">
            Resets: {new Date(rateLimits.resetTime).toLocaleTimeString()}
          </div>
        )}
      </div>
    </div>
  );
}
