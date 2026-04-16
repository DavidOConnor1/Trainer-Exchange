"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Auth } from "../../../hooks/v1/signUser";
import { useAuth } from "../../../hooks/v1/useAuth";
import { useCollections } from "../../../hooks/v1/useCollectionStore";
import { supabase } from "../../../lib-supa/v1/api";
import { Settings, Plus, Trash2, FolderPlus, X, Package, DollarSign } from "lucide-react";

export default function UsersPage() {
  const router = useRouter();
  const { user, loading: authLoading, signOut } = useAuth();
  const { 
    collections, 
    loading: collectionsLoading, 
    error,
    createCollection, 
    deleteCollection,
    refreshCollections
  } = useCollections();
  
  const [showSettings, setShowSettings] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [newCollectionDescription, setNewCollectionDescription] = useState("");
  const [collectionsStats, setCollectionsStats] = useState({});
  const [loadingStats, setLoadingStats] = useState(false);
  const [displayName, setDisplayName] = useState("");

  // Get display name from user metadata
  useEffect(() => {
    if (user) {
      // Get name from user metadata, fallback to email username
      const nameFromMetadata = user.user_metadata?.name;
      if (nameFromMetadata && nameFromMetadata !== '') {
        setDisplayName(nameFromMetadata);
      } else {
        // Fallback: extract username from email (part before @)
        const emailUsername = user.email?.split('@')[0] || 'User';
        setDisplayName(emailUsername);
      }
    }
  }, [user]);

  // Fetch card statistics for each collection
  const fetchCollectionStats = async () => {
    if (!collections.length) {
      setCollectionsStats({});
      return;
    }
    
    setLoadingStats(true);
    try {
      const stats = {};
      
      for (const collection of collections) {
        const { data: cardsData, error } = await supabase
          .from('cards')
          .select('price, quantity')
          .eq('collection_id', collection.id);
        
        if (!error && cardsData) {
          const collectionTotalValue = cardsData.reduce((sum, card) => {
            return sum + (card.price * (card.quantity || 1));
          }, 0);
          
          stats[collection.id] = {
            card_count: cardsData.length,
            total_value: collectionTotalValue
          };
        }
      }
      
      setCollectionsStats(stats);
    } catch (err) {
      console.error("Error fetching collection stats:", err);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    if (collections.length > 0 && !collectionsLoading) {
      fetchCollectionStats();
    }
  }, [collections, collectionsLoading]);

  const calculateOverallTotals = () => {
    let totalValue = 0;
    let totalCards = 0;
    
    Object.values(collectionsStats).forEach(stat => {
      totalValue += stat.total_value;
      totalCards += stat.card_count;
    });
    
    return { totalValue, totalCards };
  };

  const { totalValue: totalCollectionsValue, totalCards: totalCardsCount } = calculateOverallTotals();

  const handleCreateCollection = async () => {
    if (!newCollectionName.trim()) return;
    
    try {//start try catch
      const description = newCollectionDescription.trim() || null; //will take a description or can be null
      await createCollection(newCollectionName.trim(), description);
      setShowCreateModal(false);
      setNewCollectionName("");
      setNewCollectionDescription("");
    } catch (err) {
      console.error("Error creating collection:", err);
      alert("Failed to create collection: " + err.message);
    }//end try catch
  };

  const handleDeleteCollection = async () => {
    if (!selectedCollection) return;
    
    try {//start try catch
      await deleteCollection(selectedCollection.id);
      setShowDeleteModal(false);
      setSelectedCollection(null);
    } catch (err) {
      console.error("Error deleting collection:", err);
      alert("Failed to delete collection: " + err.message);
    }// end try catch
  };

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

  if (!user) {
    return <Auth />;
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

      
      {/* Main Content */}
      <div className="pt-24 pb-8 px-4 max-w-lg mx-auto">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-1">
              <Package className="w-4 h-4 text-blue-500" />
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Total Collections
              </h3>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {collectionsLoading ? "..." : collections.length}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {loadingStats ? "Loading..." : `${totalCardsCount} total cards`}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-green-500" />
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Total Value
              </h3>
            </div>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              ${loadingStats ? "..." : totalCollectionsValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* Collections Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Your Collections
            </h2>
            {collections.length > 0 && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FolderPlus className="w-4 h-4" />
                New Collection
              </button>
            )}
          </div>

          <div className="p-4">
            {collectionsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-500">Loading collections...</p>
              </div>
            ) : error ? (
              <div className="text-center py-8 text-red-500">
                <p>Error: {error}</p>
                <button 
                  onClick={() => refreshCollections()}
                  className="mt-2 text-blue-600 hover:underline"
                >
                  Try again
                </button>
              </div>
            ) : collections.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="text-center mb-6">
                  <FolderPlus className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-500 mb-3" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No Collections Yet
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Create your first collection to start adding Pokemon cards
                  </p>
                </div>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Create Collection
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {collections.map((collection) => {
                  const stats = collectionsStats[collection.id] || { card_count: 0, total_value: 0 };
                  return (
                    <div
                      key={collection.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
                    >
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {collection.name}
                          {collection.isTemp && (
                            <span className="ml-2 text-xs text-yellow-500">Saving...</span>
                          )}
                        </h3>
                        {collection.description && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                            {collection.description}
                          </p>
                        )}
                        <div className="flex gap-3 mt-1">
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {stats.card_count} {stats.card_count === 1 ? 'card' : 'cards'}
                          </p>
                          <p className="text-xs font-medium text-green-600 dark:text-green-400">
                            ${stats.total_value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedCollection(collection);
                          setShowDeleteModal(true);
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        aria-label="Delete collection"
                        disabled={collection.isTemp}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Collection Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Create New Collection
              </h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewCollectionName("");
                  setNewCollectionDescription("");
                }}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <input
              type="text"
              value={newCollectionName}
              onChange={(e) => setNewCollectionName(e.target.value)}
              placeholder="Collection name *"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg mb-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
            <textarea
              value={newCollectionDescription}
              onChange={(e) => setNewCollectionDescription(e.target.value)}
              placeholder="Description (optional)"
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg mb-4 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewCollectionName("");
                  setNewCollectionDescription("");
                }}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCollection}
                disabled={!newCollectionName.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedCollection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Delete Collection?
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Are you sure you want to delete "{selectedCollection.name}"?
            </p>
            {collectionsStats[selectedCollection.id]?.card_count > 0 && (
              <p className="text-sm text-red-600 dark:text-red-400 mb-6 bg-red-50 dark:bg-red-900/20 p-2 rounded-lg">
                ⚠️ This collection contains {collectionsStats[selectedCollection.id].card_count} {collectionsStats[selectedCollection.id].card_count === 1 ? 'card' : 'cards'}. They will also be deleted.
              </p>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteCollection}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete Collection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}