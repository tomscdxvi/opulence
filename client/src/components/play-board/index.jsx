import React from "react";

import NobleDeck from "../decks/noble-deck";
import YellowDeck from "../decks/yellow-deck";
import BlueDeck from "../decks/blue-deck";
import GreenDeck from "../decks/green-deck";
import Gems from "../gems";

export default function PlayBoard() {
  return (
		<div style={{ display: "flex" }}>
			<div style={{ display: "grid", marginRight: "24px" }}>
				<Gems />
			</div>
			<div style={{ display: "grid" }}>
				<NobleDeck />
				<BlueDeck />
				<GreenDeck />
				<YellowDeck />
			</div>
		</div>
  	);
}
