const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema(
  {
    initiative: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Initiative',
      required: true,
    },

    name: {
      type: String,
      required: true,
    },

    dueDate: {
      type: String,
      required: true,
    },

    dueTime: {
      type: String,
      required: true,
    },

    comment: {
      type: String,
      required: true,
    },

    uploadURLs: [String],

    assignedInitiativeStores: [
      {
        initiativeStore: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Initiative_Store',
          required: true,
        },

        reply: {
          type: {
            comment: String,
            uploadURLs: [String],
            date: { type: Date, default: Date.now },
            _id: false,
          },
          default: null,
        },

        _id: false,
      },
    ],
  },
  {
    timestamps: true,
  },
);

const Task = mongoose.model('Task', TaskSchema);
module.exports = Task;
