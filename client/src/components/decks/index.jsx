// src/components/decks/CardDeck.jsx

import React from "react";
import CardComponent from "../cards";

import useWindowSize from "../../util/useWindowSize";

export default function CardDeck({ deckType, cards, deckCount, onCardClick, onReserveClick, reservedCount, isMyTurn }) {
  const canReserve = isMyTurn && reservedCount < 3 && deckType !== "noble";

  const { isLaptop } = useWindowSize();

  // Adjust container styles for smaller screens
  const containerStyle = {
    display: "flex",
    alignItems: "center",
    gap: isLaptop ? 6 : 12,  // smaller gap for laptops
    overflowX: "auto",
    padding: isLaptop ? "2px" : "0",
  };

  // Deck count card size for responsiveness
  const deckCountBoxStyle = {
    minWidth: isLaptop ? 50 : 80,
    height: isLaptop ? 70 : 120,
    border: "2px solid #555",
    borderRadius: 8,
    backgroundColor: "#ecf0f1",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    fontWeight: "bold",
    fontSize: isLaptop ? 12 : 18,
    color: "#333",
    userSelect: "none",
    boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
  };

  // Cards container spacing
  const cardsContainerStyle = {
    display: "flex",
    gap: isLaptop ? 8 : 32,
    marginLeft: isLaptop ? 16 : 24,
  };

  // Reserve button style tweaks for laptop
  const reserveButtonStyle = {
    position: "absolute",
    bottom: "10px",
    right: isLaptop ? "20px" : "24px",
    padding: isLaptop ? "2px 6px" : "4px 8px",
    fontSize: isLaptop ? "10px" : "12px",
    backgroundColor: "#2196f3",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    zIndex: 10,
    transition: "background-color 0.2s ease-in-out",
  };

  return (
    <div>
      <div style={containerStyle}>
        {/* Deck count card-like box */}
        <div style={deckCountBoxStyle}>
          <div>{deckCount}</div>
          <div style={{ fontSize: isLaptop ? 10 : 12, marginTop: 4 }}>Cards left</div>
        </div>

        {/* Cards */}
        <div style={cardsContainerStyle}>
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
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}



