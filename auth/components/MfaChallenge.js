"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase/api";

export default function MfaChallenge({ factorId, onSuccess, onCancel }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (!code || code.length !== 6) {
      setError("Enter the 6-digit code from your authenticator app.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { data, error } = await supabase.auth.mfa.challenge({
        factorId,
      });

      if (error) throw error;

      const { data: verifyData, error: verifyError } =
        await supabase.auth.mfa.verify({
          factorId,
          challengeId: data.id,
          code,
        });

      if (verifyError) throw verifyError;

      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 p-4">
      <div className="max-w-md w-full bg-gray-950 p-8 rounded-2xl border border-gray-800">
        <h2 className="text-2xl font-bold text-white mb-4">
          Two-Factor Authentication
        </h2>
        <p className="text-gray-400 text-sm mb-6">
          Enter the 6-digit code from your authenticator app.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <div className="mb-4">
          <input
            type="text"
            value={code}
            onChange={(e) =>
              setCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))
            }
            maxLength={6}
            placeholder="000000"
            className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white text-center text-2xl tracking-widest"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleVerify}
            disabled={loading || code.length !== 6}
            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Verifying..." : "Verify"}
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
