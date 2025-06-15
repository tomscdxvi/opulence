import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { socket } from "../../util/socket";
import { useParams } from "react-router-dom";

import useWindowSize from "../../util/useWindowSize";
import PlayerHand from "../player-hand";
import NobleDeck from "../decks/noble-deck";
import CardDeck from "../decks";
import Gems from "../gems";
import PurchasedCards from "../purchased-cards";
import ReservedCards from "../reserved-cards";
import GameOverModal from "../game-over";

import gemImages from "../gems/gems";

import TurnBell from '../../assets/sounds/turn.wav';

  // TODO: Chatbox to match playboard
  // TODO: Messages start from bottom to up
  // TODO: Make playboard responsive to different screensize 
  // TODO: Gem amount in currentplayer and all users set color
  // TODO: Currentplayer name and score set color
  // TODO: Limit to 4 players

function CurrentPlayerPanel({ player, isMyTurn, onClick, onCardClick }) {
  const [expanded, setExpanded] = useState(false);
  const [hover, setHover] = React.useState(false);

  if (!player) return null;

  return (
    <div
      onClick={() => setExpanded(prev => !prev)}
      style={{
        position: "fixed", // changed from absolute to fixed
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(255, 255, 255, 1)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: '8px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
        borderTop: "2px solid #ccc",
        padding: "12px 24px",
        zIndex: 10,
        transition: "height 0.3s ease",
        cursor: "pointer",
        color: '#2C3A47',
        zIndex: 999
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
      </div>

      {/* EXPANDED SECTION */}
      {expanded && (
        <div style={{ marginTop: 12 }}>
          <h4 style={{ marginBottom: 8 }}>Your Purchased Cards</h4>
          <PurchasedCards cards={player.cards} />

          <h4 style={{ marginBottom: 8, marginTop: 16 }}>Your Reserved Cards</h4>
          <ReservedCards 
            cards={player.reservedCards}   
            onCardClick={(cardId) => {
              if (isMyTurn) onCardClick(cardId);
            }} />
        </div>
      )}
    </div>
  );
}

function AllPlayersPanel({ players, isOpen, toggleOpen }) {
  return (
    <div
      onClick={toggleOpen}
      style={{
        position: "fixed",
        top: '50%',
        right: isOpen ? 0 : -250,
        width: 250,
        height: "50%",
        backgroundColor: "#ffffff",
        boxShadow: "0 0 10px rgba(0,0,0,0.2)",
        padding: "12px",
        overflowY: "auto",
        transition: "right 0.3s ease-in-out",
        transform: 'translateY(-50%)',
        zIndex: 20,
        cursor: "pointer",
        color: '#2C3A47',
      }}
    >
      <h3 style={{ textAlign: "center", marginBottom: 12 }}>All Players</h3>

      {/* Prevent player details from bubbling click */}
      <div onClick={(e) => e.stopPropagation()}>
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
    </div>
  );
}

// Helper to convert a turnLog entry to a readable message string
function renderLogMessage(log) {
  switch (log.action) {
    case 'reserve_card': {
      const gemImg = gemImages[log.details.gemType];
      return (
        <>
          <strong>{log.player}</strong> reserved <strong>{log.details.cardId}</strong>{' '}
          Gem:{' '}
          <img
            src={gemImg}
            alt={log.details.gemType}
            width={16}
            style={{ verticalAlign: 'middle', marginRight: 4 }}
          />
          | {log.details.cardScore}
        </>
      );
    }
    case 'purchase_card': {
      const gemImg = gemImages[log.details.gemType];
      return (
        <>
          <strong>{log.player}</strong> purchased <strong>{log.details.cardId}</strong>{' '}
          {' '}
          <img
            src={gemImg}
            alt={log.details.gemType}
            width={16}
            style={{ verticalAlign: 'middle', marginRight: 4 }}
          />
          | {log.details.cardScore}
        </>
      );
    }
    case 'collect_gems': {
      const collected = Object.entries(log.details.gemsCollected || {});
      return (
        <>
          <strong>{log.player}</strong> collected{' '}
          {collected.map(([gem, count]) => (
            <span key={gem} style={{ marginRight: 8 }}>
              <img
                src={gemImages[gem]}
                alt={gem}
                width={16}
                style={{ verticalAlign: 'middle', marginRight: 2 }}
              />
              {count}
            </span>
          ))}
        </>
      );
    }
    case 'skip_turn':
      return `${log.player} skipped their turn.`;
    default:
      return `${log.player} performed an action.`;
  }
}

export default function PlayBoard({ gameState, playerId }) {

  const { roomId } = useParams();

  const { width, isMobile, isTablet, isLaptop } = useWindowSize();

  const isSmallScreen = isMobile || isTablet;

  const mainContainerStyle = {
    width: "85vw",               // slightly smaller than 90vw
    maxWidth: "1300px",          // better fit for typical laptops
    height: isSmallScreen ? "auto" : "80vh",   // reduce from 90vh
    maxHeight: isSmallScreen ? "none" : "800px", // reduce from 800px
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    padding: isSmallScreen ? "0" : "24px",             // reduce padding from 24px
    marginTop: "24px",
    borderRadius: "16px",
    boxShadow: "0 8px 20px rgba(0,0,0,0.2)",
    color: "white",
    position: "relative",
    display: "flex",
    flexDirection: isSmallScreen ? "column" : "row",
    gap: "16px",
    overflow: "hidden",
    boxSizing: "border-box",
  };
  
  const gameBoardStyle = {
    display: "grid",
    gridTemplateRows: "repeat(4, 1fr)",
    rowGap: "12px",
    overflow: "hidden",
    flex: 1,
  };

  const chatBoxWrapperStyle = {
    height: isSmallScreen ? "auto" : "80vh", // from 80vh
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-end",
    marginTop: isSmallScreen ? "16px" : "24px",
    marginLeft: isSmallScreen ? 0 : "2px",
    padding: '0px 6px 0 6px',
    zIndex: 2
  };

  const chatLogStyle = {
    height: "400px",        // from 450px
    maxWidth: "320px",      // from 350px
    overflowY: "auto",
    wordBreak: "break-all",
    padding: "8px",         // from 12px
    fontSize: "13px",       // from 14px
    color: "#2C3A47",
  };

  // Add a state to track if a wild gem confirmation prompt is active
  const [wildGemPrompt, setWildGemPrompt] = useState(null); // { message, cardId } or null
  const [showAllPlayers, setShowAllPlayers] = useState(false);

  const [isMuted, setIsMuted] = useState(false);
  const isMutedRef = useRef(isMuted);

  const prevIsMyTurnRef = useRef(false);
  const hasMountedRef = useRef(false);

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  const [selectedCard, setSelectedCard] = useState(null);
  const [selectedDeckType, setSelectedDeckType] = useState(null);
  const [showActionModal, setShowActionModal] = useState(false);

  const combinedMessages = useMemo(() => {
    if (!gameState?.turnLog) return messages;

    // Map turn logs to message-like objects
    const logsAsMessages = gameState.turnLog.map(log => ({
        sender: 'System',
        text: renderLogMessage(log),
        timestamp: new Date(log.timestamp).getTime()
      }));

      // Combine chat + logs
      const all = [...messages, ...logsAsMessages];

      // Sort by timestamp ascending
      return all.sort((a, b) => a.timestamp - b.timestamp);
  }, [messages, gameState?.turnLog]);

  const [gameOverData, setGameOverData] = useState(null);

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

    socket.on('receive_message', ({ sender, text }) => {
      setMessages((prev) => [...prev, { 
        sender, 
        text,
        timestamp: new Date().getTime(), // capture at time of arrival
      }]);

      // Only play the sound if the message is from someone else
      if (sender !== currentPlayer.username && !isMuted) {
        playChatSound();
      }
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
      socket.off('receive_message');
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
  

  useEffect(() => {
    console.log('Scrolling into view');
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    });
  }, [combinedMessages]);

  if (!gameState) return <div>Loading game...</div>;
  if (!gameState.players) return <div>Waiting for players to join...</div>;
  
  // Sanity checks
  if (!currentPlayer) {
    return (
      <div style={{ width: '100%', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1 }}>
        <div>
          <h2 style={{ color: '#2C3A47' }}>The room may be closed or expired.</h2>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <button 
              style={{               
                backgroundColor: '#2d3436',
                color: '#fff',
                padding: '10px 16px',
                borderRadius: '6px',
                border: 'none',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => (e.target.style.backgroundColor = '#636e72')}
              onMouseLeave={(e) => (e.target.style.backgroundColor = '#2d3436')}
              onClick={() => window.location.href = '/'

            }>Return Home</button>
          </div>
        </div>
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

  const sendMessage = () => {
    if (input.trim()) {
      socket.emit('send_message', { room: roomId, message: input });
      setInput('');
    }
  };

  console.log('gameState:', gameState);
  // console.log('players:', playersArray);
  console.log('currentPlayer:', currentPlayer);
  // console.log('cardsOnBoard:', gameState.cardsOnBoard);
  console.log('gems:', gameState.gemBank);
  console.log("current player username", currentPlayer.username);
  console.log("turn log:", gameState.turnLog);

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
        <div style={mainContainerStyle}>
          {/* Gems Panel */}
          <div style={{ display: "grid", alignItems: "start" }}>
            <Gems
              gemBank={gameState.gemBank}
              currentPlayer={currentPlayer}
              currentPlayerId={playerId}
              roomId={roomId}
              playerId={playerId}
            />
          </div>

          {/* Card Decks */}
          <div style={gameBoardStyle}>
            {["noble", "blue", "yellow", "green"].map((deckType) => (
              <CardDeck
                key={deckType}
                deckType={deckType}
                cards={cardsOnBoard[deckType] || []}
                deckCount={deckCounts[deckType]}
                isMyTurn={isMyTurn}
                /*
                onCardClick={(deckType, index) => {
                  const card = cardsOnBoard[deckType][index];
                  if (card) handlePurchaseCard(card.id);
                }}
                onReserveClick={(deckType, index) => {
                  const card = cardsOnBoard[deckType][index];
                  if (card) handleReserveCard(card.id);
                }}
                reservedCount={currentPlayer?.reservedCards?.length || 0}
                */
                 onCardClick={(deckType, index) => {
                  if (!isMyTurn) return; // 🔒 Block interaction when it's not your turn

                  const card = cardsOnBoard[deckType][index];
                  if (card) {
                    setSelectedCard(card);
                    setSelectedDeckType(deckType);
                    setShowActionModal(true);
                  }
                }}
              />
            ))}
          </div>
        </div>

        {/* Mute Button */}
        <button
          onClick={() => setIsMuted((prev) => !prev)}
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            backgroundColor: "#eee",
            border: "none",
            borderRadius: "6px",
            padding: "8px 12px",
            cursor: "pointer",
          }}
        >
          {isMuted ? "🔇 Muted" : "🔊 Sound On"}
        </button>

        {/* All Players Panel */}
        <AllPlayersPanel
          players={playersArray}
          isOpen={showAllPlayers}
          toggleOpen={() => setShowAllPlayers((prev) => !prev)}
        />

        {/* Current Player Panel */}
        <CurrentPlayerPanel
          player={currentPlayer}
          isMyTurn={isMyTurn}
          onClick={handleSkipTurn}
          onCardClick={handlePurchaseCard}
        />

        {/* Chat + Input */}
        <div style={chatBoxWrapperStyle}>
          <div style={chatLogStyle}>
            {combinedMessages.map((msg, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "flex-end",
                  marginBottom: "8px",
                  padding: "12px",
                  backgroundColor: "rgba(255, 255, 255, 1)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  borderRadius: "8px",
                  color: "#2C3A47"
                }}
              >
                <span style={{ fontSize: "12px" }}>
                  [{new Date(msg.timestamp).toLocaleTimeString()}]{" "}
                  <strong>{msg.sender}:</strong> {msg.text}
                </span>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div
            style={{
              marginTop: "20px",
              display: "flex",
              gap: "8px",
              alignItems: "center",
              padding: "0 8px",
            }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              style={{
                flex: 1,
                padding: "10px 12px",
                fontSize: "14px",
                backgroundColor: "rgba(255, 255, 255, 1)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                borderRadius: "8px",
                color: "#2C3A47",
              }}
            />
            <button
              onClick={sendMessage}
              style={{
                padding: "10px 16px",
                backgroundColor: "#2d3436",
                color: "white",
                borderRadius: "8px",
                border: "none",
                fontSize: "14px",
                fontWeight: "bold",
                cursor: "pointer",
              }}
              onMouseEnter={(e) =>
                (e.target.style.backgroundColor = "#636e72")
              }
              onMouseLeave={(e) =>
                (e.target.style.backgroundColor = "#2d3436")
              }
            >
              Send
            </button>
          </div>
        </div>

        {/* Modals */}
        {wildGemPrompt && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
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
              }}
            >
              <p>{wildGemPrompt.message}</p>
              <button onClick={() => handleConfirmWildUse(true)}>Yes</button>
              <button onClick={() => handleConfirmWildUse(false)}>No</button>
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

        {showActionModal && selectedCard && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 9999,
            }}
          >
            <div
              style={{
                backgroundColor: "white",
                padding: "24px",
                borderRadius: "12px",
                width: "300px",
                textAlign: "center",
                boxShadow: "0 6px 18px rgba(0,0,0,0.3)",
              }}
            >
              <h3>Choose an Action</h3>
              <p>What would you like to do with this card?</p>

              <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
                <button
                  style={{ padding: "8px", backgroundColor: "#2980b9", color: "white", border: "none", borderRadius: "6px" }}
                  onClick={() => {
                    handlePurchaseCard(selectedCard.id);
                    setShowActionModal(false);
                    setSelectedCard(null);
                    setSelectedDeckType(null);
                  }}
                >
                  Purchase
                </button>

                {selectedDeckType !== "noble" && (currentPlayer?.reservedCards?.length || 0) < 3 && (
                  <button
                    style={{ padding: "8px", backgroundColor: "#2c3e50", color: "white", border: "none", borderRadius: "6px" }}
                    onClick={() => {
                      handleReserveCard(selectedCard.id);
                      setShowActionModal(false);
                      setSelectedCard(null);
                      setSelectedDeckType(null);
                    }}
                  >
                    Reserve
                  </button>
                )}

                <button
                  style={{ padding: "8px", backgroundColor: "#bdc3c7", color: "#2c3e50", border: "none", borderRadius: "6px" }}
                  onClick={() => {
                    setShowActionModal(false);
                    setSelectedCard(null);
                    setSelectedDeckType(null);
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}


        {gameOverData && (
          <GameOverModal
            winner={gameOverData.winner}
            finalScore={gameOverData.finalScore}
          />
        )}
      </>
    );
}
