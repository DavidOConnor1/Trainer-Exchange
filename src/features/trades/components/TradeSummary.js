"use client";

export default function TradeSummary({
  totalIn,
  totalOut,
  profit,
  onComplete,
  completing,
}) {
  return (
    <div className="mt-8 bg-gray-800 rounded-lg border border-gray-700 p-6">
      <div className="grid grid-cols-3 gap-4 text-center mb-6">
        <div>
          <p className="text-gray-400 text-sm">Total In</p>
          <p className="text-green-400 text-2xl font-bold">
            €{totalIn.toFixed(2)}
          </p>
        </div>
        <div>
          <p className="text-gray-400 text-sm">Total Out</p>
          <p className="text-red-400 text-2xl font-bold">
            €{totalOut.toFixed(2)}
          </p>
        </div>
        <div>
          <p className="text-gray-400 text-sm">Profit</p>
          <p
            className={`text-2xl font-bold ${profit >= 0 ? "text-green-400" : "text-red-400"}`}
          >
            €{profit.toFixed(2)}
          </p>
        </div>
      </div>
      <button
        onClick={onComplete}
        disabled={completing}
        className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {completing ? "Saving Trade..." : "Complete Trade"}
      </button>
    </div>
  );
}
