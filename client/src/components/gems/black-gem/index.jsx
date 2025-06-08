import React, { useState } from "react";
import Gem from '../../../assets/gems/black-gem.png';

export default function BlackGem() {
    const [gems, setGems] = useState(7);

    const getGem = (event) => {
        event.preventDefault();

        if(gems > 0) {
            setGems(gems - 1);
        } else {
            console.log("You cannot take anymore gems!");
        }
    }

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'start', alignItems: 'center' }}>
                <div style={{ marginRight: '12px' }}>
                    <button onClick={getGem}>Take</button>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <img src={Gem} width={50} style={{ marginRight: '12px'}} />
                    <h4>{gems}</h4>
                </div>
            </div>
        </div>
    );
}
