const mongoose = require('mongoose');

const GameWinnerSchema = new mongoose.Schema(
  {
    initiative: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Initiative',
      required: true,
    },

    initiativeStore: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Initiative_Store',
      required: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },

    gameName: {
      type: String,
      required: true,
    },

    prizeWon: {
      type: String,
      trim: true,
      lowercase: true,
      required: true,
    },

    isPrizeClaimed: {
      type: Boolean,
      default: false,
    },

    winnerDetails: {
      name: { type: String, required: true },
      email: { type: String, required: true },
      phoneNumber: { type: String, required: true },
      imageURL: { type: String, default: null },
    },

    comment: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

const GameWinner = mongoose.model('Game_Winner', GameWinnerSchema);
module.exports = GameWinner;
