const mongoose = require('mongoose');

const valueObject = { text: String, imageURL: String };

const InitiativeStoresReportSchema = new mongoose.Schema(
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

    date: {
      type: String,
      required: true,
    },

    storeManagement: valueObject,

    personnelAttendance: valueObject,

    personnelKnowledge: valueObject,

    sales: valueObject,

    mustStockList: valueObject,

    shareOfShelf: valueObject,

    outOfStock: valueObject,

    lowStock: valueObject,

    orders: valueObject,

    shipmentAndDelivery: valueObject,

    payments: valueObject,

    posm: valueObject,

    shelf: valueObject,

    productExpiry: valueObject,

    productIssues: valueObject,

    competition: valueObject,

    pricing: valueObject,

    inStoreActivity: valueObject,

    others: valueObject,
  },
  {
    timestamps: true,
  },
);

const InitiativeStoresReport = mongoose.model(
  'Initiative_Stores_Report',
  InitiativeStoresReportSchema,
);
module.exports = InitiativeStoresReport;
