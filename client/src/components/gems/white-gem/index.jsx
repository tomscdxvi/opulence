import React, { useState } from "react";

export default function WhiteGem() {
    const [gems, setGems] = useState(8);

    return (
        <>
            <div style={{ display: 'flex', justifyContent: 'start', alignItems: 'center' }}>
                <div style={{ marginRight: '12px' }}>
                    <button>Take</button>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <h4 style={{ marginRight: '6px' }}>White Gem</h4>
                    <h4>{gems}</h4>
                </div>
            </div>
        </>
    );
}
