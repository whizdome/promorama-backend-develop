const mongoose = require('mongoose');

const CompetitorSchema = new mongoose.Schema(
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

    price: {
      type: Number,
      required: true,
    },

    isPromoOn: {
      type: Boolean,
      required: true,
    },

    imageURL: {
      type: String,
      default: null,
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

CompetitorSchema.index({ initiative: 1, createdAt: -1 });

const Competitor = mongoose.model('Competitor', CompetitorSchema);
module.exports = Competitor;
