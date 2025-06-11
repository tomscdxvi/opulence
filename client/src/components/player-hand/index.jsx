import React, { useState } from 'react';
import GreenCard from '../cards/green-card';
import YellowCard from '../cards/yellow-card';
import BlueCard from '../cards/blue-card';
import NobleCard from '../cards/noble-card';
import './playerhand.css';

import gemImages from "../gems/gems";

export default function PlayerHand({ player, side, isCurrentPlayer }) {
  const [isOpen, setIsOpen] = useState(false);

  // Group cards by type for detailed view
  const groupedCards = player.cards.reduce((groups, card) => {
    const type = card.type || card.gemType;
    (groups[type] = groups[type] || []).push(card);
    return groups;
  }, {});

  const cardComponents = {
    green: GreenCard,
    yellow: YellowCard,
    blue: BlueCard,
    noble: NobleCard,
  };

  // Calculate gem counts from player's gems if stored in player.gems (adjust as per your model)
  const gemCounts = player.gems || {};

  // Total cards count
  const totalCards = player.cards.length;

  // Hand container classes for positioning
  const containerClass = `player-hand-container player-hand-${side}`;

  // For non-current players show summary, for current player show full view + modal
  if (!isCurrentPlayer) {
    return (
      <div className={containerClass} onClick={() => setIsOpen(true)}>
        <div><strong>{player.username}</strong></div>
        <div>Cards: {totalCards}</div>
        <div>
          {Object.entries(gemCounts).map(([gem, count]) => {

            if (gem === "_id") return null; // skip the MongoDB object ID
            const gemImg = gemImages[gem];

            return (
              <span key={gem} style={{ margin: '0 0 8px 12px' }}>
                <img src={gemImg} alt={`${gem} gem`} width={32} style={{ marginRight: 4 }} />
                <span style={{ fontWeight: 'bold', fontSize: 16 }}>{count}</span>
              </span>
            )
          })}
        </div>

        {/* Modal to view full cards */}
        {isOpen && (
          <div className="modal-backdrop" onClick={() => setIsOpen(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <button className="close-button" onClick={() => setIsOpen(false)}>✕</button>
              <h2>{player.username}’s Hand</h2>

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

  // For current player - always show detailed hand at bottom
  return (
    <div className={containerClass}>
      <h2>Your Hand</h2>
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
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
