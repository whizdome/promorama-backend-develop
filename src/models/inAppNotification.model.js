const mongoose = require('mongoose');
const logger = require('../utils/customLogger');

const InAppNotificationSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      default: null, // Will be null when the notification is for all users
    },

    entityId: {
      type: String,
      default: null, // Will be null when the notification is a generic message
    },

    type: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      required: true,
    },

    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

InAppNotificationSchema.index({ userId: 1 });
InAppNotificationSchema.index({ createdAt: 1 }, { expires: '7d' });

/**
 * @param {{userId: string, entityId: string, type: string, description: string, isRead?: boolean}} data
 */
InAppNotificationSchema.statics.insertNotification = async function (data) {
  try {
    await this.deleteOne(data);
    this.create(data);
  } catch (err) {
    logger.error(`[InAppNotification]: ${err.message}`);
  }
};

/**
 * @param {{userIDs: string[], entityId: string, type: string, description: string, isRead?: boolean}} data
 */
InAppNotificationSchema.statics.insertNotifications = async function (data) {
  data.userIDs.forEach((userId) => {
    this.insertNotification({
      userId,
      entityId: data.entityId,
      type: data.type,
      description: data.description,
    });
  });
};

const InAppNotification = mongoose.model('InApp_Notification', InAppNotificationSchema);
module.exports = InAppNotification;
