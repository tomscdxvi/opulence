import React, { useEffect, useState, useRef, useCallback } from "react";
import { socket } from "../../util/socket";
import { useParams } from "react-router-dom";

import PlayerHand from "../player-hand";
import NobleDeck from "../decks/noble-deck";
import CardDeck from "../decks";
import Gems from "../gems";
import PurchasedCards from "../purchased-cards";
import ReservedCards from "../reserved-cards";
import GameOverModal from "../game-over";

import gemImages from "../gems/gems";

import TurnBell from '../../assets/sounds/turn.wav';

// TODO: Cards are showing all gems even though it should show the card.cost gems only

function CurrentPlayerPanel({ player, isMyTurn, onClick }) {
  const [expanded, setExpanded] = useState(false);
  const [hover, setHover] = React.useState(false);

  if (!player) return null;

  return (
    <div
      style={{
        position: "fixed", // changed from absolute to fixed
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: "#fff",
        borderTop: "2px solid #ccc",
        padding: "12px 24px",
        boxShadow: "0 -2px 5px rgba(0,0,0,0.1)",
        zIndex: 10,
        transition: "height 0.3s ease",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div>
            {isMyTurn && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <div style={{ color: "green", fontWeight: "bold" }}>Your Turn!</div>
              </div>
            )}
            <div>
              <strong>{player.username || "You"}</strong> — Score: {player.score || 0}
            </div>
          </div>

          {isMyTurn && (
            <div style={{ marginTop: "12px", marginLeft: '24px' }}>
              <button
                onClick={onClick}
                onMouseEnter={() => setHover(true)}
                onMouseLeave={() => setHover(false)}
                style={{
                  padding: "10px 12px",
                  fontSize: "12px",
                  fontWeight: "bold",
                  backgroundColor: hover ? "#fc5c65" : "#eb3b5a",  // darker red on hover
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  zIndex: 999,
                  transition: "background-color 0.2s ease",
                }}
              >
                Skip Turn
              </button>
            </div>
          )}
        </div>

        {/* GEM DISPLAY */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {Object.entries(player.gems || {}).map(([gem, count]) => {
            if (gem === "_id") return null;
            const gemImg = gemImages[gem];
            return (
              <div key={gem} style={{ display: 'flex', alignItems: 'center', marginRight: 12 }}>
                <img src={gemImg} alt={`${gem} gem`} width={32} style={{ marginRight: 4 }} />
                <span style={{ fontWeight: 'bold', fontSize: 16 }}>{count}</span>
              </div>
            );
          })}
        </div>

        {/* TOGGLE BUTTON */}
        <div
          onClick={() => setExpanded(prev => !prev)}
          style={{
            marginLeft: 16,
            fontSize: 24,
            background: "none",
            border: "none",
            cursor: "pointer",
            transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s",
          }}
          title={expanded ? "Hide Details" : "Show Details"}
        >
          ⬆️
        </div>
      </div>

      {/* EXPANDED SECTION */}
      {expanded && (
        <div style={{ marginTop: 12 }}>
          <h4 style={{ marginBottom: 8 }}>Your Purchased Cards</h4>
          <PurchasedCards cards={player.cards} />

          <h4 style={{ marginBottom: 8, marginTop: 16 }}>Your Reserved Cards</h4>
          <ReservedCards cards={player.reservedCards} />
        </div>
      )}
    </div>
  );
}

function AllPlayersPanel({ players, isOpen, toggleOpen }) {
  return (
    <>
      <div
        style={{
          position: "fixed",
          top: '50%',
          right: isOpen ? 0 : -300, // slide in/out
          width: 300,
          height: "50%",
          backgroundColor: "#ffffff",
          boxShadow: "0 0 10px rgba(0,0,0,0.2)",
          padding: "12px",
          overflowY: "auto",
          transition: "right 0.3s ease-in-out",
          transform: 'translateY(-50%)',
          zIndex: 20,
        }}
      >
        <h3 style={{ textAlign: "center" }}>All Players</h3>
        {players.map((player) => (
          <div
            key={player.socketId}
            style={{
              borderBottom: "1px solid #ddd",
              padding: "8px 0",
              marginBottom: "8px",
            }}
          >
            <div><strong>{player.username}</strong> — Score: {player.score}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', marginTop: 4 }}>
              {Object.entries(player.gems || {}).map(([gem, count]) => {
                if (gem === "_id") return null;
                const gemImg = gemImages[gem];
                return (
                  <div
                    key={gem}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      marginRight: 8,
                      marginBottom: 4,
                    }}
                  >
                    <img src={gemImg} alt={gem} width={24} style={{ marginRight: 4 }} />
                    <span>{count}</span>
                  </div>
                );
              })}
            </div>
            <div style={{ fontSize: "12px", marginTop: 4 }}>
              <span>Cards: {Object.keys(player.cards || {}).length}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Toggle Arrow Button */}
      <div
        onClick={toggleOpen}
        style={{
          position: "fixed",
          top: "50%",
          right: isOpen ? 300 : 0, // right at the panel edge or screen edge
          transform: "translateY(-50%)",
          transition: "right 0.3s ease-in-out",
          background: "#fff",
          border: "1px solid #ccc",
          borderRadius: "4px 0 0 4px",
          padding: "8px 10px",
          cursor: "pointer",
          zIndex: 25,
          boxShadow: "0 0 4px rgba(0,0,0,0.3)",
        }}
      >
        {isOpen ? "➡️" : "⬅️"}
      </div>
    </>
  );
}

export default function PlayBoard({ gameState, playerId }) {

  const { roomId } = useParams();

  // Add a state to track if a wild gem confirmation prompt is active
  const [wildGemPrompt, setWildGemPrompt] = useState(null); // { message, cardId } or null
  const [showAllPlayers, setShowAllPlayers] = useState(false);

  const [isMuted, setIsMuted] = useState(false);
  const isMutedRef = useRef(isMuted);

  const prevIsMyTurnRef = useRef(false);
  const hasMountedRef = useRef(false);
  const [gameOverData, setGameOverData] = useState(null)

  const playersArray = Object.values(gameState?.players ?? {});
  const currentPlayer = playersArray.find((p) => p.socketId === playerId);
  const isMyTurn = gameState?.currentPlayerId === playerId;

  const [nobleChoices, setNobleChoices] = useState([]);

  useEffect(() => {
    // Listen for the backend prompt to confirm wild gem use
    socket.on("prompt_use_wild_gem", ({ message, cardId }) => {
      setWildGemPrompt({ message, cardId });
    });

    socket.on("prompt_noble_selection", ({ nobles }) => {
      setNobleChoices(nobles);
    });

    socket.on("game_over", (data) => {
      setGameOverData(data); // { winner, finalScore }
    });

    socket.on('noble_claimed', ({ playerId, noble }) => {
      // Show animation or toast message
      if (playerId === socket.id) {
        toast.success(`🏛️ You have claimed a noble: ${noble.id}!`);
      } else {
        toast.info(`🏛️ Another player has claimed noble ${noble.id}`);
      }

      // Optional: highlight noble briefly in UI
    });

    return () => {
      socket.off("prompt_use_wild_gem");
      socket.off("noble_claimed");
      socket.off("prompt_noble_selection");
      socket.off("game_over");
    };
  }, []);

  const playTurnSound = useCallback(() => {
    if (!isMutedRef.current) {
      const audio = new Audio(TurnBell);
      audio.play().catch(err => {
        console.warn('Sound failed to play:', err);
      });
    }
  }, []);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

    if (!prevIsMyTurnRef.current && isMyTurn) {
      playTurnSound();
    }

    prevIsMyTurnRef.current = isMyTurn;
  }, [isMyTurn]);


  if (!gameState) return <div>Loading game...</div>;
  if (!gameState.players) return <div>Waiting for players to join...</div>;
  
  // Sanity checks
  if (!currentPlayer) {
    return (
      <div style={{ textAlign: 'center', marginTop: '100px' }}>
        <h2>The room may be closed or expired.</h2>
        <button onClick={() => window.location.href = '/'}>Return Home</button>
      </div>
    );
  }

  const handleConfirmWildUse = (confirm) => {
    if (!wildGemPrompt) return;

    if (confirm) {
      socket.emit("player_action", {
        roomId,
        action: "purchase_card",
        payload: { cardId: wildGemPrompt.cardId, confirmWildUse: true },
      });
    }
    setWildGemPrompt(null);
  };

  const handlePurchaseCard = (cardId) => {

    // console.log("card id:", cardId);
    socket.emit("player_action", {
      roomId,
      action: "purchase_card",
      payload: { cardId },
    });
    
  };

  const handleReserveCard = (cardId) => {

    console.log("card id:", cardId);
    socket.emit("player_action", {
      roomId,
      action: "reserve_card",
      payload: { cardId },
    });
  };

  const handleNobleSelect = (nobleId) => {
    socket.emit("confirm_noble_selection", {
      roomId,
      nobleId
    });
    setNobleChoices([]); // Close modal
  };

  const handleCancel = () => {
    setNobleChoices([]);
  };

  const handleSkipTurn = () => {
    socket.emit("player_action", {
      roomId,
      action: "skip_turn"
    });
  };

  console.log('gameState:', gameState);
  // console.log('players:', playersArray);
  console.log('currentPlayer:', currentPlayer);
  // console.log('cardsOnBoard:', gameState.cardsOnBoard);
  console.log('gems:', gameState.gemBank);
  console.log(currentPlayer);

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
          currentPlayerId={playerId}
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
            isMyTurn={isMyTurn}
            onCardClick={(deckType, index) => {
              // Purchase the card at cardsOnBoard[deckType][index]
              const card = cardsOnBoard[deckType][index];
              if (card) handlePurchaseCard(card.id);

              console.log("Cards in deck:", cardsOnBoard[deckType].map(card => card.id));
            }}
            onReserveClick={(deckType, index) => {

              // Reserve the card at cardsOnBoard[deckType][index]
              const card = cardsOnBoard[deckType][index];
              console.log("Card cost for", card.id, card.cost);
              if (card) handleReserveCard(card.id);
            }}
            reservedCount={currentPlayer?.reservedCards?.length || 0}
          />
        ))}
        </div>
      </div>

      {wildGemPrompt && (
        <div
          style={{
            position: "fixed",
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: 20,
              borderRadius: 8,
              maxWidth: 400,
              textAlign: "center",
              boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
            }}
          >
            <p>{wildGemPrompt.message}</p>
            <button
              onClick={() => handleConfirmWildUse(true)}
              style={{
                marginRight: 10,
                padding: "8px 16px",
                backgroundColor: "green",
                color: "white",
                border: "none",
                borderRadius: 5,
                cursor: "pointer",
              }}
            >
              Yes
            </button>
            <button
              onClick={() => handleConfirmWildUse(false)}
              style={{
                padding: "8px 16px",
                backgroundColor: "gray",
                color: "white",
                border: "none",
                borderRadius: 5,
                cursor: "pointer",
              }}
            >
              No
            </button>
          </div>
        </div>
      )}

      {nobleChoices.length > 0 && (
        <NobleSelectionModal
          nobles={nobleChoices}
          onSelect={handleNobleSelect}
          onCancel={handleCancel}
        />
      )}

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

        <button
          onClick={() => setIsMuted((prev) => !prev)}
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            backgroundColor: '#eee',
            border: 'none',
            borderRadius: '6px',
            padding: '8px 12px',
            cursor: 'pointer',
          }}
        >
          {isMuted ? '🔇 Muted' : '🔊 Sound On'}
        </button>

      <AllPlayersPanel
        players={playersArray}
        isOpen={showAllPlayers}
        toggleOpen={() => setShowAllPlayers((prev) => !prev)}
      />

      <CurrentPlayerPanel player={currentPlayer} isMyTurn={isMyTurn} onClick={handleSkipTurn} />

      
      {gameOverData && (
        <GameOverModal
          winner={gameOverData.winner}
          finalScore={gameOverData.finalScore}
        />
      )}
    </>
  );
}
