// src/components/decks/CardDeck.jsx

import React from "react";
import CardComponent from "../cards";

export default function CardDeck({ deckType, cards, deckCount, onCardClick, onReserveClick, reservedCount, isMyTurn }) {
  const canReserve = isMyTurn && reservedCount < 3 && deckType !== "noble";

  return (
    <div>
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

        {/* Cards */}
        <div style={{ display: "flex", gap: "36px", marginLeft: '24px' }}>
          {cards.length === 0 && <div>No cards available</div>}
          {cards.slice(0, 4).map((card, index) => (
            <div key={card.id || index} style={{ position: "relative" }}>
              <CardComponent
                deckType={deckType}
                score={card.score}
                gemType={card.gemType}
                cost={card.cost || {}}
                onClick={() => onCardClick(deckType, index)}
              />
              {canReserve && (
                <button
                  style={{
                    position: "absolute",
                    bottom: "10px",
                    right: "24px",
                    padding: "4px 8px",
                    fontSize: "12px",
                    backgroundColor: "#2196f3",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    zIndex: 10,
                    transition: "background-color 0.2s ease-in-out",
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onReserveClick(deckType, index);
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#1976d2"}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = "#2196f3"}
                >
                  Reserve
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}



