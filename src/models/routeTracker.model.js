const mongoose = require('mongoose');

const RouteTrackerSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },

    date: {
      type: String,
      required: true,
    },

    latitude: {
      type: Number,
      required: true,
    },

    longitude: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

RouteTrackerSchema.index({ createdAt: 1 }, { expires: '30d' });
RouteTrackerSchema.index({ user: 1, date: 1, createdAt: -1 });

const RouteTracker = mongoose.model('Route_Tracker', RouteTrackerSchema);
module.exports = RouteTracker;
