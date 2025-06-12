import React from "react";
import CardComponent from "../cards";

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
    <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
        {cards.map((card) => (
            <CardComponent
              key={card.id}
              score={card.score ?? 0}
              gemType={card.gemType}
              cost={{}} // dummy cost to not show it
              onClick={() => onCardClick?.(card.id)}
              variant="purchased" // optional: use this if you want different styles
            />
        ))}
    </div>
  );
}
