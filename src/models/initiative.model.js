const mongoose = require('mongoose');
const { INITIATIVE_STATUS } = require('../helpers/constants');

const InitiativeSchema = new mongoose.Schema(
  {
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
    },

    agency: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Agency',
      default: null,
    },

    name: {
      type: String,
      trim: true,
      required: true,
    },

    description: {
      type: String,
      required: true,
    },

    instructions: {
      type: String,
      required: true,
    },

    imageURL: {
      type: String,
      default: null,
    },

    startDate: {
      type: String,
      default: null,
    },

    endDate: {
      type: String,
      default: null,
    },

    brands: [
      {
        name: { type: String, trim: true, lowercase: true, required: true },
        sku: { type: String, trim: true, lowercase: true, required: true },
        image: { type: String, default: null },
        target: { type: Number, required: true },
        durationInDays: { type: Number, required: true },
        caseUnitsNumber: { type: Number, default: 1 },
        pricePerCase: { type: Number, default: 0 },
      },
    ],

    games: [
      {
        name: { type: String, trim: true, lowercase: true, required: true },
        title: { type: String, trim: true, default: null },
        imageURL: { type: String, default: null },
        questions: [
          {
            text: { type: String, trim: true, required: true },
            answer: { type: String, trim: true, lowercase: true, required: true },
          },
        ],
      },
    ],

    gamePrizeOptions: [
      {
        name: { type: String, trim: true, lowercase: true, required: true },
        rank: { type: Number, required: true },
      },
    ],

    shelfImages: [String],

    posmImages: [String],

    competitorBrands: [
      {
        name: { type: String, trim: true, lowercase: true, required: true },
        sku: { type: String, trim: true, lowercase: true, required: true },
        imageURL: { type: String, default: null },
      },
    ],

    mslBrands: [
      {
        name: { type: String, trim: true, lowercase: true, required: true },
        sku: { type: String, trim: true, lowercase: true, required: true },
        imageURL: { type: String, default: null },
      },
    ],

    sosBrands: [
      {
        name: { type: String, trim: true, lowercase: true, required: true },
        sku: { type: String, trim: true, lowercase: true, required: true },
        imageURL: { type: String, default: null },
      },
    ],

    orderBrands: [
      {
        name: { type: String, trim: true, lowercase: true, required: true },
        sku: { type: String, trim: true, lowercase: true, required: true },
        imageURL: { type: String, default: null },
      },
    ],

    paymentBrands: [
      {
        name: { type: String, trim: true, lowercase: true, required: true },
        sku: { type: String, trim: true, lowercase: true, required: true },
        imageURL: { type: String, default: null },
      },
    ],

    initiativeStoresFilterGroups: [
      {
        name: { type: String, trim: true, required: true },
        initiativeStoresIDs: [{ type: String, required: true }],
      },
    ],

    productsFilterGroups: [
      {
        name: { type: String, trim: true, required: true },
        products: [{ type: String, required: true }],
      },
    ],

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

    status: {
      type: String,
      default: INITIATIVE_STATUS.PENDING,
    },
  },
  {
    timestamps: true,
  },
);

const Initiative = mongoose.model('Initiative', InitiativeSchema);
module.exports = Initiative;
