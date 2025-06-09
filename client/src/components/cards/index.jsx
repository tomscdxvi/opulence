// CardComponent.jsx

import React, { useMemo } from 'react';

import BGem from '../../assets/gems/black-gem.png';
import GGem from '../../assets/gems/green-gem.png';
import PGem from '../../assets/gems/purple-gem.png';
import OGem from '../../assets/gems/orange-gem.png';
import WGem from '../../assets/gems/white-gem.png';

import Noble1 from '../../assets/cards/nobles/miner.jpg';

import White1 from '../../assets/cards/white-card/white-card-bg-1.webp';

import Black1 from '../../assets/cards/black-cards/black-card-1.jpg';
import Black2 from '../../assets/cards/black-cards/black-card-2.jpg';
import Black3 from '../../assets/cards/black-cards/black-card-3.jpg';

import Orange1 from '../../assets/cards/orange-card/orange-card-1.webp';
import Orange2 from '../../assets/cards/orange-card/orange-card-2.jpg';
import Orange3 from '../../assets/cards/orange-card/orange-card-3.jpg';
import Orange4 from '../../assets/cards/orange-card/orange-card-4.jpg';

import Green1 from '../../assets/cards/green-cards/green-card-1.jpg';
import Green2 from '../../assets/cards/green-cards/green-card-2.jpg';
import Green3 from '../../assets/cards/green-cards/green-card-3.jpg';
import Green4 from '../../assets/cards/green-cards/green-card-4.jpg';
import Green5 from '../../assets/cards/green-cards/green-card-5.jpg';

import Purple1 from '../../assets/cards/purple-cards/purple-card-1.jpg';
import Purple2 from '../../assets/cards/purple-cards/purple-card-2.jpg';
import Purple3 from '../../assets/cards/purple-cards/purple-card-3.jpg';
import Purple4 from '../../assets/cards/purple-cards/purple-card-4.jpg';
import Purple5 from '../../assets/cards/purple-cards/purple-card-5.jpg';

const gemImages = {
  black: BGem,
  green: GGem,
  purple: PGem,
  orange: OGem,
  white: WGem,
};

const gemBackgrounds = {
    noble: [Noble1],
    black: [Black1, Black2, Black3],
    green: [Green1, Green2, Green3, Green4, Green5],
    purple: [Purple1, Purple2, Purple3, Purple4, Purple5],
    orange: [Orange1, Orange2, Orange3, Orange4],
    white: [White1],
};

export default function CardComponent({ deckType, score, gemType, cost, onClick, disabled = false }) {
    const backgroundImage = useMemo(() => {
        const images = gemBackgrounds[gemType] || [];
        if (images.length === 0) return null;
        const randomIndex = Math.floor(Math.random() * images.length);
        return images[randomIndex];
    }, [gemType]);

  return (
    <div
      onClick={!disabled ? onClick : undefined}
      style={{
        width: '200px',
        height: '150px',
        border: `2px solid black`, // always black border
        borderRadius: '8px',
        marginRight: '12px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '8px',
        color: 'white',
        zIndex: 1,
        opacity: disabled ? 0.5 : 1,
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        boxShadow: disabled ? 'none' : 'rgba(0, 0, 0, 0.1) 0px 4px 12px',
        transform: disabled ? 'scale(1)' : 'scale(1)',
      }}
      onMouseEnter={(e) => {
        if (!disabled) e.currentTarget.style.transform = 'scale(0.85)';
      }}
      onMouseLeave={(e) => {
        if (!disabled) e.currentTarget.style.transform = 'scale(1)';
      }}
    >
      {/* Background image */}
      {backgroundImage && (
        <img
          src={backgroundImage}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            zIndex: 0,
            opacity: 0.85,
          }}
        />
      )}

      {/* Top section: score and gem icon */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 1,
          position: 'relative',
          height: '28px',
        }}
      >
        <div style={{ height: '28px', display: 'flex', alignItems: 'center' }}>
          <h4 style={{ margin: 0 }}>{score > 0 ? score : '\u00A0'}</h4>
        </div>
        {gemImages[gemType] ? (
          <img src={gemImages[gemType]} alt={`${gemType} gem`} style={{ width: '32px', height: '32px' }} />
        ) : (
          <h5 style={{ margin: 0 }}>{gemType === "noble" ? "" : gemType}</h5>
        )}
      </div>

      {/* Bottom section: cost */}
      <ul style={{ listStyleType: 'none', padding: 0, margin: 0, zIndex: 1 }}>
        {Object.entries(cost).map(([color, amount]) => (
          <li key={color} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {gemImages[color] ? (
              <img src={gemImages[color]} alt={`${color} gem`} style={{ width: '24px', height: '24px', marginBottom: '6px' }} />
            ) : (
              <span>{color}</span>
            )}
            <span>{amount}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
