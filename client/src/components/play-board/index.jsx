import React, { useEffect, useState } from "react";
import { socket } from "../../util/socket";
import { useParams } from "react-router-dom";

import PlayerHand from "../player-hand";
import NobleDeck from "../decks/noble-deck";
import CardDeck from "../decks";
import Gems from "../gems";


import gemImages from "../gems/gems";

function CurrentPlayerPanel({ player }) {
  if (!player) return null;

  return (
    <div
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: "#fff",
        borderTop: "2px solid #ccc",
        padding: "12px 24px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        boxShadow: "0 -2px 5px rgba(0,0,0,0.1)",
        zIndex: 10,
      }}
    >
      <div>
        <strong>{player.username || "You"}</strong> — Score: {player.score || 0}
      </div>

      {/* GEM DISPLAY */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {Object.entries(player.gems || {}).map(([gem, count]) => {
          if (gem === "_id") return null; // skip the MongoDB object ID

          const gemImg = gemImages[gem];
          return (
            <div key={gem} style={{ display: 'flex', alignItems: 'center', marginRight: 12 }}>
              <img src={gemImg} alt={`${gem} gem`} width={32} style={{ marginRight: 4 }} />
              <span style={{ fontWeight: 'bold', fontSize: 16 }}>{count}</span>
            </div>
          );
        })}
      </div>

      {player.isTurn && (
        <div style={{ color: "green", fontWeight: "bold" }}>Your Turn!</div>
      )}
    </div>
  );
}

export default function PlayBoard({ gameState, currentPlayerId }) {

  const { roomId } = useParams();

  if (!gameState) return <div>Loading game...</div>;

  const playersArray = Object.values(gameState.players || {});
  const currentPlayer = playersArray.find((p) => p.socketId === currentPlayerId);
  const playerId = currentPlayerId;

  // Sanity checks
  if (!currentPlayer) return <div>Could not find current player</div>;

  const handleTakeGem = (gemName) => {
    socket.emit("player_action", {
      action: "collect_gem",
      gem: gemName,
      roomId,
      playerId
    });
  };

  const handleSkipTurn = () => {
    socket.emit("player_action", {
      action: "skip_turn",
      roomId,
      playerId: currentPlayer.id,
    });
  };

  console.log('gameState:', gameState);
  // console.log('players:', playersArray);
  console.log('currentPlayer:', currentPlayer);
  // console.log('cardsOnBoard:', gameState.cardsOnBoard);
  console.log('gems:', gameState.gemBank);
  console.log(currentPlayer)

  // console.log("Player IDs:", playersArray.map(p => p.socketId));

  const deckCounts = {};
  const decks = gameState.decks || {};
  const cardsOnBoard = gameState.cardsOnBoard || {};

  ["noble", "blue", "yellow", "green"].forEach(deckType => {
    deckCounts[deckType] = (decks[deckType]?.length) || 0;
  });

  console.log("decks:", deckCounts);

  return (
    <>

      <div
      style={{
        width: "1400px",
        height: "800px",
        border: "2px solid black",
        display: "flex",
        padding: "20px",
        boxSizing: "border-box",
        backgroundColor: "#f5f5f5",
        overflow: "hidden",
        position: "relative", // important for CurrentPlayerPanel absolute positioning
      }}
    >
      {/* Existing UI */}
      <div style={{ display: "grid", marginRight: "24px", alignItems: "start" }}>
        <Gems
          gemBank={gameState.gemBank}
          currentPlayer={currentPlayer}
          currentPlayerId={currentPlayerId}
          roomId={roomId}
          playerId={playerId}
        />
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
            cards={cardsOnBoard[deckType] || []}
            deckCount={deckCounts[deckType]}
            onCardClick={(deckType, index) => {
              // purchase logic
            }}
            onReserveClick={(deckType, index) => {
              // reserve logic
            }}
          />
        ))}
        </div>
      </div>

      {/* 
      <div
        style={{
          position: "relative",
          width: "20%",
          height: "100%",
          pointerEvents: "none",
        }}
      >
        {playersArray.map((p) => (
          <PlayerHand
            key={p.socketId}
            player={p}
            side={
              p.socketId === playerId
                ? "bottom"
                : p.socketId === playersArray[1]?.socketId
                ? "left"
                : p.socketId === playersArray[2]?.socketId
                ? "top"
                : "right"
            }
            isCurrentPlayer={p.socketId === playerId}
            pointerEvents="auto"
          />
        ))}
      </div>
      */}

      {currentPlayer?.isTurn && (
        <div style={{ marginTop: "12px" }}>
          <button
            onClick={handleSkipTurn}
            style={{
              padding: "10px 16px",
              fontSize: "16px",
              fontWeight: "bold",
              backgroundColor: "#f44336",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            Skip Turn
          </button>
        </div>
      )}

      <CurrentPlayerPanel player={currentPlayer} />
    </>
  );
}
