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


export default function ReservedCards({ cards }) {
  if (!cards || cards.length === 0) {
    return <div>No reserved cards.</div>;
  }

  return (
    <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
      {cards.map((card) => (
        <div
          key={card.id}
          style={{
            width: 80,
            height: 120,
            backgroundColor: "#fff",
            border: "2px solid #555",
            borderRadius: 8,
            padding: 8,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            alignItems: "center",
            boxShadow: "2px 2px 6px rgba(0, 0, 0, 0.2)",
          }}
        >
          <div style={{ fontWeight: "bold", fontSize: 14 }}>
            {card.points ?? 0}
          </div>
          <div>{card.color?.toUpperCase()}</div>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: "4px",
              marginTop: 4,
            }}
          >
            {card.cost &&
              Object.entries(card.cost || {})
                .filter(([_, amt]) => amt > 0)
                .map(([gem, amt]) => (
                    <div key={gem} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <img src={gemImages[gem]} alt={gem} width={16} height={16} />
                        <span>{amt}</span>
                    </div>
                ))}
          </div>
        </div>
      ))}
    </div>
  );
}
