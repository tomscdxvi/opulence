// models/Room.js
import mongoose from "mongoose";

const gemSchema = {
  white: { type: Number, default: 0 },
  green: { type: Number, default: 0 },
  orange: { type: Number, default: 0 },
  black: { type: Number, default: 0 },
  purple: { type: Number, default: 0 },
  wild: { type: Number, default: 0 }
};

const cardSchema = new mongoose.Schema({
  id: { type: String, required: true },
  type: { type: String, enum: ['green', 'yellow', 'blue', 'noble'], required: true },
  score: { type: Number, default: 0 },
  gemType: { type: String, required: true },
  cost: gemSchema
}, { _id: false });

const playerSchema = new mongoose.Schema({
  socketId: { type: String, required: true }, // add socketId (or playerId) here
  username: { type: String, required: true },
  score: { type: Number, default: 0 },
  gems: { type: gemSchema, default: () => ({}) },
  cardGems: {
    type: gemSchema,
    default: () => ({ white: 0, purple: 0, green: 0, orange: 0, black: 0, wild: 0 })
  },
  cards: { type: [cardSchema], default: [] }, // all cards here regardless of color/type
  reservedCards: { type: [cardSchema], default: [] }
}, { _id: false });

const roomSchema = new mongoose.Schema({
  _id: String, // roomId from nanoid
  createdAt: { type: Date, default: Date.now },
  host: { type: String, required: true },  // store socket ID or user ID of host
  gameStarted: { type: Boolean, required: true, default: false },
  currentPlayerId: { type: String, default: null },
  playerOrder: {
    type: [String], // Array of socket IDs in order
    default: [],
  },
  turnIndex: { type: Number, default: 0 },  // Tracks current turn position
  locked: { type: Boolean, default: false },
  players: {
    type: [playerSchema],
    default: []
  },
  decks: {
    type: Map,
    of: [Object],
  },
  cardsOnBoard: {
    type: Map,
    of: [Object],
  },
  gemBank: {
    type: Map,
    of: Number,
  },
  pendingPurchase: {
    cardId: { type: String, default: null },
    socketId: { type: String, default: null },
    timestamp: { type: Date, default: null }
  },
  turnLog: {
    type: [new mongoose.Schema({
      playerId: String,
      action: String,
      cardId: String,
      timestamp: { type: Date, default: Date.now }
    }, { _id: false })],
    default: []
  }
});

export default mongoose.model("Room", roomSchema);
