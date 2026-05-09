"use client";

import { useState } from "react";
import { useTrades } from "../hooks/useTrades";

export default function SaveToCollectionButton({ event }) {
  const { convertToCollection } = useTrades();
  const [showModal, setShowModal] = useState(false);
  const [collectionName, setCollectionName] = useState("");
  const [saving, setSaving] = useState(false);

  // Already saved – show a badge and no button
  if (event.converted_to_collection) {
    return (
      <div className="flex justify-end">
        <span className="text-green-400 text-sm font-semibold">
          ✓ Saved to collection
        </span>
      </div>
    );
  }

  const handleSave = async () => {
    if (!collectionName.trim()) return;
    setSaving(true);
    try {
      await convertToCollection(event.id, collectionName.trim());
      setShowModal(false);
    } catch (error) {
      alert(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="flex justify-end">
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
        >
          💾 Save as Collection
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-white mb-4">
              Save to Collection
            </h3>
            <input
              type="text"
              value={collectionName}
              onChange={(e) => setCollectionName(e.target.value)}
              placeholder="Collection name"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-700 text-white rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !collectionName.trim()}
                className="px-4 py-2 bg-purple-600 text-white rounded disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
