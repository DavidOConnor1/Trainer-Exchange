// components/trades/TradesTab.js
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTrades } from "../../hooks/v2/useTrades";
import EventDetail from "./EventDetail";
import EditableEventName from "./EditableEventName";
export default function TradesTab() {
  const router = useRouter();
  const { events, loading, error, createEvent, deleteEvent } = useTrades();

  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [eventDate, setEventDate] = useState("");

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createEvent(name, eventDate);
      setName("");
      setEventDate("");
      setShowCreate(false);
    } catch (err) {
      console.error(err);
    }
  };

  // If an event is selected, show its detail view
  if (selectedEvent) {
    return (
      <EventDetail
        event={selectedEvent}
        onBack={() => setSelectedEvent(null)}
      />
    );
  }

  // Otherwise show the events list
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-white">Trade Events</h2>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + New Event
        </button>
      </div>

      {error && <p className="text-red-400 mb-4">{error}</p>}

      {showCreate && (
        <form
          onSubmit={handleCreate}
          className="mb-6 p-4 bg-gray-800 rounded-lg"
        >
          <div className="grid grid-cols-2 gap-4 mb-4">
            <input
              type="text"
              placeholder="Event Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white"
              required
            />
            <input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white"
              required
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-green-600 text-white rounded"
          >
            Create
          </button>
        </form>
      )}

      {loading && !events.length ? (
        <div className="text-center text-gray-400 py-8">Loading trades...</div>
      ) : events.length === 0 ? (
        <div className="text-gray-500 text-center py-8">
          No active trade events
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map((event) => (
            <div
              key={event.id}
              className="bg-gray-800 p-4 rounded-lg border border-gray-700"
            >
              <EditableEventName event={event} />
              <p className="text-gray-400 text-sm">
                {new Date(event.event_date + "T00:00:00").toLocaleDateString(
                  "en-GB",
                )}
              </p>
              <p className="text-gray-500 text-xs">
                Expires:{" "}
                {new Date(event.expires_at).toLocaleDateString("en-GB")}
              </p>
              <div className="flex justify-between mt-3">
                <button
                  onClick={() => setSelectedEvent(event)}
                  className="text-blue-400 text-sm hover:underline"
                >
                  View Sessions
                </button>
                <button
                  onClick={() => deleteEvent(event.id)}
                  className="text-red-400 text-sm hover:underline"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 text-right">
        <button
          onClick={() => router.push("/Collection/Trades")}
          className="text-blue-400 hover:underline text-sm"
        >
          View All Trades →
        </button>
      </div>
    </div>
  );
}
