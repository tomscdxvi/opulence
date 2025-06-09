import React, { useState } from 'react';
import GreenCard from '../cards/green-card';
import YellowCard from '../cards/yellow-card';
import BlueCard from '../cards/blue-card';
import NobleCard from '../cards/noble-card';
import './playerhand.css';

export default function PlayerHand({ player, side }) {
  const [isOpen, setIsOpen] = useState(false);

  // Group cards by type
  /*
  const groupedCards = player.cards.reduce((groups, card) => {
    (groups[card.type] = groups[card.type] || []).push(card);
    return groups;
  }, {});
  */

  // Map card type to corresponding card component
  const cardComponents = {
    green: GreenCard,
    yellow: YellowCard,
    blue: BlueCard,
    noble: NobleCard,
  };

  // Calculate total points for player (sum of scores of all cards)
  // const totalPoints = player.cards.reduce((sum, card) => sum + (card.score || 0), 0);

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

            <h2>Player {player.username}’s Hand</h2>
            {/* <div><strong>Points:</strong> {totalPoints}</div> */}

            {/* Render grouped cards */}
            {['green', 'yellow', 'blue', 'noble'].map((type) => {
              const cardsOfType = groupedCards[type] || [];
              if (cardsOfType.length === 0) return null;

              const CardComponent = cardComponents[type];

              return (
                <div key={type}>
                  <h3>{type.charAt(0).toUpperCase() + type.slice(1)} Cards</h3>
                  <div className="card-grid">
                    {cardsOfType.map((card, idx) => (
                      <CardComponent
                        key={idx}
                        score={card.score}
                        gemType={card.gemType}
                        cost={card.cost}
                        onClick={() => { /* implement if needed */ }}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
