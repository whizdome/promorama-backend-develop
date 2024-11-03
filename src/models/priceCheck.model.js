const mongoose = require('mongoose');

const PriceCheckSchema = new mongoose.Schema(
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
      default: null,
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

PriceCheckSchema.index({ initiative: 1, date: 1, createdAt: -1 });
PriceCheckSchema.index({ initiativeStore: 1, date: 1, createdAt: -1 });
PriceCheckSchema.index({ initiativeStore: 1, createdAt: -1 });

const PriceCheck = mongoose.model('Price_Check', PriceCheckSchema);
module.exports = PriceCheck;
