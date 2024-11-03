const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema(
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

    clockInDate: {
      type: String,
      required: true,
    },

    clockInTime: {
      type: Date,
      default: Date.now,
    },

    clockOutTime: {
      type: Date,
      default: null, // Initially, the user is not clocked out
    },

    hoursWorked: {
      type: Number,
      default: null,
    },

    locations: [
      {
        latitude: { type: Number, required: true },
        longitude: { type: Number, required: true },
        timestamp: { type: Date, required: true },
      },
    ],

    geofenceEvents: [
      {
        event: { type: String, required: true },
        timestamp: { type: Date, required: true },
      },
    ],
  },
  {
    timestamps: true,
  },
);

AttendanceSchema.index({ createdAt: 1 }, { expires: '186d' }); // 6 months
AttendanceSchema.index({ user: 1, clockInDate: 1, clockOutTime: 1 });
AttendanceSchema.index({ initiativeStore: 1, user: 1, clockInDate: 1 });

const Attendance = mongoose.model('Attendance', AttendanceSchema);
module.exports = Attendance;
