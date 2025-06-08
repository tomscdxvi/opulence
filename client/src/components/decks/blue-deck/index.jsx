import React, { useState } from 'react'
import BlueCard from '../../cards/blue-card';

const generateRandomCard = () => {
	const gemColors = ['purple', 'green', 'orange', 'white', 'black'];

	const score = Math.floor(Math.random() * 3) + 3;
	const gemType = gemColors[Math.floor(Math.random() * gemColors.length)];

	const cost = {};
	// Randomly add 1–3 gem colors with random values
	const numberOfGemCosts = Math.floor(Math.random() * 3) + 1;
	while (Object.keys(cost).length < numberOfGemCosts) {
		const color = gemColors[Math.floor(Math.random() * gemColors.length)];
		if (!cost[color]) {
			cost[color] = Math.floor(Math.random() * 4) + 3;
		}
	}

	return { score, gemType, cost };
};

export default function BlueDeck() {
	const cards = Array.from({ length: 4 }, () => generateRandomCard());
	const totalCardsInDeck = 20; // Example: total cards in deck

	const getDevelopmentCard = (score, gemType) => {
		alert(`Card clicked | Score: ${score}, Gem Type: ${gemType}`);
	}

	return (
		<div style={{ display: 'flex', alignItems: 'center' }}>
			{/* Deck count on the left */}
			<div style={{
				marginRight: '12px',
				width: '40px',
				height: '60px',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				border: '2px solid #0984e3',
				borderRadius: '8px',
				backgroundColor: '#dff9fb',
				fontWeight: 'bold'
			}}>
				{totalCardsInDeck}
			</div>

			{/* Cards in the current row */}
			<div style={{ display: 'flex' }}>
				{cards.map((card, index) => (
					<BlueCard
						key={index}
						score={card.score}
						gemType={card.gemType}
						cost={card.cost}
						onClick={() => getDevelopmentCard(card.score, card.gemType)}
					/>
				))}
			</div>
		</div>
	);
}

