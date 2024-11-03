const mongoose = require('mongoose');

const ShelfAndPosmSchema = new mongoose.Schema(
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

    type: {
      type: String,
      enum: ['shelf', 'posm'],
      required: true,
    },

    imageURL: {
      type: String,
      required: true,
    },

    comment: {
      type: String,
      default: null,
    },

    state: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

ShelfAndPosmSchema.index({ initiative: 1, createdAt: -1 });
ShelfAndPosmSchema.index({ initiativeStore: 1, type: 1, createdAt: -1 });

const ShelfAndPosm = mongoose.model('Shelf_And_Posm', ShelfAndPosmSchema, 'shelf_and_posm');
module.exports = ShelfAndPosm;
