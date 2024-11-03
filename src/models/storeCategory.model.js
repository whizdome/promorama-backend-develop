const mongoose = require('mongoose');

const StoreCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      required: true,
    },

    types: [
      {
        name: { type: String, trim: true, lowercase: true },
        levels: [{ type: String, trim: true }],
      },
    ],

    isSelectable: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

const StoreCategory = mongoose.model('Store_Category', StoreCategorySchema);
module.exports = StoreCategory;
