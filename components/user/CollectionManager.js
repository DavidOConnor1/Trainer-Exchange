"use client";

import { useState } from "react";
import { useCollections } from "../../hooks/v1/useCollections";
import { useCards } from "../../hooks/v1/useCards";
import { useAuth } from "../../hooks/v1/useAuth";

export default function CollectionManager() {
    const {user} = useAuth();
    const {
        collections,
        loading: collectionsLoading,
        createCollection,
        deleteCollection,
    } = useCollections();

    const [selectedCollection, setSelectedCollection] = useState(null);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newCollectionName, setNewCollectionName] = useState('');
    const [newCollectionDesc, setNewCollectionDesc] = useState ('');

    if(!user){
        return <div className="text-center p-8">Please Sign in to View or Create Collections</div>;
    }

    const handleCreateCollection = async (e) => {
        e.preventDefault();
        try{
            await createCollection(newCollectionName, newCollectionDesc);
            setNewCollectionName('');
            setNewCollectionDesc('');
            setShowCreateForm(false);
        }catch(error) {
            console.error('Failed to create collection:',error);
        }//end try catch
    }; //end handle create collection

    return(
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-white">Card Collection</h1>
                    <button
                        onClick={() => setShowCreateForm(!showCreateForm)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                            New Collection
                        </button>
                </div>

                {/*Create Collection Form*/}
                {showCreateForm && (
                    <div className="mb-8 p-6 bg-gray-800 rounded-lg border border-gray-700">
                        <h2 className="text-xl font-semibold text-white mb-4">Create new collection</h2>
                        <form onSubmit={handleCreateCollection} className="space-y-4">
                            
                        </form>
                        </div>
                )}
            </div>
        </div>
    )
}//end collection manager