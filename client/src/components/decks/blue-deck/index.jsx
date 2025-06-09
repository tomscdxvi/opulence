// BlueDeck.jsx
import React from 'react';
import CardComponent from '../../cards';  // updated import path

export default function BlueDeck({ cards = [], onCardClick, playerId, gameState }) {
  const totalCardsInDeck = 20; // update as needed

  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {/* Deck count on the left */}
      <div
        style={{
          marginRight: '12px',
          width: '40px',
          height: '60px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '2px solid #0984e3',
          borderRadius: '8px',
          backgroundColor: '#dff9fb',
          fontWeight: 'bold',
        }}
      >
        {totalCardsInDeck}
      </div>

      {/* Display cards */}
      <div style={{ display: 'flex' }}>
        {cards.map((card, index) => (
          <CardComponent
            key={index}
            level="blue"                      // specify card level here
            score={card.score}
            gemType={card.gemType}
            cost={card.cost}
            onClick={() => {
              if (playerId === gameState.currentPlayerId && onCardClick) {
                onCardClick(index);
              }
            }}
            disabled={playerId !== gameState.currentPlayerId}
          />
        ))}
      </div>
    </div>
  );
}
