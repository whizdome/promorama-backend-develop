const mongoose = require('mongoose');

const ShareOfShelfSchema = new mongoose.Schema(
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
      refPath: 'userModel',
      required: true,
    },

    userModel: {
      type: String,
      required: true,
    },

    date: {
      type: String,
      required: true,
    },

    brandName: {
      type: String,
      required: true,
    },

    sku: {
      type: String,
      required: true,
    },

    value: {
      type: Number,
      required: true,
    },

    state: {
      type: String,
      required: true,
    },

    comment: {
      type: String,
      default: null,
    },

    imageURL: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

const ShareOfShelf = mongoose.model('Share_Of_Shelf', ShareOfShelfSchema);
module.exports = ShareOfShelf;
