const mongoose = require('mongoose');

const StoreInventorySchema = new mongoose.Schema(
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

    brandName: {
      type: String,
      required: true,
    },

    sku: {
      type: String,
      required: true,
    },

    availableStockQty: {
      type: Number,
      required: true,
    },

    state: {
      type: String,
      required: true,
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

StoreInventorySchema.index({ initiativeStore: 1, brandName: 1, sku: 1, _id: 1 });
StoreInventorySchema.index({ initiativeStore: 1, createdAt: -1 });
StoreInventorySchema.index({ initiative: 1, createdAt: -1 });

const StoreInventory = mongoose.model('Store_Inventory', StoreInventorySchema);
module.exports = StoreInventory;
