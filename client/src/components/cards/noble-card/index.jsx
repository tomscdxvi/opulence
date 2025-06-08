import React from 'react';
import BGem from '../../../assets/gems/black-gem.png';
import GGem from '../../../assets/gems/green-gem.png';
import PGem from '../../../assets/gems/purple-gem.png';
import OGem from '../../../assets/gems/orange-gem.png';
import WGem from '../../../assets/gems/white-gem.png';
import MinerNoble from '../../../assets/nobles/miner.jpg';

// Map color names to gem image imports
const gemImages = {
    black: BGem,
    green: GGem,
    purple: PGem,
    orange: OGem,
    white: WGem,
};

export default function NobleCard({ score, cost, onClick }) {
    return (
        <div 
            onClick={onClick}
            style={{
                width: '200px',
                height: '150px',
                border: '2px solid black',
                borderRadius: '8px',
                marginRight: '12px',
                backgroundColor: '#fefefe',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '8px',
                backgroundImage: `url(${MinerNoble})`,
                backgroundSize: 'cover',         // Fit the image to the card
                backgroundPosition: 'center',    // Center the image
                backgroundRepeat: 'no-repeat',   // Prevent repeating
                color: 'white',
            }}
        >
            {/* Top Section */}
            <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: 0,
                margin: 0,
                height: '28px'  // Ensures consistent height
            }}>
                <div style={{ height: '28px', display: 'flex', alignItems: 'center' }}>
                    <h4 style={{ margin: 0, color: 'white' }}>{score > 0 ? score : '\u00A0'}</h4> {/* non-breaking space if no score */}
                </div>
            </div>

            {/* Cost List */}
            <ul style={{ listStyleType: 'none', padding: 0, margin: 0 }}>
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
