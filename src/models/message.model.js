const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema(
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

    title: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      required: true,
    },

    imageURL: {
      type: String,
      default: null,
    },

    responses: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          refPath: 'responses.userModel',
          required: true,
        },

        userModel: { type: String, required: true },

        text: { type: String, required: true },

        imageURL: { type: String, default: null },

        sentAt: { type: Date, default: Date.now },
      },
    ],

    isResolved: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

MessageSchema.index({ createdAt: 1 }, { expires: '90d' });

const Message = mongoose.model('Message', MessageSchema);
module.exports = Message;
