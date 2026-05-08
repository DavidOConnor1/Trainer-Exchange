"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Auth } from "../../../auth/hooks/v1/signUser";
import { useAuth } from "../../../auth/hooks/useAuth";
import UserCollections from "../../../collections/components/user/UserCollections";
import { Settings } from "lucide-react";

export default function UsersPage() {
  const router = useRouter();
  const {
    user,
    loading: authLoading,
    isAuthenticated,
    needsMfa,
    mfaFactorId,
    completeMfaChallenge,
    cancelMfa,
    signOut,
  } = useAuth();

  const [showSettings, setShowSettings] = useState(false);
  const [displayName, setDisplayName] = useState("");

  useEffect(() => {
    if (user) {
      const nameFromMetadata = user.user_metadata?.name;
      if (nameFromMetadata && nameFromMetadata !== "") {
        setDisplayName(nameFromMetadata);
      } else {
        const emailUsername = user.email?.split("@")[0] || "User";
        setDisplayName(emailUsername);
      }
    }
  }, [user]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Auth
        needsMfa={needsMfa}
        mfaFactorId={mfaFactorId}
        onCompleteMfa={completeMfaChallenge}
        onCancelMfa={cancelMfa}
        user={user}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="fixed z-20 w-full max-w-lg -translate-x-1/2 top-4 left-1/2">
        <div className="w-full h-16 bg-white border border-gray-200 rounded-full dark:bg-gray-700 dark:border-gray-600 shadow-sm">
          <div className="grid h-full max-w-lg grid-cols-[70%_30%] mx-auto px-4">
            <div className="flex items-center">
              <h1 className="text-sm sm:text-base truncate font-medium text-gray-800 dark:text-white">
                Welcome, {displayName}!
              </h1>
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                aria-label="Settings"
              >
                <Settings className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Dropdown */}
      {showSettings && (
        <div className="fixed z-30 w-48 bg-white rounded-lg shadow-lg top-24 right-4 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <div className="py-1">
            <button
              onClick={() => {
                router.push("/UserSettings");
                setShowSettings(false);
              }}
              className="block w-full px-4 py-3 text-sm text-left text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              ⚙️ Settings
            </button>
            <button
              onClick={() => {
                signOut();
                setShowSettings(false);
              }}
              className="block w-full px-4 py-3 text-sm text-left text-red-600 hover:bg-gray-100 dark:text-red-400 dark:hover:bg-gray-700 border-t border-gray-200 dark:border-gray-700"
            >
              🚪 Sign Out
            </button>
          </div>
        </div>
      )}

      {/* Collections Section – now cleanly separated */}
      <UserCollections />
    </div>
  );
}
