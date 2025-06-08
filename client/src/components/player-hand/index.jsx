import React, { useState } from 'react';
import GreenCard from '../cards/green-card'; // Replace with actual card types
import './PlayerHand.css'; // CSS shown below

export default function PlayerHand({ player, side }) {
    const [isOpen, setIsOpen] = useState(false);

    const exampleCards = [1, 2, 3]; // Replace with dynamic cards

    return (
        <div>
            {/* View Hand Button */}
            <button onClick={() => setIsOpen(true)} className={`view-hand-button ${side}`}>
                View Hand
            </button>

            {/* Modal */}
            {isOpen && (
                <div className="modal-backdrop" onClick={() => setIsOpen(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <button className="close-button" onClick={() => setIsOpen(false)}>✕</button>
                        
                        <h2>Player {player}’s Hand</h2>
                        <div><strong>Points:</strong> 5</div> {/* Replace with actual points */}

                        <div className="card-grid">
                            {exampleCards.map((card, index) => (
                                <GreenCard
                                key={index}
                                score={1}
                                gemType="white"
                                cost={{ green: 1, blue: 2 }}
                                onClick={() => {}}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
