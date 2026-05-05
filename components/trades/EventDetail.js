// components/trades/EventDetail.js
"use client";

import { useState, useEffect } from "react";
import { useTrades } from "../../hooks/v2/useTrades";

export default function EventDetail({ event, onBack }) {
  const {
    sessions,
    sessionsLoading,
    sessionsError,
    fetchSessions,
    createSession,
    clearSessions,
  } = useTrades();

  const [showAddSession, setShowAddSession] = useState(false);
  const [sessionName, setSessionName] = useState("");

  useEffect(() => {
    if (event?.id) {
      fetchSessions(event.id);
    }
    return () => clearSessions();
  }, [event?.id, fetchSessions, clearSessions]);

  const handleCreateSession = async (e) => {
    e.preventDefault();
    try {
      await createSession(event.id, sessionName || undefined);
      setSessionName("");
      setShowAddSession(false);
    } catch (err) {
      console.error("Failed to create session:", err);
    }
  };

  // Calculate stats from items in all sessions
  const allItems = sessions.flatMap((s) => s.trade_items || []);
  const tradedIn = allItems.filter((i) => i.direction === "in");
  const tradedOut = allItems.filter((i) => i.direction === "out");
  const totalIn = tradedIn.reduce(
    (sum, i) => sum + Number(i.trade_price) * i.quantity,
    0,
  );
  const totalOut = tradedOut.reduce(
    (sum, i) => sum + Number(i.trade_price) * i.quantity,
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
        <button
          onClick={() => setShowAddSession(!showAddSession)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + Add Session
        </button>
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

      {/* Add Session Form */}
      {showAddSession && (
        <form
          onSubmit={handleCreateSession}
          className="p-4 bg-gray-800 rounded-lg"
        >
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm text-gray-400 mb-1">
                Session Name (optional)
              </label>
              <input
                type="text"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                placeholder="e.g., Trade @ 11am"
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Create
            </button>
          </div>
        </form>
      )}

      {/* Sessions List */}
      {sessionsLoading ? (
        <div className="text-center py-8 text-gray-400">
          Loading sessions...
        </div>
      ) : sessionsError ? (
        <div className="text-red-400">{sessionsError}</div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No sessions yet. Click "+ Add Session" to start.
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="bg-gray-800 rounded-lg border border-gray-700 p-4"
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-white font-semibold">
                  {session.name ||
                    new Date(session.created_at).toLocaleTimeString()}
                </h3>
                <span className="text-gray-400 text-xs">
                  {new Date(session.created_at).toLocaleString()}
                </span>
              </div>

              {/* Items summary */}
              {session.trade_items?.length > 0 ? (
                <div className="text-sm text-gray-400">
                  {
                    session.trade_items.filter((i) => i.direction === "in")
                      .length
                  }{" "}
                  in /{" "}
                  {
                    session.trade_items.filter((i) => i.direction === "out")
                      .length
                  }{" "}
                  out
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No items yet</p>
              )}

              {/* Placeholder for future item management */}
              <button
                className="mt-2 text-blue-400 text-sm hover:underline"
                onClick={() => alert("Item management coming soon!")}
              >
                Manage Items
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Helper sub-component
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
