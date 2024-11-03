const mongoose = require('mongoose');

const AppDataSchema = new mongoose.Schema(
  {
    currentAndroidVersion: {
      type: String,
      default: null,
    },

    currentIosVersion: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

const AppData = mongoose.model('App_Data', AppDataSchema, 'app_data');
module.exports = AppData;
