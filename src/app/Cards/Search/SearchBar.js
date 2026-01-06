'use client'; //this will be a client side server page

import { useState } from "react";

export default function SearchBar({ onSearch, intialQuery = ''}){
    const [query, setQuery] = useState(intialQuery);

    const handleSubmit = (e) => {
        e.preventDefault();
        if(query.trim()){
            onSearch(query.trim());
        }//end if
    };//end handle submit

    return(
        <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
            <div className="flex gap-2">
                <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search any Pokemon Cards (Pikachu, Eevee)"
                className="flex-grow px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                <button
                type="submit"
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    Search
                </button>
            </div>
        </form>
    );
}//end search bar