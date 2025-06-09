// models/Room.js
import mongoose from "mongoose";

const gemSchema = {
  white: { type: Number, default: 0 },
  blue: { type: Number, default: 0 },
  green: { type: Number, default: 0 },
  orange: { type: Number, default: 0 },
  black: { type: Number, default: 0 },
  purple: { type: Number, default: 0 },
  gold: { type: Number, default: 0}
};

const cardSchema = new mongoose.Schema({
    type: { type: String, enum: ['green', 'yellow', 'blue', 'noble'], required: true },
    score: { type: Number, default: 0 },
    gemType: { type: String, required: true },
    cost: gemSchema
}, { _id: false });

const playerSchema = new mongoose.Schema({
  username: String,
  score: { type: Number, default: 0 },
  gems: { type: gemSchema, default: () => ({}) },
  cards: { type: [cardSchema], default: [] }, // all cards here regardless of color/type
  reservedCards: { type: [cardSchema], default: [] }
}, { _id: false });

const roomSchema = new mongoose.Schema({
  _id: String, // roomId from nanoid
  createdAt: { type: Date, default: Date.now },
  players: {
    type: Map,
    of: playerSchema,
    default: () => ({})
  },
    decks: {
        type: Map,
        of: [cardSchema],
        default: () => ({})
    },
    cardsOnBoard: {
        type: Map,
        of: [cardSchema],
        default: () => ({})
    },
  currentPlayerId: { type: String, default: null },
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
