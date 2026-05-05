// components/trades/EventDetail.js
"use client";

import { useState, useEffect } from "react";
import { useTrades } from "../../hooks/v2/useTrades";
import Image from "next/image";

export default function EventDetail({ event, onBack }) {
  const {
    sessions,
    sessionsLoading,
    sessionsError,
    fetchSessions,
    updateTradeItem,
    deleteTradeItem,
    clearSessions,
  } = useTrades();

  useEffect(() => {
    if (event?.id) fetchSessions(event.id);
    return () => clearSessions();
  }, [event.id, fetchSessions, clearSessions]);

  // inline update handler
  const handleItemUpdate = (sessionId, itemId, field, value) => {
    updateTradeItem(sessionId, itemId, { [field]: value });
  };

  const handleItemDelete = (sessionId, itemId) => {
    deleteTradeItem(sessionId, itemId);
  };

  // stats
  const allItems = sessions.flatMap((s) => s.trade_items || []);
  const tradedIn = allItems.filter((i) => i.direction === "in");
  const tradedOut = allItems.filter((i) => i.direction === "out");
  const totalIn = tradedIn.reduce(
    (s, i) => s + Number(i.trade_price) * i.quantity,
    0,
  );
  const totalOut = tradedOut.reduce(
    (s, i) => s + Number(i.trade_price) * i.quantity,
    0,
  );
  const profit = totalIn - totalOut;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={onBack}
            className="text-blue-400 hover:underline text-sm mb-2 block"
          >
            ← Back to Events
          </button>
          <h2 className="text-2xl font-bold text-white">{event.name}</h2>
          <p className="text-gray-400 text-sm">
            {new Date(event.event_date + "T00:00:00").toLocaleDateString(
              "en-GB",
            )}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Cards In" value={tradedIn.length} />
        <StatCard label="Cards Out" value={tradedOut.length} />
        <StatCard label="Trade‑in Value" value={`€${totalIn.toFixed(2)}`} />
        <StatCard label="Trade‑out Value" value={`€${totalOut.toFixed(2)}`} />
        <StatCard
          label="Profit"
          value={`€${profit.toFixed(2)}`}
          positive={profit >= 0}
        />
      </div>

      {/* Sessions List */}
      {sessionsLoading ? (
        <div className="text-center py-8 text-gray-400">
          Loading sessions...
        </div>
      ) : sessionsError ? (
        <div className="text-red-400">{sessionsError}</div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No sessions yet.</div>
      ) : (
        <div className="space-y-6">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="bg-gray-800 rounded-lg border border-gray-700 p-4"
            >
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-white font-semibold">
                  {session.name ||
                    new Date(session.created_at).toLocaleTimeString()}
                </h3>
                <span className="text-gray-400 text-xs">
                  {new Date(session.created_at).toLocaleString()}
                </span>
              </div>

              {session.trade_items?.length > 0 ? (
                <div className="space-y-3">
                  {session.trade_items.map((item) => (
                    <div
                      key={item.id}
                      className="bg-gray-700 rounded p-3 flex items-center gap-3"
                    >
                      {item.image_url?.startsWith("https://") && (
                        <Image
                          src={item.image_url}
                          alt={item.name}
                          width={48}
                          height={67}
                          className="object-contain"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm truncate">
                          {item.name}
                        </p>
                        <p className="text-gray-400 text-xs truncate">
                          {item.set_name}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <label className="text-gray-500 text-xs">
                            Price €
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.trade_price}
                            onChange={(e) =>
                              handleItemUpdate(
                                session.id,
                                item.id,
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
                              handleItemUpdate(
                                session.id,
                                item.id,
                                "quantity",
                                parseInt(e.target.value) || 1,
                              )
                            }
                            className="w-16 px-2 py-0.5 bg-gray-900 border border-gray-600 rounded text-white text-xs"
                          />
                          <span
                            className={`ml-2 text-xs font-semibold ${item.direction === "in" ? "text-green-400" : "text-red-400"}`}
                          >
                            {item.direction === "in" ? "In" : "Out"}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleItemDelete(session.id, item.id)}
                        className="text-red-400 hover:text-red-300 text-sm"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No items</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, positive }) {
  return (
    <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
      <p className="text-gray-400 text-sm">{label}</p>
      <p
        className={`text-lg font-semibold ${positive === true ? "text-green-400" : positive === false ? "text-red-400" : "text-white"}`}
      >
        {value}
      </p>
    </div>
  );
}
