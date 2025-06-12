import React from "react";

import BGem from '../../assets/gems/black-gem.png';
import GGem from '../../assets/gems/green-gem.png';
import PGem from '../../assets/gems/purple-gem.png';
import OGem from '../../assets/gems/orange-gem.png';
import WGem from '../../assets/gems/white-gem.png';

const gemImages = {
  black: BGem,
  green: GGem,
  purple: PGem,
  orange: OGem,
  white: WGem,
};

export default function PurchasedCards({ cards }) {
  if (!cards || cards.length === 0) return <div>No cards purchased yet.</div>;

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", padding: "8px" }}>
      {cards.map((card) => (
        <div key={card.id} style={{ border: "1px solid #ccc", padding: "6px", borderRadius: "8px", width: "100px", textAlign: "center", background: "#fff" }}>
          <div style={{ fontWeight: "bold" }}>{card.id}</div>
          <div style={{ fontWeight: "bold" }}>{card.score} Points</div>
          {card.gemType && (
            <img
              src={gemImages[card.gemType]}
              alt={card.gemType}
              width={24}
              style={{ marginTop: "4px" }}
            />
          )}
        </div>
      ))}
    </div>
  );
}
