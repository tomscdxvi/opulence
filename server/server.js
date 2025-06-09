//server.js

import { createServer } from "http";
import { Server } from "socket.io";
import express from "express";
import { MongoClient, ServerApiVersion } from "mongodb";
import dotenv from "dotenv";
import cors from "cors";
import { nanoid } from "nanoid";
import fs from 'fs';

import Room from './models/Room.js';

const cardsData = JSON.parse(fs.readFileSync(new URL('./util/cards.json', import.meta.url), 'utf8'));
const gemsData = JSON.parse(fs.readFileSync(new URL('./util/gems.json', import.meta.url), 'utf8'));

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const httpServer = createServer(app);
const socket = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:5173", "https://opulence-one.vercel.app"],
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

const rooms = {}; // key: roomId, value: game state

socket.on('connection', (socket) => {

    console.log(`User Connected: ${socket.id}`);

    socket.on("create_room", (callback) => {
    const roomId = nanoid(6);
    socket.join(roomId);

    // Initialize decks & game state
    const decks = {};
    const cardsOnBoard = {};

    // For each deck color/type in cardsData, shuffle and pick initial cards on board
    for (const deckType in cardsData) {
      const deck = [...cardsData[deckType]];
      // Shuffle deck
      for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
      }
      decks[deckType] = deck;
      cardsOnBoard[deckType] = decks[deckType].splice(0, 4); // or suitable number per deck
    }

    rooms[roomId] = {
      decks,
      cardsOnBoard,
      players: {},
      playerOrder: [],      // NEW: ordered array of player socket IDs
      currentTurn: null     // NEW: current player's socket ID
    };

    // Send initial game state to the room creator (host)
    socket.emit("update_game_state", rooms[roomId]);

    console.log(`Room created and initialized: ${roomId}`);

    callback(roomId);
    });

    socket.on("check_room_exists", (roomId, callback) => {
      const roomExists = Boolean(rooms[roomId]);
      callback(roomExists);
    });

    socket.on("join_room", ({ roomId, playerName }) => {
      const room = rooms[roomId];
      if (!room) return;

      socket.join(roomId);
      console.log(`User ${playerName} (${socket.id}) joined room ${roomId}`);

      // Store player name and other info
      room.players[socket.id] = { name: playerName, cards: [] };

      // Track turn order
      room.playerOrder.push(socket.id);

      // Assign first turn
      if (room.playerOrder.length === 1) {
        room.currentTurn = socket.id;
      }

      // Broadcast join message
      const joinMessage = `${playerName} has joined the room`;
      socket.to(roomId).emit("receive_message", joinMessage);
      socket.emit("receive_message", `Welcome ${playerName}!`);

      // Broadcast updated player list
      const playerNames = Object.values(room.players).map((p) => p.name);
      socket.to(roomId).emit("update_players", playerNames);
      socket.emit("update_players", playerNames);

      // Send current game state
      socket.emit("update_game_state", room);
    });



    socket.on("start_game", (roomId) => {
      const room = rooms[roomId];
      if (!room) {
        console.warn("start_game called but room not initialized:", roomId);
        return;
      }

      const playerCount = Object.keys(room.players).length;

      if (playerCount !== 4) {
        socket.emit("error_message", `Game requires exactly 4 players to start. Currently: ${playerCount}`);
        return;
      }

      // Notify all clients in the room that the game is starting
      socket.to(roomId).emit("start_game");
      socket.emit("start_game");
    });

    socket.on("request_game_state", ({ roomId }) => {
      console.log("Request game state for room:", roomId);
      if (!rooms[roomId]) {
        // Initialize consistent room state
        const decks = {};
        const cardsOnBoard = {};
        for (const deckType in cardsData) {
          const deck = [...cardsData[deckType]];
          for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
          }
          decks[deckType] = deck;
          cardsOnBoard[deckType] = decks[deckType].splice(0, 4);
        }

        rooms[roomId] = {
          decks,
          cardsOnBoard,
          players: {},
          playerOrder: [],      // NEW: ordered array of player socket IDs
          currentTurn: null     // NEW: current player's socket ID
        };
      }

      socket.emit("update_game_state", rooms[roomId]);
    });

    function getNextPlayerId(room, currentId) {
      const index = room.playerOrder.indexOf(currentId);
      return room.playerOrder[(index + 1) % room.playerOrder.length];
    }


  socket.on("purchase_card", ({ roomId, playerId, deckType, cardIndex }) => {
    const room = rooms[roomId];
    if (!room) return;

    
    // Enforce turn order
    if (room.currentTurn !== playerId) {
      console.warn(`Player ${playerId} tried to purchase out of turn.`);
      return; // Ignore or send error event back
    }

    const card = room.cardsOnBoard[deckType]?.[cardIndex];
    if (!card) return;

    // Remove card from board
    room.cardsOnBoard[deckType].splice(cardIndex, 1);

    // Draw new card if available
    if (room.decks[deckType]?.length > 0) {
      const newCard = room.decks[deckType].shift();
      room.cardsOnBoard[deckType].push(newCard);
    }

    // Add to player cards
    if (!room.players[playerId]) {
      room.players[playerId] = { cards: [] };
    }

    room.players[playerId].cards.push(card);

    // Advance turn
    room.currentTurn = getNextPlayerId(room, playerId);

    // Broadcast updated state
    socket.to(roomId).emit("update_game_state", room);
    socket.emit("update_game_state", room);
  });


  socket.on("send_message", ({ room, message }) => {
    const player = rooms[room]?.players[socket.id];
    if (!player) return; // Ignore if player not found

    const formattedMessage = `${player.name}: ${message}`;
    
    // Send message to all clients in the room
    socket.to(room).emit("receive_message", formattedMessage);
    socket.emit("receive_message", formattedMessage); // Echo to sender
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);

    for (const roomId in rooms) {
      const room = rooms[roomId];
      if (room.players[socket.id]) {
        const playerName = room.players[socket.id].name;
        
        // Remove from room
        delete room.players[socket.id];
        room.playerOrder = room.playerOrder.filter(id => id !== socket.id);

        // If player was current turn, move to next
        if (room.currentTurn === socket.id) {
          room.currentTurn = room.playerOrder[0] || null;
        }

        // Notify others
        socket.to(roomId).emit("receive_message", `${playerName} left the room`);
        socket.to(roomId).emit("update_players", Object.values(room.players).map(p => p.name));

        // If empty, delete room
        if (Object.keys(room.players).length === 0) {
          delete rooms[roomId];
          console.log(`Room ${roomId} deleted due to all players disconnecting.`);
        }

        break; // Stop loop after match
      }
    }
  });

});

const HTTP_PORT = process.env.HTTP_PORT || 5001;

const uri = process.env.MONGODB_URI;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true
  }
});

const connectToMongoDb = async () => {
  try {
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log("Connected to MongoDB");
  } catch(error) {
    console.log(error);
  }
};

try {
  httpServer.listen(HTTP_PORT, () => {
    console.log(`Connected to HTTP Server at HTTP Port ${HTTP_PORT}`);
  });
  connectToMongoDb();
} catch (error) {
  console.log(`${error}, failed to connect`);
}
