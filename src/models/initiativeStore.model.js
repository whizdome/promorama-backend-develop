const mongoose = require('mongoose');

const InitiativeStoreSchema = new mongoose.Schema(
  {
    initiative: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Initiative',
      required: true,
    },

    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store',
      required: true,
    },

    promoter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },

    supervisor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },

    deletedAt: {
      type: Date,
      default: null,
    },

    isBulkDeleted: {
      type: Boolean,
      default: false,
    },

    state: {
      type: String,
      default: null,
    },

    gamePrizes: [
      {
        name: { type: String, trim: true, lowercase: true, required: true },
        quantityAvailable: { type: Number, required: true },
        rank: { type: Number, required: true },
      },
    ],

    radius: {
      type: Number,
      default: 200,
    },
  },
  {
    timestamps: true,
  },
);

InitiativeStoreSchema.index({ initiative: 1, isDeleted: 1, createdAt: -1, _id: 1 });
InitiativeStoreSchema.index({ promoter: 1, isDeleted: 1, createdAt: -1 });

const InitiativeStore = mongoose.model('Initiative_Store', InitiativeStoreSchema);
module.exports = InitiativeStore;
