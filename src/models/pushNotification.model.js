const mongoose = require('mongoose');

// NB: Users don't subscribe to push notifications, devices do.
const PushNotificationSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },

    deviceToken: {
      type: String,
      unique: true,
      required: true,
    },

    // To identify a device so as to prevent duplicate subscriptions
    deviceFingerprint: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

PushNotificationSchema.index({ userId: 1, deviceFingerprint: 1 });
PushNotificationSchema.index({ updatedAt: 1 }, { expires: '30d' }); // Removes subscriptions that are not renewed within 30 days

PushNotificationSchema.statics.getUserDeviceTokens = async function (userId) {
  const tokens = await this.find({ userId }).distinct('deviceToken');

  return tokens;
};

PushNotificationSchema.statics.getMultipleUsersDeviceTokens = async function (userIDs) {
  const tokens = await this.find({ userId: { $in: userIDs } }).distinct('deviceToken');

  return tokens;
};

const PushNotification = mongoose.model('Push_Notification', PushNotificationSchema);
module.exports = PushNotification;
