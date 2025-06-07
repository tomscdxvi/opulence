import React, { useState } from "react";

export default function BlueGem() {
    const [gems, setGems] = useState(8);

    return (
        <>
            <div style={{ display: 'flex', justifyContent: 'start', alignItems: 'center' }}>
                <div style={{ marginRight: '12px' }}>
                    <button>Take</button>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <h4 style={{ marginRight: '6px' }}>Blue Gem</h4>
                    <h4>{gems}</h4>
                </div>
            </div>
        </>
    );
}
