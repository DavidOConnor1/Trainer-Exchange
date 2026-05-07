import { Shield, CheckCircle } from "lucide-react";

export default function SecuritySection({ mfaEnabled, onEnable, onDisable }) {
  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 mb-2">
      <h2 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
        <Shield className="w-4 h-4" /> Security
      </h2>

      {mfaEnabled ? (
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
      ) : (
        <>
          <p className="text-gray-400 text-sm mb-4">
            Add an extra layer of security to your account with two-factor
            authentication.
          </p>
          <button
            onClick={onEnable}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            Enable Two-Factor Authentication
          </button>
        </>
      )}
    </div>
  );
}
