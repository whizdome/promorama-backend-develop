const mongoose = require('mongoose');

const SaleSchema = new mongoose.Schema(
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

    unitsSold: {
      type: Number,
      required: true,
    },

    state: {
      type: String,
      default: null,
    },

    comment: {
      type: String,
      default: null,
    },

    totalCase: {
      type: Number,
      default: 0,
    },

    totalValue: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

SaleSchema.index({ initiative: 1, date: 1, createdAt: -1 });
SaleSchema.index({ initiativeStore: 1, brandName: 1, date: 1, sku: 1, _id: 1 });
SaleSchema.index({ initiativeStore: 1, createdAt: -1 });
SaleSchema.index({ initiative: 1, createdAt: -1 });

const Sale = mongoose.model('Sale', SaleSchema);
module.exports = Sale;
