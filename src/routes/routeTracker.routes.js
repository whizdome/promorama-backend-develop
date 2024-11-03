const express = require('express');

const routeTrackerController = require('../controllers/routeTracker.controller');

const { isLoggedIn, authorize } = require('../middleware/auth.middleware');
const { ROLE } = require('../helpers/constants');

const router = express.Router({ mergeParams: true });

router.use(isLoggedIn);

router.post('/', authorize(ROLE.PROMOTER), routeTrackerController.addNewData);

router.get('/', routeTrackerController.getAllData);

module.exports = router;
