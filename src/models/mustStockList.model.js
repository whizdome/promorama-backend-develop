const mongoose = require('mongoose');

const MustStockListSchema = new mongoose.Schema(
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

    level: {
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
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

MustStockListSchema.index({ initiative: 1, date: 1, createdAt: -1 });
MustStockListSchema.index({ initiativeStore: 1, date: 1, createdAt: -1 });
MustStockListSchema.index({ initiativeStore: 1, brandName: 1, date: 1, sku: 1, _id: 1 });
MustStockListSchema.index({ initiativeStore: 1, createdAt: -1 });
MustStockListSchema.index({ initiative: 1, createdAt: -1 });

const MustStockList = mongoose.model('Must_Stock_List', MustStockListSchema);
module.exports = MustStockList;
