import React, { useState } from "react";

export default function YellowGem() {
    const [gems, setGems] = useState(8);

    const getGem = (event) => {
        event.preventDefault();

        if(gems > 0) {
            setGems(gems - 1);
        } else {
            console.log("You cannot take anymore gems!");
        }
    }

    return (
        <>
            <div style={{ display: 'flex', justifyContent: 'start', alignItems: 'center' }}>
                <div style={{ marginRight: '12px' }}>
                    <button onClick={getGem}>Take</button>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <h4 style={{ marginRight: '6px' }}>Yellow Gem</h4>
                    <h4>{gems}</h4>
                </div>
            </div>
        </>
    ); 
}
