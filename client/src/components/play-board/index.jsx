// PlayBoard.jsx
import React, { useEffect, useState } from "react";
import { socket } from "../../util/socket";
import { useParams } from "react-router-dom";

import NobleDeck from "../decks/noble-deck";
import CardDeck from "../decks";
import Gems from "../gems";

export default function PlayBoard({ playerId }) {
  const [gameState, setGameState] = useState(null);
  const { roomId } = useParams();

  useEffect(() => {
    socket.emit("request_game_state", { roomId });

    socket.on("update_game_state", (data) => {
      setGameState(data);
    });

    return () => {
      socket.off("update_game_state");
    };
  }, [roomId]);

  const handleCardPurchase = (deckType, index) => {
    const updatedDeck = [...gameState.cardsOnBoard[deckType]];
    const purchasedCard = updatedDeck[index];
    updatedDeck.splice(index, 1);

    const updatedGameState = {
      ...gameState,
      cardsOnBoard: {
        ...gameState.cardsOnBoard,
        [deckType]: updatedDeck,
      },
      players: gameState.players.map((p) =>
        p.id === playerId
          ? {
              ...p,
              cards: [...p.cards, purchasedCard],
            }
          : p
      ),
    };

    setGameState(updatedGameState);

    socket.emit("purchase_card", {
      roomId,
      playerId,
      deckType,
      index,
    });
  };

  if (!gameState) return <div>Loading game...</div>;

  console.log("game state", gameState.cardsOnBoard);
  console.log("players:", gameState.players);

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
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "grid",
          marginRight: "24px",
          alignItems: "start",
        }}
      >
        <Gems gems={gameState.gems} socket={socket} playerId={playerId} />
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateRows: "repeat(4, 1fr)",
          rowGap: "12px",
          overflow: "hidden",
          flex: 1,
        }}
      >
        {["noble", "blue", "yellow", "green"].map((deckType) => (
          <CardDeck
            key={deckType}
            deckType={deckType}
            cards={gameState.cardsOnBoard[deckType] || []}
            onCardClick={handleCardPurchase}
          />
        ))}
      </div>
    </div>
  );
}
