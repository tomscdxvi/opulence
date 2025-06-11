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
async function collectGems(io, room, socketId, gemSelection) {
  const player = room.players.find(p => p.socketId === socketId);
  if (!player) return false;

  if (!isPlayersTurn(room, socketId)) {
    io.to(socketId).emit('error_message', 'It is not your turn.');
    return false;
  }

  if (player.mustReturnGems) {
    io.to(socketId).emit('error_message', 'You must return gems before collecting more.');
    return false;
  }

  if (!validateGemSelection(room, gemSelection)) {
    io.to(socketId).emit('error_message', 'Invalid gem selection according to game rules.');
    return false;
  }

  const gemsCollected = Object.values(gemSelection).reduce((sum, val) => sum + val, 0);
  const currentGems = totalGems(player.gems);
  const totalAfter = currentGems + gemsCollected;

  if (totalAfter > 10) {
    io.to(socketId).emit('error_message', 'You cannot collect gems that would exceed the 10 gem limit.');
    return false;
  }

  // Check gem bank and update player gems & bank accordingly
  for (const [gem, amount] of Object.entries(gemSelection)) {
    const bankAmount = room.gemBank.get(gem) ?? 0;
    if (bankAmount >= amount) {
      room.gemBank.set(gem, bankAmount - amount);
      player.gems[gem] = (player.gems[gem] || 0) + amount;
    } else {
      io.to(socketId).emit('error_message', `Not enough ${gem} gems available.`);
      return false;
    }
  }

  room.turnLog.push({
    player: player.username,
    action: 'collect_gems',
    details: { gemsCollected: gemSelection },
    timestamp: new Date(),
  });

  await room.save();
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
  return { canBuy: true, missing, needsWild: missing > 0 };
}

// Purchase a card action, with wild gem usage confirmation
async function purchaseCard(io, room, socketId, cardId, confirmWildUse = false) {
  const player = room.players.find(p => p.socketId === socketId);
  if (!player) return false;

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
    player.gems[gem] -= payFromGems;
    room.gemBank.set(gem, (room.gemBank.get(gem) ?? 0) + payFromGems);

    const remaining = discountedCost - payFromGems;
    if (remaining > 0) {
      player.gems.wild -= remaining;
      room.gemBank.set('wild', (room.gemBank.get('wild') ?? 0) + remaining);
    }
  }

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
    room.cardsOnBoard.set(cardSourceType, boardCards.filter(c => c.id !== cardId));

    if (room.decks.has(cardSourceType) && room.decks.get(cardSourceType).length > 0) {
      const nextCard = room.decks.get(cardSourceType).shift();
      room.cardsOnBoard.get(cardSourceType).push(nextCard);
    }
  } else {
    player.reservedCards = player.reservedCards.filter(c => c.id !== cardId);
  }

  // Log purchase
  room.turnLog.push({
    player: player.username,
    action: 'purchase_card',
    details: { cardId },
    timestamp: new Date(),
  });

  await room.save();
  await releaseLock(room);
  return true;
}

// Reserve a card action
async function reserveCard(io, room, socketId, { cardId, deckType }) {
  const player = room.players.find(p => p.socketId === socketId);
  if (!player) return false;

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

  player.reservedCards.push(cardToReserve);

  // Give wild gem if available
  if ((room.gemBank.get('wild') ?? 0) > 0) {
    room.gemBank.set('wild', room.gemBank.get('wild') - 1);
    player.gems.wild = (player.gems.wild || 0) + 1;
  }

  // Remove from board and refill if from board
  if (source.from === 'board') {
    const boardCards = room.cardsOnBoard.get(source.type);
    room.cardsOnBoard.set(source.type, boardCards.filter(c => c.id !== cardToReserve.id));

    if (room.decks.has(source.type) && room.decks.get(source.type).length > 0) {
      const nextCard = room.decks.get(source.type).shift();
      room.cardsOnBoard.get(source.type).push(nextCard);
    }
  }

  // Log reserve
  room.turnLog.push({
    player: player.username,
    action: 'reserve_card',
    details: {
      cardId: cardToReserve.id,
      source: source.from,
      type: source.type,
    },
    timestamp: new Date(),
  });

  await room.save();
  return true;
}

// Skip turn action
async function skipTurn(io, room, socketId) {
  const player = room.players.find(p => p.socketId === socketId);
  if (!player) return false;

  if (!isPlayersTurn(room, socketId)) {
    io.to(socketId).emit('error_message', 'It is not your turn.');
    return false;
  }

  room.turnLog.push({
    player: player.username,
    action: 'skip_turn',
    details: {},
    timestamp: new Date(),
  });

  await room.save();
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

  console.log(`Emitting game state to room ${room._id}`, gameState);

  io.in(room._id).emit('update_game_state', gameState);
}

