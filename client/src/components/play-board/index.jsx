import React from "react";

import NobleDeck from "../decks/noble-deck";
import YellowDeck from "../decks/yellow-deck";
import BlueDeck from "../decks/blue-deck";
import GreenDeck from "../decks/green-deck";
import Gems from "../gems";

export default function PlayBoard() {
  return (
		<div
			style={{
				width: "1200px",
				height: "800px",
				border: "2px solid black",
				display: "flex",
				padding: "20px",
				boxSizing: "border-box",
				backgroundColor: "#f5f5f5",
				overflow: "hidden", // or "auto" if scroll is okay
			}}
		>
			<div
				style={{
				display: "grid",
				marginRight: "24px",
				alignItems: "start",
				}}
			>
				<Gems />
			</div>
			<div style={{
				display: "grid",
				gridTemplateRows: "repeat(4, 1fr)",
				rowGap: "12px",
				overflow: "hidden",
			}}>
				<NobleDeck />
				<BlueDeck />
				<YellowDeck />
				<GreenDeck />
			</div>
		</div>
  	);
}
