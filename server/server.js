// server.js

import { createServer } from "http";
import { Server } from "socket.io";
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { nanoid } from "nanoid";
import mongoose from "mongoose";
import fs from "fs";

import Room from './models/Room.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:5173", "https://opulence-one.vercel.app"],
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

// Load static game data
const cardsData = JSON.parse(fs.readFileSync(new URL('./util/cards.json', import.meta.url), 'utf8'));
const gemsData = JSON.parse(fs.readFileSync(new URL('./util/gems.json', import.meta.url), 'utf8'));

// In-memory socket-to-room map for quick lookup
const socketToRoom = new Map();

// Shuffle helper (Fisher-Yates)
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// Helper: total number of gems a player has (including wild)
function totalGems(gems) {
  return Object.values(gems).reduce((sum, val) => sum + val, 0);
}

// Check if it's the player's turn
function isPlayersTurn(room, socketId) {
  return room.currentPlayerId === socketId;
}

// Lock helpers to prevent concurrent actions
async function acquireLock(room) {
  if (room.locked) {
    return false;
  }
  room.locked = true;
  await room.save();
  return true;
}

async function releaseLock(room) {
  room.locked = false;
  await room.save();
}

// Advance turn and update mustReturnGems flag for next player
async function advanceTurn(room) {
  if (!room.playerOrder?.length) {
    room.currentPlayerId = null;
    await room.save();
    return;
  }

  const currentIndex = room.playerOrder.indexOf(room.currentPlayerId);
  if (currentIndex === -1) {
    room.currentPlayerId = room.playerOrder[0];
  } else {
    room.currentPlayerId = room.playerOrder[(currentIndex + 1) % room.playerOrder.length];
  }

  // Update mustReturnGems for the new player if they exceed 10 gems
  const nextPlayer = room.players.find(p => p.socketId === room.currentPlayerId);
  if (nextPlayer) {
    nextPlayer.mustReturnGems = totalGems(nextPlayer.gems) > 10;
  }

  await room.save();
}

function checkWinCondition(player) {
  return player.score >= 15;
}

// Validate gem selection against Splendor rules
function validateGemSelection(room, gemSelection) {
  const gemsTaken = Object.entries(gemSelection).filter(([_, count]) => count > 0);
  const totalTaken = gemsTaken.reduce((sum, [_, count]) => sum + count, 0);

  if (totalTaken === 3) {
    // Must take 3 different gems, each exactly 1
    if (gemsTaken.length !== 3) return false;
    if (gemsTaken.some(([_, count]) => count !== 1)) return false;
  } else if (totalTaken === 2) {
    // Must take 2 gems of the same type and bank must have at least 4 of that gem
    if (gemsTaken.length !== 1) return false;
    const [gem, count] = gemsTaken[0];
    if (count !== 2) return false;
    if ((room.gemBank.get(gem) ?? 0) < 4) return false;
  } else {
    // Invalid amount of gems taken
    return false;
  }

  return true;
}

// Collect gems action
async function collectGems(io, roomId, socketId, gemSelection) {
  // Fetch the room object from the database
  const room = await Room.findById(roomId);

  if (!room) {
    io.to(socketId).emit('error_message', 'Room not found.');
    return false;
  }

  // Defensive: make sure players array exists
  const players = room.players || [];

  // Find the player by socketId
  const player = players.find(p => p.socketId === socketId);
  if (!player) {
    io.to(socketId).emit('error_message', 'Player not found in room.');
    return false;
  }

  // Check if it's the player's turn
  if (!isPlayersTurn(room, socketId)) {
    io.to(socketId).emit('error_message', 'It is not your turn.');
    return false;
  }

  // Check if player must return gems before collecting more
  if (player.mustReturnGems) {
    io.to(socketId).emit('error_message', 'You must return gems before collecting more.');
    return false;
  }

  // Validate the gem selection
  if (!validateGemSelection(room, gemSelection)) {
    io.to(socketId).emit('error_message', 'Invalid gem selection according to game rules.');
    return false;
  }

  // Calculate total gems after collection
  const gemsCollected = Object.values(gemSelection).reduce((sum, val) => sum + val, 0);
  const currentGems = totalGems(player.gems);
  const totalAfter = currentGems + gemsCollected;

  if (totalAfter > 10) {
    io.to(socketId).emit('error_message', 'You cannot collect gems that would exceed the 10 gem limit.');
    return false;
  }

  // Update gem bank and player gems atomically
  for (const [gem, amount] of Object.entries(gemSelection)) {
    const bankAmount = room.gemBank.get(gem) ?? 0;
    if (bankAmount < amount) {
      io.to(socketId).emit('error_message', `Not enough ${gem} gems available.`);
      return false;
    }
  }

  // If all checks pass, update gems
  for (const [gem, amount] of Object.entries(gemSelection)) {
    const bankAmount = room.gemBank.get(gem) ?? 0;
    room.gemBank.set(gem, bankAmount - amount);
    player.gems[gem] = (player.gems[gem] || 0) + amount;
  }

  // Log the action
  room.turnLog.push({
    player: player.username,
    action: 'collect_gems',
    details: { gemsCollected: gemSelection },
    timestamp: new Date(),
  });

  await room.save();

  // ✅ emit updated game state to all players in the room
  emitGameState(io, room);

  return true;
}

