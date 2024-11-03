const express = require('express');

const notificationController = require('../controllers/notification.controller');

const { isLoggedIn } = require('../middleware/auth.middleware');

const router = express.Router({ mergeParams: true });

router.post('/push/subscribe', isLoggedIn, notificationController.subscribeToPushNotification);

router.get('/in-app', isLoggedIn, notificationController.getInAppNotifications);

router.patch(
  '/:notificationId/in-app/mark-as-read',
  isLoggedIn,
  notificationController.markInAppNotificationAsRead,
);
router.patch(
  '/in-app/mark-all-as-read',
  isLoggedIn,
  notificationController.markAllInAppNotificationsAsRead,
);

router.delete(
  '/push/unsubscribe',
  isLoggedIn,
  notificationController.unsubscribeFromPushNotification,
);

module.exports = router;
