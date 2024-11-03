const mongoose = require('mongoose');

const SurveyResponse = require('./surveyResponse.model');

const SurveySchema = new mongoose.Schema(
  {
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
    },

    initiative: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Initiative',
      default: null,
    },

    name: {
      type: String,
      trim: true,
      required: true,
    },

    description: {
      type: String,
      trim: true,
      default: null,
    },

    isActive: {
      type: Boolean,
      default: false,
    },

    questions: [
      {
        title: { type: String, trim: true, required: true },
        fieldName: { type: String, trim: true, required: true },
        fieldType: { type: String, trim: true, required: true },
        fieldOptions: { type: [String], default: [] },
        isRequired: { type: Boolean, required: true },
      },
    ],
  },
  {
    timestamps: true,
  },
);

// Delete all the survey responses before deleting the survey itself
SurveySchema.pre('deleteOne', { document: true, query: false }, async function (next) {
  await SurveyResponse.deleteMany({ survey: this._id });
  next();
});

const Survey = mongoose.model('Survey', SurveySchema);
module.exports = Survey;
