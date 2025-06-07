import React, { useState } from 'react'

export default function YellowDeck() {
	const [cards, setCards] = useState([
		"Card 1",
		"Card 2", 
		"Card 3",
		"Card 4",
		"Card 5"
	]);

	return (
		<div style={{ display: 'flex' }}>
		<div
			style={{ width: '100px', height: '100px', display: 'flex', justifyContent: 'center', alignItems: 'center', border: '1px black solid', marginRight: '24px', backgroundColor: 'lightyellow' }}
		>
			Yellow Deck
		</div>
		{cards.map((card, index) => (
			<div 
			key={index}
			style={{ width: '100px', height: '100px', display: 'flex', justifyContent: 'center', alignItems: 'center', border: '1px black solid', marginRight: '12px' }}
			>
			{card}
			</div>
		))}
		</div>
	)
}

