// components/auth/MfaEnrollment.js
"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase/api";

export default function MfaEnrollment({ onComplete, onCancel }) {
  const [qrCode, setQrCode] = useState(null);
  const [secret, setSecret] = useState(null);
  const [factorId, setFactorId] = useState(null);
  const [verifyCode, setVerifyCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    startEnrollment();
  }, []);

  const startEnrollment = async () => {
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
      });

      if (error) throw error;

      setQrCode(data.totp.qr_code);
      setSecret(data.totp.secret);
      setFactorId(data.id);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleVerify = async () => {
    if (!verifyCode || verifyCode.length !== 6) {
      setError("Enter the 6-digit code from your authenticator app.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { data: challengeData, error: challengeError } =
        await supabase.auth.mfa.challenge({
          factorId,
        });

      if (challengeError) throw challengeError;

      const { data: verifyData, error: verifyError } =
        await supabase.auth.mfa.verify({
          factorId,
          challengeId: challengeData.id,
          code: verifyCode,
        });

      if (verifyError) throw verifyError;

      onComplete();
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
          Enable Two-Factor Authentication
        </h2>
        <p className="text-gray-400 text-sm mb-6">
          Scan this QR code with your authenticator app (Google Authenticator,
          Microsoft Authenticator, Authy, etc.)
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {qrCode && (
          <div className="flex justify-center mb-6 bg-white p-4 rounded-lg">
            <img src={qrCode} alt="MFA QR Code" className="w-56 h-56" />
          </div>
        )}

        {secret && (
          <div className="mb-6 p-4 bg-gray-800 rounded-lg">
            <p className="text-gray-400 text-xs mb-2">
              Can't scan the QR code? Enter this code manually in your
              authenticator app:
            </p>
            <p className="text-white text-sm font-mono break-all select-all">
              {secret}
            </p>
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm text-gray-300 mb-2">
            Enter 6-digit verification code
          </label>
          <input
            type="text"
            value={verifyCode}
            onChange={(e) =>
              setVerifyCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))
            }
            maxLength={6}
            placeholder="000000"
            className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white text-center text-2xl tracking-widest"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleVerify}
            disabled={loading || verifyCode.length !== 6}
            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "Verifying..." : "Verify & Enable"}
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}
