import React, { useMemo } from 'react';

import BGem from '../../../assets/gems/black-gem.png';
import GGem from '../../../assets/gems/green-gem.png';
import PGem from '../../../assets/gems/purple-gem.png';
import OGem from '../../../assets/gems/orange-gem.png';
import WGem from '../../../assets/gems/white-gem.png';

// Background images per gemType
import White1 from '../../../assets/cards/white-card/white-card-bg-1.webp';

import Black1 from '../../../assets/cards/black-cards/black-card-1.jpg';
import Black2 from '../../../assets/cards/black-cards/black-card-2.jpg';
import Black3 from '../../../assets/cards/black-cards/black-card-3.jpg';

import Orange1 from '../../../assets/cards/orange-card/orange-card-1.webp';
import Orange2 from '../../../assets/cards/orange-card/orange-card-2.jpg';
import Orange3 from '../../../assets/cards/orange-card/orange-card-3.jpg';
import Orange4 from '../../../assets/cards/orange-card/orange-card-4.jpg';

import Green1 from '../../../assets/cards/green-cards/green-card-1.jpg';
import Green2 from '../../../assets/cards/green-cards/green-card-2.jpg';
import Green3 from '../../../assets/cards/green-cards/green-card-3.jpg';
import Green4 from '../../../assets/cards/green-cards/green-card-4.jpg';
import Green5 from '../../../assets/cards/green-cards/green-card-5.jpg';

import Purple1 from '../../../assets/cards/purple-cards/purple-card-1.jpg';
import Purple2 from '../../../assets/cards/purple-cards/purple-card-2.jpg';
import Purple3 from '../../../assets/cards/purple-cards/purple-card-3.jpg';
import Purple4 from '../../../assets/cards/purple-cards/purple-card-4.jpg';
import Purple5 from '../../../assets/cards/purple-cards/purple-card-5.jpg';

// Gem icons
const gemImages = {
    black: BGem,
    green: GGem,
    purple: PGem,
    orange: OGem,
    white: WGem,
};

// Background images (can expand each array with more images)
const gemBackgrounds = {
    black: [Black1, Black2, Black3],
    green: [Green1, Green2, Green3, Green4, Green5],
    purple: [Purple1, Purple2, Purple3, Purple4, Purple5],
    orange: [Orange1, Orange2, Orange3, Orange4],
    white: [White1],
};

export default function GreenCard({ score, gemType, cost, onClick }) {
    // Memoize random background for stable image per render
    const backgroundImage = useMemo(() => {
        const images = gemBackgrounds[gemType] || [];
        if (images.length === 0) return null;
        const randomIndex = Math.floor(Math.random() * images.length);
        return images[randomIndex];
    }, [gemType]);

    return (
        <div
            onClick={onClick}
            style={{
                width: '200px',
                height: '150px',
                border: `2px solid ${gemType === 'green' ? 'lightgreen' : 'black'}`,
                borderRadius: '8px',
                marginRight: '12px',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '8px',
                color: 'white',
                zIndex: 1,
            }}
        >
            {/* Background image */}
            {backgroundImage && (
                <img
                src={backgroundImage}
                alt={`${gemType} card background`}
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

            {/* Content */}
            <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                zIndex: 1,
                position: 'relative',
                height: '28px'
            }}>
                <div style={{ height: '28px', display: 'flex', alignItems: 'center' }}>
                    <h4 style={{ margin: 0 }}>{score > 0 ? score : '\u00A0'}</h4> {/* non-breaking space if no score */}
                </div>
                {gemImages[gemType] ? (
                    <img src={gemImages[gemType]} alt={`${gemType} gem`} style={{ width: '32px', height: '32px' }} />
                ) : (
                    <h5 style={{ margin: 0 }}>{gemType}</h5>
                )}
            </div>


            {/* Cost List */}
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
