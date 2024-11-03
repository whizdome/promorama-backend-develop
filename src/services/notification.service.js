// const httpError = require('http-errors');

const PushNotification = require('../models/pushNotification.model');
const InAppNotification = require('../models/inAppNotification.model');

const APIFeatures = require('../utils/apiFeatures');
const { ROLE } = require('../helpers/constants');

const subscribeToPushNotification = async (data) => {
  const { userId, deviceToken, deviceFingerprint } = data;

  // Check if the device has already been subscribed for push notification to either refresh the token or create a new subscription
  const existingSub = await PushNotification.findOne({ userId, deviceFingerprint });
  if (existingSub) {
    existingSub.deviceToken = deviceToken;
    return existingSub.save();
  }

  return PushNotification.create(data);
};

const unsubscribeFromPushNotification = (data) => {
  return PushNotification.findOneAndDelete(data);
};

const getInAppNotifications = (currentUser, reqQuery) => {
  let filter = { $or: [{ userId: currentUser.id }, { userId: null }] };
  if (currentUser.role === ROLE.ADMIN || currentUser.role === ROLE.SUPER_ADMIN) {
    filter = { userId: 'admin' };
  }

  const apiFeatures = new APIFeatures(InAppNotification.find(filter), reqQuery)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  return apiFeatures.query;
};

const markInAppNotificationAsRead = (notificationId) => {
  return InAppNotification.findByIdAndUpdate(notificationId, {
    $set: { isRead: true },
  });
};

const markAllInAppNotificationsAsRead = (currentUser) => {
  let filter = { userId: currentUser.id };
  if (currentUser.role === ROLE.ADMIN || currentUser.role === ROLE.SUPER_ADMIN) {
    filter = { userId: 'admin' };
  }

  return InAppNotification.updateMany(filter, { $set: { isRead: true } });
};

module.exports = {
  subscribeToPushNotification,
  unsubscribeFromPushNotification,
  getInAppNotifications,
  markInAppNotificationAsRead,
  markAllInAppNotificationsAsRead,
};
