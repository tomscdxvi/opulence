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


export default function ReservedCards({ cards, onCardClick }) {
  if (!cards || cards.length === 0) {
    return <div>No reserved cards.</div>;
  }

  return (
    <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
        {cards.map((card) => (
            <CardComponent
                key={card.id}
                score={card.points ?? 0}
                gemType={card.gemType}
                cost={Object.fromEntries(Object.entries(card.cost || {}).filter(([_, amt]) => amt > 0))}
                onClick={() => onCardClick?.(card.id)}
                variant="reserved" // optional: use this if you want different styles
            />
        ))}
    </div>
  );
}
