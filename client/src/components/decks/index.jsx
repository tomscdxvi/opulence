// src/components/decks/CardDeck.jsx

import React from "react";
import CardComponent from "../cards";

export default function CardDeck({ deckType, cards, deckCount, onCardClick, onReserveClick }) {
  return (
    <div>
      {/* Title
      <h3 style={{ textTransform: "capitalize", marginBottom: 8 }}>
        {deckType} Deck
      </h3>
      */}

      {/* Flex container for deck count and cards */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", overflowX: "auto" }}>
        
        {/* Deck count card-like box */}
        <div
          style={{
            minWidth: 80,
            height: 120,
            border: "2px solid #555",
            borderRadius: 8,
            backgroundColor: "#fff",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            fontWeight: "bold",
            fontSize: 18,
            color: "#333",
            userSelect: "none",
            boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
          }}
        >
          <div>{deckCount}</div>
          <div style={{ fontSize: 12, marginTop: 4 }}>Cards left</div>
        </div>

        {/* Cards row */}
        <div style={{ display: "flex", gap: "8px" }}>
          {cards.length === 0 && <div>No cards available</div>}
          {cards.map((card, index) => (
            <div key={card.id || index} style={{ position: 'relative' }}>
              <CardComponent
                deckType={deckType}
                score={card.points}
                gemType={card.gemType}
                cost={card.cost || {}}
                onClick={() => onCardClick(deckType, index)}
              />
              <button
                style={{
                  position: 'absolute',
                  bottom: '5px',
                  right: '5px',
                  padding: '4px 8px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  zIndex: 10,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onReserveClick(deckType, index);
                }}
              >
                Reserve
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