// Check if player can afford a card with discounts and wild gems
function canAfford(card, player) {
  const discount = player.cardGems || {};
  let missing = 0;

  for (const [gem, amount] of Object.entries(card.cost)) {
    const discountAmount = discount[gem] || 0;
    const required = Math.max(0, amount - discountAmount);
    const have = player.gems[gem] || 0;

    if (have < required) {
      missing += required - have;
    }
  }

  const wildGems = player.gems.wild || 0;
  if (missing > wildGems) {
    return { canBuy: false, missing, needsWild: wildGems > 0 };
  }

  console.log("checking affordability:", {
    cardCost: card.cost,
    playerGems: player.gems,
    discount,
    missing,
    wildGems
  });

  return { canBuy: true, missing, needsWild: missing > 0 };
}

function getEligibleNobles(player, nobleCards) {
  return nobleCards.filter(noble => {
    return Object.entries(noble.cost).every(([gem, amount]) => {
      return (player.cardGems[gem] || 0) >= amount;
    });
  });
}

// Purchase a card action, with wild gem usage confirmation
async function purchaseCard(io, roomId, socketId, cardId, confirmWildUse = false) {
  // Fetch the room object from the database
  const room = await Room.findById(roomId);

  if (!room) {
    io.to(socketId).emit('error_message', 'Room not found.');
    return false;
  }

  // Defensive: make sure players array exists
  const players = room.players || [];

  // Find the player by socketId
  const player = players.find(p => p.socketId === socketId);
  if (!player) {
    io.to(socketId).emit('error_message', 'Player not found in room.');
    return false;
  }

  if (!isPlayersTurn(room, socketId)) {
    io.to(socketId).emit('error_message', 'It is not your turn.');
    return false;
  }

  if (room.locked) {
    io.to(socketId).emit('error_message', 'Another action is being processed. Please wait.');
    return false;
  }

  if (!(await acquireLock(room))) {
    io.to(socketId).emit('error_message', 'Unable to acquire action lock. Try again.');
    return false;
  }

  let cardToBuy;
  let cardSourceType;

  for (const type of room.cardsOnBoard.keys()) {
    const cards = room.cardsOnBoard.get(type);
    const found = cards.find(card => card.id === cardId);
    if (found) {
      cardToBuy = found;
      cardSourceType = type;
      break;
    }
  }

  if (!cardToBuy) {
    cardToBuy = player.reservedCards.find(card => card.id === cardId);
    if (!cardToBuy) {
      io.to(socketId).emit('error_message', 'Card not found on board or in your reserved cards.');
      await releaseLock(room);
      return false;
    }
  }

  const affordCheck = canAfford(cardToBuy, player);
  if (!affordCheck.canBuy) {
    io.to(socketId).emit('error_message', `You cannot afford this card. Missing gems: ${affordCheck.missing}`);
    await releaseLock(room);
    return false;
  }


  // If wild gems needed and confirmation is not given, prompt user to confirm
  if (affordCheck.needsWild && !confirmWildUse) {
    io.to(socketId).emit('prompt_use_wild_gem', {
      message: `You need to use ${affordCheck.missing} wild gems to complete this purchase. Confirm?`,
      cardId,
    });
    await releaseLock(room);
    return false;
  }

  // Deduct cost from player gems and wild gems, add back to gem bank
  for (const [gem, amount] of Object.entries(cardToBuy.cost)) {
    const discountAmount = player.cardGems[gem] || 0;
    const discountedCost = Math.max(0, amount - discountAmount);

    let payFromGems = Math.min(player.gems[gem] || 0, discountedCost);
    player.gems[gem] = (player.gems[gem] || 0) - payFromGems;
    room.gemBank.set(gem, (room.gemBank.get(gem) ?? 0) + payFromGems);

    const remaining = discountedCost - payFromGems;
    if (remaining > 0) {
      player.gems.wild = (player.gems.wild || 0) - remaining;
      room.gemBank.set('wild', (room.gemBank.get('wild') ?? 0) + remaining);
    }
  }

  console.log("Card To Buy", cardToBuy);
  // Add card to player's owned cards & update cardGems count
  player.cards.push(cardToBuy);
  if (cardToBuy.gemType) {
    player.cardGems[cardToBuy.gemType] = (player.cardGems[cardToBuy.gemType] || 0) + 1;
  }

  // Update player score
  player.score += cardToBuy.score || 0;

  // Remove card from board or reserved cards
  if (cardSourceType) {
    const boardCards = room.cardsOnBoard.get(cardSourceType);
    const cardIndex = boardCards.findIndex(c => c.id === cardId);

    if (cardIndex !== -1) {
      // Replace purchased card with new card from deck
      if (room.decks.has(cardSourceType) && room.decks.get(cardSourceType).length > 0) {
        const nextCard = room.decks.get(cardSourceType).shift();
        boardCards[cardIndex] = nextCard;
      } else {
        // No more cards in deck, just remove the card
        boardCards.splice(cardIndex, 1);
      }

      room.cardsOnBoard.set(cardSourceType, boardCards);
    }
  } else {
    player.reservedCards = player.reservedCards.filter(card => card.id !== cardId);
  }

  // 🏛️ Check for noble eligibility
  const noblesOnBoard = room.cardsOnBoard.get('noble') || [];
  const eligibleNobles = getEligibleNobles(player, noblesOnBoard);

  // Only allow claiming one noble per turn
  // if (eligibleNobles.length > 0) {
  //   const noble = eligibleNobles[0]; // Pick the first eligible noble

  //   player.cards.push(noble); // Add noble to player's cards
  //   player.score += noble.score || 0;

  //   // Remove the noble from the board
  //   const updatedNobles = noblesOnBoard.filter(n => n.id !== noble.id);
  //   room.cardsOnBoard.set('noble', updatedNobles);

  //   room.turnLog.push({
  //     player: player.username,
  //     action: 'claim_noble',
  //     details: { nobleId: noble.id },
  //     timestamp: new Date(),
  //   });

  //   console.log(`🏛️ Player ${player.username} has claimed noble ${noble.id}`);

  //   // Send visual feedback to frontend
  //   io.in(room._id).emit('noble_claimed', {
  //     playerId: player.socketId,
  //     noble
  //   });
  // }

  // Multiple Nobles
  if (eligibleNobles.length === 1) {
    const noble = eligibleNobles[0];

    player.cards.push(noble);
    player.score += noble.score || 0;

    const updatedNobles = noblesOnBoard.filter(n => n.id !== noble.id);
    room.cardsOnBoard.set('noble', updatedNobles);

    room.turnLog.push({
      player: player.username,
      action: 'claim_noble',
      details: { nobleId: noble.id },
      timestamp: new Date(),
    });

    io.in(room._id).emit('noble_claimed', {
      playerId: player.socketId,
      noble
    });

  } else if (eligibleNobles.length > 1) {
    // Let frontend show manual selection modal
    io.to(player.socketId).emit("prompt_noble_selection", {
      nobles: eligibleNobles,
    });

    await releaseLock(room);
    return false; // Stop further processing until noble is selected
  }


  // 🏆 Check for win after the purchase
  if (checkWinCondition(player)) {
    room.winner = player.username;
    room.gameOver = true;

    await room.save();

    io.in(room._id).emit("game_over", {
      winner: player.username,
      finalScore: player.score,
    });

    console.log(`Player ${player.username} has won the game!`);
  }

  // Log purchase
  room.turnLog.push({
    player: player.username,
    action: 'purchase_card',
    details: { 
      cardId: cardId,
      gemType: cardToBuy.gemType,
      cardScore: cardToBuy.score || 0
    },
    timestamp: new Date(),
  });

  room.markModified('players');

  await room.save();
  await releaseLock(room);

  // ✅ emit updated game state to all players in the room
  emitGameState(io, room);

  return true;
}

