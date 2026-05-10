// auth/components/settings/SecuritySection.js
import { Shield, CheckCircle, RefreshCw } from "lucide-react";
import { useState } from "react";

export default function SecuritySection({
  mfaEnabled,
  mfaChecked,
  checkingMfa,
  onCheckMfa,
  onEnable,
  onDisable,
  mfaMessage,
  showDisableChallenge,
  onVerifyDisable,
  onCancelDisable,
}) {
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);

  const handleVerify = async () => {
    setVerifying(true);
    const success = await onVerifyDisable(code);
    setVerifying(false);
    if (success) {
      setCode("");
    }
  };

  const handleCancel = () => {
    setCode("");
    onCancelDisable();
  };

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 mb-2">
      <h2 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
        <Shield className="w-4 h-4" /> Security
      </h2>

      {!mfaChecked ? (
        <div>
          <p className="text-gray-400 text-sm mb-4">
            Check if two-factor authentication is enabled on your account.
          </p>
          <button
            onClick={onCheckMfa}
            disabled={checkingMfa}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm"
          >
            {checkingMfa ? (
              <RefreshCw className="w-4 h-4 animate-spin inline mr-1" />
            ) : null}
            Check MFA Status
          </button>
        </div>
      ) : mfaEnabled ? (
        <>
          {showDisableChallenge ? (
            // MFA challenge for disabling
            <div>
              <p className="text-gray-400 text-sm mb-4">
                Enter the 6-digit code from your authenticator app to disable
                two-factor authentication.
              </p>
              <input
                type="text"
                value={code}
                onChange={(e) =>
                  setCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))
                }
                maxLength={6}
                placeholder="000000"
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white text-center text-2xl tracking-widest mb-3"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleVerify}
                  disabled={verifying || code.length !== 6}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors text-sm"
                >
                  {verifying ? "Verifying..." : "Verify & Disable"}
                </button>
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-green-400 text-sm mb-4 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" /> Two-factor authentication is
                enabled
              </p>
              <button
                onClick={onDisable}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
              >
                Disable Two-Factor Authentication
              </button>
            </>
          )}
        </>
      ) : (
        <>
          <p className="text-gray-400 text-sm mb-4">
            Two-factor authentication is not enabled.
          </p>
          <button
            onClick={onEnable}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            Enable Two-Factor Authentication
          </button>
        </>
      )}

      {mfaMessage && <p className="mt-2 text-sm text-gray-300">{mfaMessage}</p>}
    </div>
  );
}