// Socket.io connection
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

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

      console.log(`Room created: ${roomId}, host: ${socket.id}`);
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

  // Join Room
  socket.on('join_room', async ({ roomId, username }) => {
    try {
      const room = await Room.findById(roomId);
      if (!room) {
        socket.emit('error_message', 'Room does not exist');
        return;
      }

      socket.join(roomId);
      socketToRoom.set(socket.id, roomId);

      // Store username on socket for later message sending
      socket.username = username; 

      console.log('join_room: loaded room:', room);

      // Check if player already exists in players array by socket.id
      const existingPlayer = room.players.find(p => p.socketId === socket.id);

      if (!existingPlayer) {
        // Add new player object
        room.players.push({
          socketId: socket.id,
          username,
          score: 0,
          gems: { white: 0, blue: 0, green: 0, orange: 0, black: 0, purple: 0, gold: 0 },
          cards: [],
          reservedCards: [],
        });
      }

      // Add socket.id to playerOrder if not present
      if (!Array.isArray(room.playerOrder)) room.playerOrder = [];
      if (!room.playerOrder.includes(socket.id)) room.playerOrder.push(socket.id);

      // Set currentPlayerId if none set
      if (!room.currentPlayerId) room.currentPlayerId = room.playerOrder[0];

      await room.save();

      // Extract usernames for update_players event
      const usernames = room.players.map(p => p.username);

      io.in(roomId).emit('update_players', usernames);
      io.in(roomId).emit('update_current_player', room.currentPlayerId);
      
      emitGameState(io, room);

      console.log(`User ${username} (${socket.id}) joined room ${roomId}`);
    } catch (error) {
      console.error('Error joining room:', error);
      socket.emit('error_message', 'Failed to join room');
    }
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

        console.log(`Emitting room_closed for room ${roomId}`);
        io.in(roomId).emit('receive_message', `System: Host ${username} left. Room is closed.`);
        io.in(roomId).emit('room_closed');
        console.log(`Room ${roomId} deleted because host left.`);
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

      console.log(`User ${username} (${socket.id}) left room ${roomId}`);
    } catch (error) {
      console.error('Error leaving room:', error);
    }
  });

  // Start Game (host only)
  socket.on('start_game', async (roomId) => {
    try {
      const room = await Room.findById(roomId);
      if (!room) {
        console.warn(`start_game: room ${roomId} not found`);
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

      console.log(`Game started in room ${roomId}`);
    } catch (error) {
      console.error('Error starting game:', error);
    }
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
          actionSucceeded = await collectGems(room, socketId, payload.selectedGems);
          break;

        case 'purchase_card':
          actionSucceeded = await purchaseCard(room, socketId, payload.cardId);
          break;

        case 'reserve_card':
          actionSucceeded = await reserveCard(room, socketId, payload);
          break;

        case 'skip_turn':
          actionSucceeded = await skipTurn(room, socketId);
          break;

        default:
          socket.emit('error_message', 'Invalid action.');
          return;
      }

      if (actionSucceeded) {
        await room.save();
        emitGameState(io, room);

        await advanceTurn(room);
        io.in(roomId).emit('update_current_player', room.currentPlayerId);
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
    if (!room || !message) return; // basic validation

    // Compose a message object or string with sender info
    const fullMessage = `${socket.username || 'Anonymous'}: ${message}`;

    // Emit to everyone in the room, including sender:
    io.to(room).emit('receive_message', fullMessage);
  });

  // Handle disconnect (clean up player)
  socket.on('disconnect', async () => {
    console.log(`User disconnected: ${socket.id}`);

    const roomId = socketToRoom.get(socket.id);
    if (!roomId) return;

    try {
      const room = await Room.findById(roomId);
      if (!room) return;

      // Find the disconnecting player
      const player = room.players.find(p => p.socketId === socket.id);
      const username = player ? player.username : 'Unknown';

      // Remove player from players array
      room.players = room.players.filter(p => p.socketId !== socket.id);

      // Remove from playerOrder array
      if (Array.isArray(room.playerOrder)) {
        room.playerOrder = room.playerOrder.filter(id => id !== socket.id);
      }

      // Check if host disconnected
      const isHost = socket.id === room.host;

      if (isHost) {
        // Delete the whole room if host disconnected
        await Room.findByIdAndDelete(roomId);

        console.log(`Emitting room_closed for room ${roomId}`);
        io.in(roomId).emit('receive_message', `System: Host ${username} disconnected. Room is closed.`);
        io.in(roomId).emit('room_closed');
        console.log(`Room ${roomId} deleted because host disconnected.`);
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
        io.in(roomId).emit('receive_message', `${username} has disconnected.`);
      }

      socket.leave(roomId);
      socketToRoom.delete(socket.id);
    } catch (error) {
      console.error('Error handling disconnect:', error);
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
