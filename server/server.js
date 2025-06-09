//server.js

import { createServer } from "http";
import { Server } from "socket.io";
import express from "express";
import { MongoClient, ServerApiVersion } from "mongodb";
import dotenv from "dotenv";
import cors from "cors";
import { nanoid } from "nanoid"
import mongoose from "mongoose";
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
const socketToRoom = {}; // key: socket.id, value: roomId

socket.on('connection', (socket) => {

  console.log(`User Connected: ${socket.id}`);

  socket.on("create_room", async (callback) => {
    try {
      const roomId = nanoid(6);

      // Initialize decks & cardsOnBoard exactly as before
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

      // Create new Room document with decks..cards etc...
      /*
      const newRoom = new Room({
        _id: roomId,
        decks,
        cardsOnBoard,
        players: {},
        currentPlayerId: null,
        turnLog: [],
        // other fields you want to initialize
      });
      */

      // Create new room with no game assets yet.
      const newRoom = new Room({
        _id: roomId,
        decks: {},            // no decks yet
        cardsOnBoard: {},     // no cards yet
        players: {},
        currentPlayerId: null,
        turnLog: [],
        // other fields if necessary
      });

      await newRoom.save();

      socket.join(roomId);

      // Emit initial game state from DB to host
      socket.emit("update_game_state", newRoom);

      console.log(`Room created and saved to DB: ${roomId}`);

      callback(roomId);
    } catch (error) {
      console.error("Error creating room:", error);
      callback(null, "Failed to create room");
    }
  });

  socket.on("check_room_exists", async (roomId, callback) => {
    try {
      const room = await Room.findById(roomId).exec();
      callback(!!room);
    } catch (error) {
      console.error(error);
      callback(false);
    }
  });

  socket.on("join_room", async ({ roomId, username }) => {
    try {
      const room = await Room.findById(roomId).exec();
      if (!room) {
        socket.emit("error_message", "Room does not exist");
        return;
      }

      socket.join(roomId);
      socketToRoom[socket.id] = roomId;
      console.log(`User ${username} (${socket.id}) joined room ${roomId}`);

      // Add player to room.players map
      room.players.set(socket.id, {
        username: username,
        score: 0,
        gems: {}, 
        cards: [],
        reservedCards: []
      });

      // If no current player, set turn to this player
      if (!room.currentPlayerId) {
        room.currentPlayerId = socket.id;
      }

      // Save updated room
      await room.save();

      // Broadcast join message
      const joinMessage = `${username} has joined the room`;
      socket.to(roomId).emit("receive_message", joinMessage);
      socket.emit("receive_message", `Welcome ${username}!`);

      // Broadcast updated player list
      const usernames = Array.from(room.players.values()).map(p => p.username);
      socket.to(roomId).emit("update_players", usernames);
      socket.emit("update_players", usernames);

      // Send current game state
      socket.emit("update_game_state", room);
    } catch (error) {
      console.error(error);
      socket.emit("error_message", "Failed to join room");
    }
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


  socket.on("purchase_card", async ({ roomId, playerId, deckType, cardIndex }) => {
    try {
      const room = await Room.findById(roomId).exec();
      if (!room) return;

      if (room.currentPlayerId !== playerId) {
        socket.emit("error_message", "Not your turn!");
        return;
      }

      const cardsOnBoard = room.cardsOnBoard.get(deckType);
      if (!cardsOnBoard || !cardsOnBoard[cardIndex]) return;

      const card = cardsOnBoard[cardIndex];

      // Remove the card from board
      cardsOnBoard.splice(cardIndex, 1);

      // Draw new card if deck available
      const deck = room.decks.get(deckType);
      if (deck && deck.length > 0) {
        const newCard = deck.shift();
        cardsOnBoard.push(newCard);
        room.decks.set(deckType, deck);
      }

      // Add card to player's cards
      const player = room.players.get(playerId);
      if (!player) return;

      player.cards.push(card);
      room.players.set(playerId, player);

      // Advance turn to next player
      const playerOrder = Array.from(room.players.keys());
      const currentIndex = playerOrder.indexOf(playerId);
      const nextPlayerId = playerOrder[(currentIndex + 1) % playerOrder.length];
      room.currentPlayerId = nextPlayerId;

      // Update cardsOnBoard after mutation
      room.cardsOnBoard.set(deckType, cardsOnBoard);

      await room.save();

      socket.to(roomId).emit("update_game_state", room);
      socket.emit("update_game_state", room);

    } catch (error) {
      console.error(error);
    }
  });

  socket.on('send_message', async ({ room, message }) => {
    try {
      const roomDoc = await Room.findById(room).exec();
      if (!roomDoc) {
        socket.emit("error_message", "Room not found.");
        return;
      }

      const player = roomDoc.players.get(socket.id);
      const name = player?.username || 'Unknown';

      const payload = `${name}: ${message}`;
      socket.to(room).emit('receive_message', payload);
      socket.emit('receive_message', payload);
    } catch (error) {
      console.error("Error in send_message:", error);
      socket.emit("error_message", "Failed to send message.");
    }
  });


  socket.on("disconnect", async () => {
    const roomId = socketToRoom[socket.id];
    console.log(`User disconnected: ${socket.id}, Room: ${roomId}`);
    if (!roomId) return;

    try {
      const room = await Room.findById(roomId).exec();
      if (!room) return;

      const player = room.players.get(socket.id);
      const username = player?.username || "A player";

      // 🔊 Notify others before removing player
      socket.to(roomId).emit("receive_message", `${username} has left the room.`);

      // Remove player from room
      room.players.delete(socket.id);

      // If that player was currentPlayerId, move to next
      if (room.currentPlayerId === socket.id) {
        const remainingPlayerIds = Array.from(room.players.keys());
        room.currentPlayerId = remainingPlayerIds[0] || null;
      }

      if (room.players.size === 0) {
        // No players left - delete room from DB
        await Room.findByIdAndDelete(roomId);
        console.log(`Room ${roomId} deleted as it became empty.`);

        // Clean up memory
        delete rooms[roomId];
      } else {
        await room.save();
      }
    } catch (err) {
      console.error("Error during disconnect cleanup:", err);
    }

    // Clean up memory tracking
    delete socketToRoom[socket.id];
  });
});

const HTTP_PORT = process.env.HTTP_PORT || 5001;

const MONGO_URI = process.env.MONGODB_URI;

const connectToMongoDb = async () => {
  try {
    // Replace with your MongoDB connection string
    await mongoose.connect(MONGO_URI, {
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

    httpServer.listen(HTTP_PORT, () => {
      console.log(`Server running on port ${HTTP_PORT}`);
    });

  } catch (error) {
    console.error("Failed to start server:", error);
  }
};

startServer();
