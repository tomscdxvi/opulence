// src/components/decks/CardDeck.jsx

import React from "react";
import CardComponent from "../cards";

export default function CardDeck({ deckType, cards, onCardClick }) {

    console.log(deckType, cards);
  return (
    <div>
      {/* <h3 style={{ textTransform: "capitalize" }}>{deckType} Deck</h3> */}
      <div style={{ display: "flex", gap: "8px", overflowX: "auto" }}>
        {cards.length === 0 && <div>No cards available</div>}
        {cards.map((card, index) => (
            <CardComponent
                key={card.id || index}
                deckType={deckType}
                score={card.points}
                gemType={card.gemType}
                cost={card.cost || {}} // make sure the card has a `cost` field
                onClick={() => onCardClick(deckType, index)}
            />
        ))}
      </div>
    </div>
  );
}