// Reserve a card action
async function reserveCard(io, roomId, socketId, cardId) {
  // Fetch the room object from the database
  const room = await Room.findById(roomId);

  if (!room) {
    io.to(socketId).emit('error_message', 'Room not found.');
    return false;
  }

  // Defensive: make sure players array exists
  const players = room.players || [];

  // Find the player by socketId
  const player = players.find(p => p.socketId === socketId);
  if (!player) {
    io.to(socketId).emit('error_message', 'Player not found in room.');
    return false;
  }

  if (!isPlayersTurn(room, socketId)) {
    io.to(socketId).emit('error_message', 'It is not your turn.');
    return false;
  }

  if (player.reservedCards.length >= 3) {
    io.to(socketId).emit('error_message', 'You can only reserve up to 3 cards.');
    return false;
  }

  let cardToReserve = null;
  let source = null;

  if (cardId) {
    for (const type of room.cardsOnBoard.keys()) {
      const cards = room.cardsOnBoard.get(type);
      const found = cards.find(card => card.id === cardId);
      if (found) {
        cardToReserve = found;
        source = { type, from: 'board' };
        break;
      }
    }
    if (!cardToReserve) {
      io.to(socketId).emit('error_message', 'Card not found on board.');
      return false;
    }
  } else if (deckType && room.decks.has(deckType) && room.decks.get(deckType).length > 0) {
    cardToReserve = room.decks.get(deckType).shift();
    source = { type: deckType, from: 'deck' };
  } else {
    io.to(socketId).emit('error_message', 'Invalid reserve request.');
    return false;
  }

  console.log("Reserving card cost", cardToReserve.cost);

  player.reservedCards.push(cardToReserve);

  // Give wild gem if available
  if ((room.gemBank.get('wild') ?? 0) > 0) {
    room.gemBank.set('wild', room.gemBank.get('wild') - 1);
    player.gems.wild = (player.gems.wild || 0) + 1;
  }

  // Remove from board and refill if from board
  if (source.from === 'board') {
    const boardCards = room.cardsOnBoard.get(source.type);
    const index = boardCards.findIndex(c => c.id === cardToReserve.id);

    if (index !== -1) {
      boardCards.splice(index, 1); // Remove reserved card

      if (room.decks.has(source.type) && room.decks.get(source.type).length > 0) {
        const nextCard = room.decks.get(source.type).shift();
        boardCards.splice(index, 0, nextCard); // Replace at same index
      }
    }

    room.cardsOnBoard.set(source.type, boardCards);
  }


  // Log reserve
  room.turnLog.push({
    player: player.username,
    action: 'reserve_card',
    details: {
      cardId: cardToReserve.id,
      gemType: cardToReserve.gemType,
      cardScore: cardToReserve.score,
      source: source.from,
      type: source.type,
    },
    timestamp: new Date(),
  });

  room.markModified('players');

  await room.save();

  // ✅ emit updated game state to all players in the room
  emitGameState(io, room);

  return true;
}

