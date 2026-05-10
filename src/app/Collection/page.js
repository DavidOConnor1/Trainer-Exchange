"use client";

import { useState } from "react";
import CollectionManager from "@/features/collections/components/CollectionManager";
import TradesTab from "@/features/trades/components/TradesTab";

export default function CollectionPage() {
  const [activeTab, setActiveTab] = useState("collections");

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-gray-700 pb-2">
          <button
            onClick={() => setActiveTab("collections")}
            className={`px-4 py-2 rounded-t-lg ${
              activeTab === "collections"
                ? "bg-gray-800 text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Collections
          </button>
          <button
            onClick={() => setActiveTab("trades")}
            className={`px-4 py-2 rounded-t-lg ${
              activeTab === "trades"
                ? "bg-gray-800 text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Trades
          </button>
        </div>

        {/* Tab content */}
        {activeTab === "collections" ? <CollectionManager /> : <TradesTab />}
      </div>
    </div>
  );
}
