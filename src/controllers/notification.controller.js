const Joi = require('joi');
const httpError = require('http-errors');

const notificationService = require('../services/notification.service');

const subscribeToPushNotification = async (req, res) => {
  const { error } = Joi.object({
    deviceToken: Joi.string().required(),
    deviceFingerprint: Joi.string().required(),
  }).validate(req.body);
  if (error) throw new httpError.BadRequest(error.message);

  await notificationService.subscribeToPushNotification({ userId: req.user.id, ...req.body });

  res.status(201).send({
    status: 'success',
    message: 'Device successfully subscribed to push notifications',
  });
};

const unsubscribeFromPushNotification = async (req, res) => {
  const { deviceFingerprint } = req.query;
  if (!deviceFingerprint || typeof deviceFingerprint !== 'string') {
    throw new httpError.BadRequest('"deviceFingerprint" must be provided in the query params');
  }

  const sub = await notificationService.unsubscribeFromPushNotification({
    userId: req.user.id,
    deviceFingerprint,
  });

  if (!sub) throw new httpError.NotFound('Device not subscribed to push notification');

  res.status(200).send({
    status: 'success',
    message: 'Device successfully unsubscribed from push notifications',
  });
};

const getInAppNotifications = async (req, res) => {
  const notifications = await notificationService.getInAppNotifications(req.user, req.query);

  res.status(200).send({
    status: 'success',
    message: 'In-app notifications retrieved successfully',
    data: notifications,
  });
};

const markInAppNotificationAsRead = async (req, res) => {
  const notification = await notificationService.markInAppNotificationAsRead(
    req.params.notificationId,
  );

  if (!notification) throw new httpError.NotFound('Notification not found');

  res.status(200).send({
    status: 'success',
    message: 'In-app notification marked as read successfully',
  });
};

const markAllInAppNotificationsAsRead = async (req, res) => {
  await notificationService.markAllInAppNotificationsAsRead(req.user);

  res.status(200).send({
    status: 'success',
    message: 'All In-app notifications marked as read successfully',
  });
};

module.exports = {
  subscribeToPushNotification,
  unsubscribeFromPushNotification,
  getInAppNotifications,
  markInAppNotificationAsRead,
  markAllInAppNotificationsAsRead,
};