// Skip turn action
async function skipTurn(io, roomId, socketId) {

  // Fetch the room object from the database
  const room = await Room.findById(roomId);

  if (!room) {
    io.to(socketId).emit('error_message', 'Room not found.');
    return false;
  }

  // Defensive: make sure players array exists
  const players = room.players || [];
  
  // Find the player by socketId
  const player = players.find(p => p.socketId === socketId);
  if (!player) {
    io.to(socketId).emit('error_message', 'Player not found in room.');
    return false;
  }

  // Check if it's the player's turn
  if (!isPlayersTurn(room, socketId)) {
    io.to(socketId).emit('error_message', 'It is not your turn.');
    return false;
  }

  console.log(`Player ${player.username} is skipping their turn.`);

  room.turnLog.push({
    player: player.username,
    action: 'skip_turn',
    details: {},
    timestamp: new Date(),
  });
  
  await room.save();

  // ✅ emit updated game state to all players in the room
  emitGameState(io, room);

  return true;
}

function emitGameState(io, room) {

  if (!room) {
    console.error('emitGameState called with null room');
    return;
  }

  const gameState = {
    players: room.players,
    cardsOnBoard: room.cardsOnBoard,
    decks: room.decks,
    currentPlayerId: room.currentPlayerId,
    turnLog: room.turnLog,
    gemBank: room.gemBank,
    gameStarted: room.gameStarted,
    playerOrder: room.playerOrder,
  };

  // console.log(`Emitting game state to room ${room._id}`, gameState);

  io.in(room._id).emit('update_game_state', gameState);
}

