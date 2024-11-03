const mongoose = require('mongoose');

const SurveyResponseSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },

    survey: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Survey',
      required: true,
    },

    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true },
    },

    entries: [
      {
        questionIndex: { type: Number, required: true },
        answer: { type: String, trim: true, required: true },
      },
    ],
  },
  {
    timestamps: true,
  },
);

SurveyResponseSchema.index({ location: '2dsphere' });
SurveyResponseSchema.index({ survey: 1, user: 1, createdAt: -1 });

const SurveyResponse = mongoose.model('Survey_Response', SurveyResponseSchema);
module.exports = SurveyResponse;
