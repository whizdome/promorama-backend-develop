const mongoose = require('mongoose');

const GameCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      required: true,
    },

    imageURL: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

const GameCategory = mongoose.model('Game_Category', GameCategorySchema);
module.exports = GameCategory;
