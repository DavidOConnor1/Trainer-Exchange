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
            </div>
        </form>
    )
}//end search bar