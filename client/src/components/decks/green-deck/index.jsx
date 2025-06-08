import React, { useState } from 'react'
import GreenCard from '../../cards/green-card';

const generateRandomCard = () => {
	const gemColors = ['purple', 'green', 'orange', 'white', 'black'];

	const score = Math.floor(Math.random() * 2);
	const gemType = gemColors[Math.floor(Math.random() * gemColors.length)];

	const cost = {};
	// Randomly add 1–3 gem colors with random values
	const numberOfGemCosts = Math.floor(Math.random() * 2) + 2;
	while (Object.keys(cost).length < numberOfGemCosts) {
		const color = gemColors[Math.floor(Math.random() * gemColors.length)];
		if (!cost[color]) {
			cost[color] = Math.floor(Math.random() * 3) + 1;
		}
	}

	return { score, gemType, cost };
};

export default function GreenDeck() {
	const cards = Array.from({ length: 4 }, () => generateRandomCard());
	const totalCardsInDeck = 40; // Example: total cards in deck

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
				border: '2px solid #16a085',
				borderRadius: '8px',
				backgroundColor: '#1abc9c',
				fontWeight: 'bold'
			}}>
				{totalCardsInDeck}
			</div>

			{/* Cards in the current row */}
			<div style={{ display: 'flex' }}>
				{cards.map((card, index) => (
					<GreenCard
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

