const express = require('express');

const attendanceController = require('../controllers/attendance.controller');

const { isLoggedIn, authorize } = require('../middleware/auth.middleware');
const { ROLE } = require('../helpers/constants');

const router = express.Router({ mergeParams: true });

router.use(isLoggedIn);

router.post('/clock-in', authorize(ROLE.PROMOTER, ROLE.SUPERVISOR), attendanceController.clockIn);
router.post('/clock-out', authorize(ROLE.PROMOTER, ROLE.SUPERVISOR), attendanceController.clockOut);

router.get('/', attendanceController.getAttendances);
router.get(
  '/current-clock-in',
  authorize(ROLE.PROMOTER, ROLE.SUPERVISOR),
  attendanceController.getCurrentClockIn,
);
router.get('/aggregate', attendanceController.getAggregateAttendances);
router.get('/aggregate/user', attendanceController.getUserAggregateAttendances);
router.get('/aggregate/users/daily', attendanceController.getUsersDailyAggregateAttendances);
router.get('/aggregate/users/total', attendanceController.getUsersTotalAggregateAttendances);

router.patch(
  '/:attendanceId/tracking',
  authorize(ROLE.PROMOTER, ROLE.SUPERVISOR),
  attendanceController.addTrackingData,
);

module.exports = router;
