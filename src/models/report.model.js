const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema(
  {
    initiative: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Initiative',
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

    name: {
      type: String,
      required: true,
    },

    comment: {
      type: String,
      required: true,
    },

    uploadURLs: {
      type: [String],
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

const Report = mongoose.model('Report', ReportSchema);
module.exports = Report;