// Socket.io connection
io.on('connection', (socket) => {
  // console.log(`User connected: ${socket.id}`);

  // Create Room
  socket.on('create_room', async (callback) => {
    try {
      const roomId = nanoid(6);

      // Create new Room with empty game state, players as an empty array
      const newRoom = new Room({
        _id: roomId,
        decks: {},
        cardsOnBoard: {},
        gemBank: {},
        players: [],           // <-- array now
        playerOrder: [],
        currentPlayerId: null,
        turnLog: [],
        host: socket.id,
        gameStarted: false,
      });

      await newRoom.save();

      socket.join(roomId);
      socketToRoom.set(socket.id, roomId);

      emitGameState(io, newRoom);

      // console.log(`Room created: ${roomId}, host: ${socket.id}`);
      callback(roomId);
    } catch (error) {
      console.error('Error creating room:', error);
      callback(null, 'Failed to create room');
    }
  });

  // Check if room exists
  socket.on('check_room_exists', async (roomId, callback) => {
    try {
      const roomExists = await Room.exists({ _id: roomId });
      callback(!!roomExists);
    } catch (error) {
      console.error('Error checking room existence:', error);
      callback(false);
    }
  });

  socket.on("check_room_status", async ({ roomId }, callback) => {
    const room = await Room.findById(roomId);

    if (!room) {
      return callback({ error: "room_not_found" });
    }

    if (room.gameStarted) {
      return callback({ error: "game_already_started" });
    }

    return callback({ ok: true });
  });

  socket.on('join_room', async ({ roomId, username }, callback) => {
    try {
      const room = await Room.findById(roomId);
      if (!room) {
        // Safely check if callback is a function before calling it
        if (typeof callback === 'function') {
          return callback({ error: 'room_not_found' });
        }
        return;
      }

      if (room.locked) return callback({ error: 'room_locked' });

      // 🚫 Check if game has already started
      if (room.gameStarted) {
        if (typeof callback === 'function') {
          return callback({ error: "game_already_started" });
        }

        return;
      }

      socket.join(roomId);
      socketToRoom.set(socket.id, roomId);
      socket.username = username;

      // Find existing player by username
      const existingPlayer = room.players.find(p => p.username === username);

      if (existingPlayer) {
        // Player reconnecting: update socketId
        const oldSocketId = existingPlayer.socketId;
        existingPlayer.socketId = socket.id;

        // Update playerOrder to replace old socketId with new socket.id
        const index = room.playerOrder.indexOf(oldSocketId);
        if (index !== -1) {
          room.playerOrder[index] = socket.id;
        }

        // Update currentPlayerId if it matches oldSocketId
        if (room.currentPlayerId === oldSocketId) {
          room.currentPlayerId = socket.id;
        }

        // Update host if reconnecting player was host
        if (room.host === oldSocketId) {
          room.host = socket.id;
        }
      } else {
        // New player joining
        room.players.push({
          socketId: socket.id,
          username,
          score: 0,
          gems: { white: 0, blue: 0, green: 0, orange: 0, black: 0, purple: 0, gold: 0 },
          cards: [],
          reservedCards: [],
        });

        // Add new player's socket.id to playerOrder
        room.playerOrder.push(socket.id);
      }

      const isHost = room.host === socket.id;
      socket.emit('host_status', isHost);

      // Fix currentPlayerId if null
      if (!room.currentPlayerId) {
        room.currentPlayerId = room.playerOrder[0];
      }

      await room.save();

      const usernames = room.players.map(p => p.username);
      io.in(roomId).emit('update_players', usernames);
      io.in(roomId).emit('update_current_player', room.currentPlayerId);
      emitGameState(io, room);

      // console.log(`User ${username} (${socket.id}) joined/reconnected to room ${roomId}`);
    } catch (error) {
      console.error('Error joining room:', error);
      socket.emit('error_message', 'Failed to join room');
    }
  });

  socket.on('toggle_room_lock', async ({ roomId }, callback) => {
    const room = await Room.findById(roomId);
    if (!room) return callback({ error: 'room_not_found' });

    if (socket.id !== room.host) return callback({ error: 'not_host' });

    room.locked = !room.locked;
    await room.save();

    io.in(roomId).emit('room_lock_status', room.locked); // Broadcast to all clients
    callback({ success: true, locked: room.locked });
  });

  // Leave Room
  socket.on('leave_room', async () => {
    const roomId = socketToRoom.get(socket.id);
    if (!roomId) return;

    try {
      const room = await Room.findById(roomId);
      if (!room) return;

      // Find the leaving player
      const player = room.players.find(p => p.socketId === socket.id);
      const username = player ? player.username : 'Unknown';

      // Remove player from players array
      room.players = room.players.filter(p => p.socketId !== socket.id);

      // Remove from playerOrder array
      if (Array.isArray(room.playerOrder)) {
        room.playerOrder = room.playerOrder.filter(id => id !== socket.id);
      }

      // Check if host left
      const isHost = room.playerOrder.length === 0 || (room.playerOrder[0] === socket.id);

      if (isHost) {
        // Delete room if host leaves
        await Room.findByIdAndDelete(roomId);

        // console.log(`Emitting room_closed for room ${roomId}`);
        io.in(roomId).emit('receive_message', `System: Host ${username} left. Room is closed.`);
        io.in(roomId).emit('room_closed');
        // console.log(`Room ${roomId} deleted because host left.`);
      } else {
        // Update currentPlayerId if needed
        if (room.currentPlayerId === socket.id) {
          room.currentPlayerId = room.playerOrder.length > 0 ? room.playerOrder[0] : null;
        }

        await room.save();

        // Emit updated player list and current player
        const usernames = room.players.map(p => p.username);
        io.in(roomId).emit('update_players', usernames);
        io.in(roomId).emit('update_current_player', room.currentPlayerId);

        // Notify others that player left
        io.in(roomId).emit('receive_message', `${username} has left the room.`);
      }

      socket.leave(roomId);
      socketToRoom.delete(socket.id);

      // console.log(`User ${username} (${socket.id}) left room ${roomId}`);
    } catch (error) {
      console.error('Error leaving room:', error);
    }
  });

  // Start Game (host only)
  socket.on('start_game', async (roomId, callback) => {
    try {
      const room = await Room.findById(roomId);
      if (!room) {
        // Inform client room doesn't exist
        if (callback) callback({ error: 'room_not_found' });
        return;
      }

      if (room.host !== socket.id) {
        socket.emit('error_message', 'Only the host can start the game.');
        return;
      }

      // Initialize decks and cardsOnBoard
      const decks = {};
      const cardsOnBoard = {};
      for (const type in cardsData) {
        const deck = [...cardsData[type]];
        shuffle(deck);
        decks[type] = deck;
        cardsOnBoard[type] = deck.splice(0, 4);
      }

      // Gem bank from static data
      const gemBank = { ...gemsData };

      // Update room state
      room.gameStarted = true;
      room.decks = decks;
      room.cardsOnBoard = cardsOnBoard;
      room.gemBank = gemBank;

      if (!room.playerOrder || room.playerOrder.length === 0) {
        room.playerOrder = room.players.map(p => p.socketId);
      }
      if (!room.currentPlayerId) {
        room.currentPlayerId = room.playerOrder[0];
      }

      await room.save();

      // Emit start_game event with current game state
      emitGameState(io, room);

      // Let clients know to transition screens
      io.in(room._id).emit('start_game');

      // console.log(`Game started in room ${roomId}`);
    } catch (error) {
      console.error('Error starting game:', error);
    }
  });

  socket.on("confirm_noble_selection", async ({ roomId, nobleId }) => {
    const room = await Room.findById(roomId);
    if (!room) return;

    const player = room.players.find(p => p.socketId === socket.id);
    if (!player) return;

    const noblesOnBoard = room.cardsOnBoard.get("noble") || [];
    const noble = noblesOnBoard.find(n => n.id === nobleId);

    if (!noble) {
      io.to(socket.id).emit("error_message", "Selected noble not found.");
      return;
    }

    const eligible = getEligibleNobles(player, noblesOnBoard).some(n => n.id === nobleId);
    if (!eligible) {
      io.to(socket.id).emit("error_message", "You are not eligible for this noble.");
      return;
    }

    player.cards.push(noble);
    player.score += noble.score || 0;

    const updatedNobles = noblesOnBoard.filter(n => n.id !== noble.id);
    room.cardsOnBoard.set('noble', updatedNobles);

    room.turnLog.push({
      player: player.username,
      action: 'claim_noble',
      details: { nobleId: noble.id },
      timestamp: new Date(),
    });

    io.in(room._id).emit('noble_claimed', {
      playerId: player.socketId,
      noble
    });

    await room.save();

    emitGameState(io, room);

    await advanceTurn(room); // ✅ Add this so the turn progresses properly
  });


  // Handle player actions (collect gems, purchase, skip turn)
  socket.on('player_action', async ({ roomId, action, payload }) => {
    try {
      const room = await Room.findById(roomId);
      if (!room) return;

      const socketId = socket.id;
      const player = room.players.find(p => p.socketId === socketId);
      if (!player) return;

      if (room.currentPlayerId !== socketId) {
        socket.emit('error_message', 'Not your turn.');
        return;
      }

      let actionSucceeded = false;

      switch (action) {
        case 'collect_gems':
          actionSucceeded = await collectGems(io, room, socketId, payload.selectedGems);
          break;

        case 'purchase_card':
          const confirmWildUse = payload.confirmWildUse || false;
          actionSucceeded = await purchaseCard(io, room, socketId, payload.cardId, confirmWildUse);
          break;

        case 'reserve_card':
          actionSucceeded = await reserveCard(io, room, socketId, payload.cardId);
          break;

        case 'skip_turn':
          actionSucceeded = await skipTurn(io, room, socketId);
          console.log("Received skip_turn action from", socketId);
          break;

        default:
          socket.emit('player_action_result', {
            action,
            success: false,
            message: 'Invalid action.',
          });
          return;
      }

      console.log('Action:', action, 'Succeeded:', actionSucceeded);


      // Emit result back to the player who performed the action
      socket.emit('player_action_result', {
        action,
        success: actionSucceeded,
        message: actionSucceeded ? null : 'Action failed.',
      });

      if (actionSucceeded) {

        io.to(room).emit('receive_turn_log', room.turnLog);

        await advanceTurn(room);
        
        // Reload the updated room after action completes
        const updatedRoom = await Room.findById(roomId);

        emitGameState(io, updatedRoom);

        io.in(roomId).emit('update_current_player', updatedRoom.currentPlayerId);
      }

      if (room.gameOver) {
        io.to(socketId).emit("error_message", "Game is over.");

        return false;
      }

    } catch (error) {
      console.error('Error handling player_action:', error);
      socket.emit('error_message', 'An error occurred while processing the action.');
    }
  });

  // Request current game state
  socket.on('request_game_state', async ({ roomId }) => {
    try {
      const room = await Room.findById(roomId);

      if (room) {
        emitGameState(io, room);
      }

      if (!room) {
        // Create initial state from static data
        const decks = {};
        const cardsOnBoard = {};

        for (const type in cardsData) {
          const deck = [...cardsData[type]];
          shuffle(deck);
          decks[type] = deck;
          cardsOnBoard[type] = deck.splice(0, 4);
        }

        socket.emit('update_game_state', {
          decks,
          cardsOnBoard,
          gemBank: { ...gemsData },
          currentPlayerId: null,
          players: [],
          turnLog: [],
          gameStarted: false,
          playerOrder: [],
        });
        return;
      }

      emitGameState(io, room);
    } catch (error) {
      console.error('Error fetching game state:', error);
      socket.emit('error_message', 'Failed to fetch game state');
    }
  });

  // Here is the send_message handler you want:
  socket.on('send_message', ({ room, message }) => {
    if (!room || !message) return;

    const sender = socket.username || 'Anonymous';

    const messageData = {
      sender,
      text: message,
    };

    io.to(room).emit('receive_message', messageData);
  });

  socket.on('reconnect_player', async ({ roomId, username }) => {
    try {
      const room = await Room.findById(roomId);
      if (!room) {
        socket.emit('error_message', 'Room not found');
        return;
      }

      // Find player by username
      const player = room.players.find(p => p.username === username);
      if (!player) {
        socket.emit('error_message', 'Player not found in room');
        return;
      }

      // Update player's socketId to new socket.id
      player.socketId = socket.id;

      await room.save();

      // Update socketToRoom mapping
      socketToRoom.set(socket.id, roomId);

      // Notify updated players list to everyone in room
      const usernames = room.players.map(p => p.username);
      io.in(roomId).emit('update_players', usernames);

      // Optionally send success message to this client
      socket.emit('reconnect_success');

      // console.log(`Player ${username} reconnected with new socket ID ${socket.id}`);
    } catch (error) {
      console.error('Error on reconnect_player:', error);
      socket.emit('error_message', 'Internal server error during reconnect');
    }
  });


  // Delay player removal for reconnect window
  socket.on('disconnect', async () => {
    const socketId = socket.id;
    const roomId = socketToRoom.get(socketId);
    if (!roomId) return;

    try {
      const room = await Room.findById(roomId);
      if (!room) return;

      const player = room.players.find(p => p.socketId === socketId);
      const username = player?.username ?? 'Unknown';
      const isHost = socketId === room.host;

      if (isHost) {
        // Notify host
        io.to(socketId).emit('room_closed', {
          message: `You (host) have disconnected. Room is now closed.`,
        });

        // Notify others
        socket.to(roomId).emit('receive_message', {
          sender: 'System',
          text: `Host ${username} disconnected. Room is closed.`,
        });
        socket.to(roomId).emit('room_closed');

        await Room.findByIdAndDelete(roomId);
        // console.log(`Room ${roomId} deleted because host disconnected.`);
        return;
      }

      // Non-host: allow reconnect window
      setTimeout(async () => {
        const roomAfterDelay = await Room.findById(roomId);
        if (!roomAfterDelay) return;

        const stillMissing = !roomAfterDelay.players.some(
          p => p.username === username && p.socketId !== socketId
        );
        if (!stillMissing) {
          // console.log(`${username} has reconnected, skipping removal`);
          return;
        }

        roomAfterDelay.players = roomAfterDelay.players.filter(p => p.socketId !== socketId);
        roomAfterDelay.playerOrder = roomAfterDelay.playerOrder.filter(id => id !== socketId);

        if (roomAfterDelay.currentPlayerId === socketId) {
          roomAfterDelay.currentPlayerId = roomAfterDelay.playerOrder[0] || null;
        }

        await roomAfterDelay.save();

        const usernames = roomAfterDelay.players.map(p => p.username);
        io.in(roomId).emit('update_players', usernames);
        io.in(roomId).emit('update_current_player', roomAfterDelay.currentPlayerId);

        // 👇 Updated structured message
        io.in(roomId).emit('receive_message', {
          sender: 'System',
          text: `${username} has disconnected (timed out).`,
        });

        socketToRoom.delete(socketId);
        // console.log(`User ${username} (${socketId}) removed from room ${roomId} after timeout`);
      }, 10000);
    } catch (error) {
      console.error('Error in delayed disconnect:', error);
    }
  });

});

const connectToMongoDb = async () => {
  try {
    // Replace with your MongoDB connection string
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("Connected to MongoDB via Mongoose");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    process.exit(1); // exit process if cannot connect
  }
};

const startServer = async () => {
  try {
    await connectToMongoDb();

    httpServer.listen(process.env.HTTP_PORT, () => {
      console.log(`Server running on port ${process.env.HTTP_PORT}`);
    });

    // await Room.deleteMany({});
    // console.log('All rooms cleared from database');

  } catch (error) {
    console.error("Failed to start server:", error);
  }
};

startServer();
