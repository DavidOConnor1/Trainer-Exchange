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

    }
}//end collection manager