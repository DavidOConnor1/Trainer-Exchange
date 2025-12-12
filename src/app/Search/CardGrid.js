'use client'; //stays on client server

export default function CardGrid({cards, isLoading}){
    if(isLoading){
        return(
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_,i) => (
                    <div key={i} className="bg-gray-200 rounded-lg p-4 animate-pulse h-64">

                    </div>
                ))}
            </div>
        );
    }//end if

    if(!cards || cards.length === 0){
        return(
            <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No cards found. Try a different search!</p>
            </div>
        );
    }

    return(
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cards.map((card) => (
                <div key={card.id} className="border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                    <h3 className="text-xl font-semibold mb-2">{card.name}</h3>
                        {card.types && (
                            <div className="mb-3">
                            <span className="text-sm text-gray-600">Types: </span>
                                {card.types.map(type => (
                                    <span key={type} className="inline-block bg-gray-100 px-2 py-1 rounded text-sm mr-2">
                                        {type}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
            ))}
        </div>
    )
}//end card grid