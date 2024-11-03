const mongoose = require('mongoose');

const StoreSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'userModel',
      required: true,
    },

    userModel: {
      type: String,
      required: true,
    },

    userRole: {
      type: String,
      required: true,
    },

    name: {
      type: String,
      lowercase: true,
      trim: true,
      required: true,
    },

    phoneNumber: {
      type: String,
      default: null,
    },

    streetNumber: {
      type: String,
      default: null,
    },

    streetName: {
      type: String,
      required: true,
    },

    state: {
      type: String,
      lowercase: true,
      trim: true,
      required: true,
    },

    area: {
      type: String,
      lowercase: true,
      trim: true,
      required: true,
    },

    town: {
      type: String,
      lowercase: true,
      trim: true,
      default: null,
    },

    country: {
      type: String,
      default: 'nigeria',
    },

    ownerFirstName: {
      type: String,
      default: null,
    },

    ownerLastName: {
      type: String,
      default: null,
    },

    ownerPhoneNumber: {
      type: String,
      default: null,
    },

    ownerEmail: {
      type: String,
      default: null,
    },

    type: {
      type: String,
      required: true,
    },

    level: {
      type: String,
      required: true,
    },

    category: {
      type: String,
      required: true,
    },

    imageURL: {
      type: String,
      required: true,
    },

    brand: {
      type: String,
      default: null,
    },

    additionalInfo: {
      type: String,
      default: null,
    },

    isApproved: {
      type: Boolean,
      default: false,
    },

    location: {
      type: {
        type: String,
        enum: ['Point'],
        required: true,
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },

    team: {
      type: String,
      lowercase: true,
      trim: true,
      default: null,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },

    deletedAt: {
      type: Date,
      default: null,
    },

    clients: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client',
      },
    ],
  },
  {
    timestamps: true,
  },
);

StoreSchema.index({ location: '2dsphere' });
StoreSchema.index({ isDeleted: 1, createdAt: -1, clients: 1 });
StoreSchema.index({ user: 1, isDeleted: 1, createdAt: -1 });
StoreSchema.index({ isApproved: 1, isDeleted: 1, createdAt: -1 });
StoreSchema.index({ area: 1, name: 1, state: 1, _id: 1 });

const Store = mongoose.model('Store', StoreSchema);
module.exports = Store;
