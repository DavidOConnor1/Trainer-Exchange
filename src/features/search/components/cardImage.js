"use client";

import { useState } from "react";
import Image from "next/image";

export default function CardImage({
  src,
  alt = "Pokemon card",
  className = "",
  ...props
}) {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  // Validate image URL
  const isValidUrl = (url) => {
    if (!url || typeof url !== "string") return false;
    if (url.includes("undefined") || url.includes("null")) return false;
    try {
      new URL(url);
      return url.startsWith("http://") || url.startsWith("https://");
    } catch {
      return false;
    }
  };

  const validSrc = isValidUrl(src) ? src : null;

  if (!validSrc || error) {
    return (
      <div
        className={`bg-gray-800 rounded flex items-center justify-center ${className}`}
      >
        <div className="flex flex-col items-center justify-center text-gray-500 p-4">
          <span className="text-4xl mb-1">🃏</span>
          <span className="text-xs text-center">No image available</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {loading && (
        <div className="absolute inset-0 bg-gray-800 rounded flex items-center justify-center">
          <div className="animate-pulse bg-gray-700 rounded w-full h-full" />
        </div>
      )}
      <Image
        src={validSrc}
        alt={alt}
        fill
        className={`object-contain rounded ${loading ? "opacity-0" : "opacity-100"} transition-opacity duration-300`}
        onLoad={() => setLoading(false)}
        onError={() => {
          setError(true);
          setLoading(false);
        }}
        {...props}
      />
    </div>
  );
}
