import React from 'react';

export default function NobleSelectionModal({ nobles, onSelect, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
      <div className="bg-white rounded-2xl p-6 w-[400px] shadow-xl">
        <h2 className="text-xl font-bold mb-4 text-center">Choose a Noble</h2>

        <div className="space-y-3">
          {nobles.map(noble => (
            <button
              key={noble.id}
              className="w-full border rounded-xl p-3 hover:bg-blue-100 transition"
              onClick={() => onSelect(noble.id)}
            >
              <div className="flex justify-between">
                <div>
                  <p className="font-semibold">Score: {noble.score}</p>
                  <p className="text-sm text-gray-500">Cost:</p>
                  <ul className="text-sm">
                    {Object.entries(noble.cost).map(([gem, amount]) => (
                      amount > 0 && <li key={gem}>{gem}: {amount}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={onCancel}
            className="text-sm text-gray-500 hover:underline"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
