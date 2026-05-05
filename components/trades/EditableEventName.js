// components/trades/EditableEventName.js
"use client";

import { useState, useRef, useEffect } from "react";
import { useTrades } from "../../hooks/v2/useTrades";

export default function EditableEventName({ event, className = "" }) {
  const { updateEventName } = useTrades();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(event.name);
  const inputRef = useRef(null);

  useEffect(() => {
    setName(event.name);
  }, [event.name]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const handleSave = async () => {
    const trimmed = name.trim();
    if (trimmed && trimmed !== event.name) {
      try {
        await updateEventName(event.id, trimmed);
      } catch (err) {
        console.error("Failed to update event name:", err);
        setName(event.name);
      }
    }
    setEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      setName(event.name);
      setEditing(false);
    }
  };

  if (!editing) {
    return (
      <span
        className={`font-semibold cursor-pointer hover:text-blue-400 transition-colors ${className}`}
        onClick={() => setEditing(true)}
        title="Click to rename"
      >
        {event.name} ✎
      </span>
    );
  }

  return (
    <input
      ref={inputRef}
      type="text"
      value={name}
      onChange={(e) => setName(e.target.value)}
      onBlur={handleSave}
      onKeyDown={handleKeyDown}
      className="bg-gray-700 text-white text-sm px-2 py-1 rounded border border-gray-600 focus:outline-none focus:border-blue-500 w-full"
    />
  );
}
